from rest_framework import serializers
from .models import User, Turma, Atividade, Questao, Resposta, Avaliacao


class UserSerializer(serializers.ModelSerializer):
    turma_nome = serializers.CharField(source="turma.nome", read_only=True, default=None)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "role", "turma", "turma_nome"]


class TurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turma
        fields = ["id", "nome"]


class QuestaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Questao
        fields = ["id", "enunciado", "ordem"]


class AtividadeSerializer(serializers.ModelSerializer):
    professor_nome = serializers.CharField(source="professor.first_name", read_only=True)
    turma_nome = serializers.CharField(source="turma.nome", read_only=True)
    questoes = QuestaoSerializer(many=True, read_only=True)

    class Meta:
        model = Atividade
        fields = ["id", "titulo", "descricao", "turma", "turma_nome", "professor", "professor_nome", "data_entrega", "criado_em", "questoes"]
        read_only_fields = ["professor", "criado_em"]


class AtividadeCriarSerializer(serializers.ModelSerializer):
    questoes = QuestaoSerializer(many=True)

    class Meta:
        model = Atividade
        fields = ["titulo", "descricao", "turma", "data_entrega", "questoes"]

    def create(self, validated_data):
        questoes_data = validated_data.pop("questoes")
        atividade = Atividade.objects.create(**validated_data)
        for i, q in enumerate(questoes_data):
            Questao.objects.create(atividade=atividade, enunciado=q["enunciado"], ordem=q.get("ordem", i))
        return atividade


class RespostaSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source="aluno.first_name", read_only=True)
    questao_enunciado = serializers.CharField(source="questao.enunciado", read_only=True)

    class Meta:
        model = Resposta
        fields = ["id", "questao", "questao_enunciado", "aluno", "aluno_nome", "texto", "enviado_em", "atualizado_em"]
        read_only_fields = ["aluno", "enviado_em", "atualizado_em"]


class AvaliacaoSerializer(serializers.ModelSerializer):
    aluno_nome = serializers.CharField(source="aluno.first_name", read_only=True)
    atividade_titulo = serializers.CharField(source="atividade.titulo", read_only=True)

    class Meta:
        model = Avaliacao
        fields = ["id", "atividade", "atividade_titulo", "aluno", "aluno_nome", "nota", "feedback", "criado_em", "atualizado_em"]
        read_only_fields = ["criado_em", "atualizado_em"]


class AlunoRespostasAtividadeSerializer(serializers.Serializer):
    """Agrupa respostas de um aluno por atividade, com avaliação."""
    atividade_id = serializers.IntegerField()
    atividade_titulo = serializers.CharField()
    respostas = RespostaSerializer(many=True)
    avaliacao = AvaliacaoSerializer(allow_null=True)
