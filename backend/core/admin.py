from django.contrib import admin
from .models import User, Turma, Atividade, Questao, Resposta, Avaliacao

admin.site.register(User)
admin.site.register(Turma)
admin.site.register(Atividade)
admin.site.register(Questao)
admin.site.register(Resposta)
admin.site.register(Avaliacao)
