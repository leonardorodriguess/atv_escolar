from django.core.management.base import BaseCommand
from core.models import User, Turma, Atividade, Questao
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = "Popula o banco com dados de teste"

    def handle(self, *args, **kwargs):
        turma, _ = Turma.objects.get_or_create(nome="Turma A")
        Turma.objects.get_or_create(nome="Turma B")

        prof, created = User.objects.get_or_create(
            email="prof@escola.com",
            defaults={"first_name": "Professor", "role": "PROFESSOR", "is_staff": True, "is_superuser": True},
        )
        if created:
            prof.set_password("admin123")
            prof.save()

        aluno, created = User.objects.get_or_create(
            email="aluno@escola.com",
            defaults={"first_name": "Aluno", "role": "ALUNO", "turma": turma},
        )
        if created:
            aluno.set_password("aluno123")
            aluno.save()

        atividade, created = Atividade.objects.get_or_create(
            titulo="Atividade 1 - POO",
            defaults={
                "descricao": "Atividade sobre Programação Orientada a Objetos.",
                "turma": turma,
                "professor": prof,
                "data_entrega": timezone.now().date() + timedelta(days=7),
            },
        )
        if created:
            Questao.objects.create(atividade=atividade, enunciado="O que é encapsulamento?", ordem=0)
            Questao.objects.create(atividade=atividade, enunciado="Explique herança e polimorfismo.", ordem=1)
            Questao.objects.create(atividade=atividade, enunciado="Dê um exemplo de classe abstrata.", ordem=2)

        self.stdout.write(self.style.SUCCESS("Seed concluído!"))
