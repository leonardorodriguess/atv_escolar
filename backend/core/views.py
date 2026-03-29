from rest_framework import generics, permissions, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .models import User, Atividade, Questao, Resposta, Avaliacao, Turma
from .serializers import (
    AtividadeSerializer, AtividadeCriarSerializer, RespostaSerializer,
    AvaliacaoSerializer, UserSerializer, TurmaSerializer, AlunoRespostasAtividadeSerializer,
)


class IsProfessor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "PROFESSOR"


class IsAluno(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == "ALUNO"


class LoginRequestSerializer(drf_serializers.Serializer):
    email = drf_serializers.EmailField(help_text="E-mail do usuário")
    senha = drf_serializers.CharField(help_text="Senha do usuário")


class LoginResponseSerializer(drf_serializers.Serializer):
    access = drf_serializers.CharField(help_text="Token JWT de acesso")
    refresh = drf_serializers.CharField(help_text="Token JWT de refresh")
    user = UserSerializer()


@extend_schema(tags=["Autenticação"], summary="Login", request=LoginRequestSerializer, responses={200: LoginResponseSerializer, 400: OpenApiResponse(description="Credenciais inválidas")})
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    email = request.data.get("email")
    senha = request.data.get("senha")
    user = authenticate(request, email=email, password=senha)
    if not user:
        return Response({"detail": "Credenciais inválidas"}, status=400)
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data})


@extend_schema(tags=["Autenticação"], summary="Dados do usuário logado", responses={200: UserSerializer})
@api_view(["GET"])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@extend_schema(tags=["Turmas"], summary="Listar turmas", responses={200: TurmaSerializer(many=True)})
@api_view(["GET"])
def turmas_view(request):
    return Response(TurmaSerializer(Turma.objects.all(), many=True).data)


@extend_schema(tags=["Atividades"], summary="Minhas atividades", description="Professor: atividades criadas. Aluno: atividades da turma. Inclui questões.", responses={200: AtividadeSerializer(many=True)})
class MinhasAtividadesView(generics.ListAPIView):
    serializer_class = AtividadeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "PROFESSOR":
            return Atividade.objects.filter(professor=user).prefetch_related("questoes").order_by("-criado_em")
        return Atividade.objects.filter(turma=user.turma).prefetch_related("questoes").order_by("-data_entrega")


@extend_schema(tags=["Atividades"], summary="Criar atividade com questões", description="Cria atividade com uma ou mais questões. Apenas Professor.", request=AtividadeCriarSerializer, responses={201: AtividadeSerializer})
class CriarAtividadeView(generics.CreateAPIView):
    serializer_class = AtividadeCriarSerializer
    permission_classes = [permissions.IsAuthenticated, IsProfessor]

    def perform_create(self, serializer):
        serializer.save(professor=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        atividade = Atividade.objects.prefetch_related("questoes").get(pk=serializer.instance.pk)
        return Response(AtividadeSerializer(atividade).data, status=201)


@extend_schema(tags=["Respostas"], summary="Respostas de uma atividade (por aluno)", description="Professor vê respostas agrupadas por aluno, com avaliação se existir.")
@api_view(["GET"])
def respostas_atividade_view(request, atividade_id):
    if request.user.role != "PROFESSOR":
        return Response({"detail": "Sem permissão"}, status=403)
    try:
        atividade = Atividade.objects.get(id=atividade_id, professor=request.user)
    except Atividade.DoesNotExist:
        return Response({"detail": "Atividade não encontrada"}, status=404)

    questoes = atividade.questoes.all()
    respostas = Resposta.objects.filter(questao__in=questoes).select_related("aluno", "questao")
    avaliacoes = {a.aluno_id: a for a in Avaliacao.objects.filter(atividade=atividade)}

    alunos_map: dict = {}
    for r in respostas:
        if r.aluno_id not in alunos_map:
            alunos_map[r.aluno_id] = {"aluno_id": r.aluno_id, "aluno_nome": r.aluno.first_name, "respostas": []}
        alunos_map[r.aluno_id]["respostas"].append(RespostaSerializer(r).data)

    result = []
    for aluno_id, data in alunos_map.items():
        av = avaliacoes.get(aluno_id)
        result.append({
            "aluno_id": data["aluno_id"],
            "aluno_nome": data["aluno_nome"],
            "respostas": data["respostas"],
            "avaliacao": AvaliacaoSerializer(av).data if av else None,
        })
    return Response(result)


@extend_schema(tags=["Respostas"], summary="Enviar respostas", description="Aluno envia respostas para todas as questões de uma atividade de uma vez. Body: {atividade: ID, respostas: [{questao: ID, texto: '...'}]}")
@api_view(["POST"])
def criar_respostas_view(request):
    user = request.user
    if user.role != "ALUNO":
        return Response({"detail": "Sem permissão"}, status=403)

    atividade_id = request.data.get("atividade")
    respostas_data = request.data.get("respostas", [])

    try:
        atividade = Atividade.objects.get(id=atividade_id)
    except Atividade.DoesNotExist:
        return Response({"detail": "Atividade não encontrada"}, status=404)

    if atividade.turma != user.turma:
        return Response({"detail": "Você não pertence a esta turma"}, status=403)

    questao_ids = set(atividade.questoes.values_list("id", flat=True))
    if Resposta.objects.filter(questao_id__in=questao_ids, aluno=user).exists():
        return Response({"detail": "Você já enviou respostas para esta atividade"}, status=400)

    criadas = []
    for r in respostas_data:
        qid = r.get("questao")
        if qid not in questao_ids:
            return Response({"detail": f"Questão {qid} não pertence a esta atividade"}, status=400)
        criadas.append(Resposta(questao_id=qid, aluno=user, texto=r.get("texto", "")))

    Resposta.objects.bulk_create(criadas)
    return Response({"detail": "Respostas enviadas"}, status=201)


@extend_schema(tags=["Respostas"], summary="Minhas respostas (Aluno)", description="Lista respostas agrupadas por atividade, com avaliação.")
@api_view(["GET"])
def minhas_respostas_view(request):
    user = request.user
    if user.role != "ALUNO":
        return Response({"detail": "Sem permissão"}, status=403)

    respostas = Resposta.objects.filter(aluno=user).select_related("questao__atividade")
    avaliacoes = {a.atividade_id: a for a in Avaliacao.objects.filter(aluno=user)}

    atividades_map: dict = {}
    for r in respostas:
        aid = r.questao.atividade_id
        if aid not in atividades_map:
            atividades_map[aid] = {"atividade_id": aid, "atividade_titulo": r.questao.atividade.titulo, "respostas": []}
        atividades_map[aid]["respostas"].append(RespostaSerializer(r).data)

    result = []
    for aid, data in atividades_map.items():
        av = avaliacoes.get(aid)
        result.append({
            "atividade_id": data["atividade_id"],
            "atividade_titulo": data["atividade_titulo"],
            "respostas": data["respostas"],
            "avaliacao": AvaliacaoSerializer(av).data if av else None,
        })
    return Response(result)


@extend_schema(tags=["Respostas"], summary="Editar resposta (Aluno)", description="Aluno edita texto de uma resposta antes da data de entrega.")
@api_view(["PATCH"])
def editar_resposta_view(request, pk):
    user = request.user
    try:
        resposta = Resposta.objects.select_related("questao__atividade").get(pk=pk)
    except Resposta.DoesNotExist:
        return Response({"detail": "Resposta não encontrada"}, status=404)

    if user.role == "ALUNO":
        if resposta.aluno != user:
            return Response({"detail": "Sem permissão"}, status=403)
        if resposta.questao.atividade.data_entrega < timezone.now().date():
            return Response({"detail": "Prazo de entrega expirado"}, status=400)
        resposta.texto = request.data.get("texto", resposta.texto)
        resposta.save()
        return Response(RespostaSerializer(resposta).data)

    return Response({"detail": "Sem permissão"}, status=403)


@extend_schema(tags=["Avaliações"], summary="Avaliar aluno (Professor)", description="Professor atribui nota (0-10) e feedback para um aluno em uma atividade. Cria ou atualiza a avaliação.")
@api_view(["POST"])
def avaliar_view(request, atividade_id):
    user = request.user
    if user.role != "PROFESSOR":
        return Response({"detail": "Sem permissão"}, status=403)

    try:
        atividade = Atividade.objects.get(id=atividade_id, professor=user)
    except Atividade.DoesNotExist:
        return Response({"detail": "Atividade não encontrada"}, status=404)

    aluno_id = request.data.get("aluno")
    nota = request.data.get("nota")
    feedback = request.data.get("feedback", "")

    if nota is None:
        return Response({"detail": "Nota é obrigatória"}, status=400)
    try:
        nota = float(nota)
    except (ValueError, TypeError):
        return Response({"detail": "Nota inválida"}, status=400)
    if nota < 0 or nota > 10:
        return Response({"detail": "Nota deve estar entre 0 e 10"}, status=400)

    avaliacao, _ = Avaliacao.objects.update_or_create(
        atividade=atividade, aluno_id=aluno_id,
        defaults={"nota": nota, "feedback": feedback},
    )
    return Response(AvaliacaoSerializer(avaliacao).data)


@extend_schema(tags=["Respostas"], summary="Atividades já respondidas (Aluno)", description="Retorna lista de IDs de atividades que o aluno já respondeu.")
@api_view(["GET"])
def atividades_respondidas_view(request):
    user = request.user
    if user.role != "ALUNO":
        return Response({"detail": "Sem permissão"}, status=403)
    ids = Resposta.objects.filter(aluno=user).values_list("questao__atividade_id", flat=True).distinct()
    return Response(list(ids))


@extend_schema(tags=["Respostas"], summary="Reativar atividade para aluno (Professor)", description="Remove as respostas e avaliação de um aluno em uma atividade, permitindo que ele responda novamente.")
@api_view(["POST"])
def reativar_view(request, atividade_id):
    user = request.user
    if user.role != "PROFESSOR":
        return Response({"detail": "Sem permissão"}, status=403)

    try:
        atividade = Atividade.objects.get(id=atividade_id, professor=user)
    except Atividade.DoesNotExist:
        return Response({"detail": "Atividade não encontrada"}, status=404)

    aluno_id = request.data.get("aluno")
    if not aluno_id:
        return Response({"detail": "ID do aluno é obrigatório"}, status=400)

    questao_ids = atividade.questoes.values_list("id", flat=True)
    deletadas = Resposta.objects.filter(questao_id__in=questao_ids, aluno_id=aluno_id).delete()[0]
    Avaliacao.objects.filter(atividade=atividade, aluno_id=aluno_id).delete()

    return Response({"detail": f"Atividade reativada. {deletadas} resposta(s) removida(s)."})
