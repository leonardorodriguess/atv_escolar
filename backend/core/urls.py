from django.urls import path
from . import views

urlpatterns = [
    path("auth/login", views.login_view),
    path("me", views.me_view),
    path("turmas", views.turmas_view),
    path("turmas/criar", views.criar_turma_view),
    path("turmas/<int:turma_id>/alunos/", views.alunos_turma_view),
    path("me/atividades-respondidas", views.atividades_respondidas_view),
    path("me/atividades", views.MinhasAtividadesView.as_view()),
    path("me/respostas", views.minhas_respostas_view),
    path("atividades", views.CriarAtividadeView.as_view()),
    path("atividades/<int:atividade_id>/respostas/", views.respostas_atividade_view),
    path("atividades/<int:atividade_id>/reativar/", views.reativar_view),
    path("respostas", views.criar_respostas_view),
    path("respostas/<int:pk>/", views.editar_resposta_view),
    path("me/respostas/atividade/<int:atividade_id>/", views.minhas_respostas_atividade_view),
]
