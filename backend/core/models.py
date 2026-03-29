from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email obrigatório")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "PROFESSOR")
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [("PROFESSOR", "Professor"), ("ALUNO", "Aluno")]
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    turma = models.ForeignKey("Turma", null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    def __str__(self):
        return self.email


class Turma(models.Model):
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.nome


class Atividade(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField()
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name="atividades")
    professor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="atividades")
    data_entrega = models.DateField()
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


class Questao(models.Model):
    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="questoes")
    enunciado = models.TextField()
    ordem = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["ordem"]

    def __str__(self):
        return f"Q{self.ordem} - {self.atividade.titulo}"


class Resposta(models.Model):
    questao = models.ForeignKey(Questao, on_delete=models.CASCADE, related_name="respostas")
    aluno = models.ForeignKey(User, on_delete=models.CASCADE, related_name="respostas")
    texto = models.TextField()
    enviado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("questao", "aluno")

    def __str__(self):
        return f"{self.aluno} - {self.questao}"


class Avaliacao(models.Model):
    atividade = models.ForeignKey(Atividade, on_delete=models.CASCADE, related_name="avaliacoes")
    aluno = models.ForeignKey(User, on_delete=models.CASCADE, related_name="avaliacoes")
    nota = models.DecimalField(max_digits=4, decimal_places=2)
    feedback = models.TextField(blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("atividade", "aluno")

    def __str__(self):
        return f"{self.aluno} - {self.atividade} - {self.nota}"
