# Plataforma de Atividades Escolares

Aplicação web fullstack onde **Professores** criam atividades, corrigem respostas e **Alunos** visualizam atividades e enviam respostas.

## Tecnologias

| Camada   | Stack                                                        |
|----------|--------------------------------------------------------------|
| Backend  | Python 3.12, Django 5.1, Django REST Framework, SimpleJWT    |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide |
| Infra    | Docker, Docker Compose                                       |
| Banco    | PostgreSQL 16                                                |

## Estrutura do Projeto

```
├── backend/                # API REST Django
│   ├── config/             # Configurações Django (settings, urls, wsgi)
│   ├── core/               # App principal (models, views, serializers)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md           # Documentação específica do backend
├── frontend/               # SPA React
│   ├── src/
│   │   ├── components/ui/  # Componentes shadcn/ui (Button, Card, Input...)
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/            # Utilitários (cn)
│   │   ├── api.ts          # Cliente HTTP Axios
│   │   └── types.ts        # Tipagens TypeScript
│   ├── Dockerfile
│   ├── package.json
│   └── README.md           # Documentação específica do frontend
├── docker-compose.yml
└── README.md               # Este arquivo
```

## Como Rodar (Docker — recomendado)

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (>= 20.x)
- [Docker Compose](https://docs.docker.com/compose/install/) (>= 2.x)

### Passo a passo

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd <nome-do-repositorio>

# 2. Suba os containers
docker-compose up --build
```

Ao iniciar, o backend automaticamente:
- Aguarda o PostgreSQL ficar disponível
- Gera as migrations do app `core` (`makemigrations core`)
- Aplica as migrations no banco (`migrate`) — cria as tabelas User, Turma, Atividade e Resposta
- Executa o seed com dados de teste (turmas, professor, aluno, atividade)

### Acessos

| Serviço  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| Swagger  | http://localhost:8000/api/docs/ |
| ReDoc    | http://localhost:8000/api/redoc/ |
| Admin    | http://localhost:8000/admin |

### Usuários de teste (criados automaticamente pelo seed)

| Papel     | E-mail            | Senha     |
|-----------|-------------------|-----------|
| Professor | prof@escola.com   | admin123  |
| Aluno     | aluno@escola.com  | aluno123  |

### Parar a aplicação

```bash
docker-compose down
```

### Resetar o banco de dados

```bash
docker-compose down -v     # -v remove o volume do PostgreSQL
docker-compose up --build
```

## Como Rodar sem Docker (desenvolvimento local)

Caso prefira rodar cada serviço separadamente na sua máquina, consulte:

- [backend/README.md](./backend/README.md) — instruções para rodar o Django localmente
- [frontend/README.md](./frontend/README.md) — instruções para rodar o React localmente

## Decisões Técnicas

### Arquitetura

- **Monorepo** com `backend/` e `frontend/` separados, cada um com seu Dockerfile.
- Um único `docker-compose.yml` orquestra ambos os serviços.
- Comunicação via REST API com autenticação JWT (token no header `Authorization: Bearer <token>`).

### Backend

- **Custom User Model** (`core.User`) com campo `role` (PROFESSOR | ALUNO) e FK para `Turma`.
- **SimpleJWT** para emissão e validação de tokens. Access token com validade de 12h.
- **Permissões customizadas** (`IsProfessor`, `IsAluno`) aplicadas por view.
- **PostgreSQL 16** como banco de dados, rodando em container Docker com volume persistente.
- **Fallback para SQLite** quando as variáveis `DB_HOST` não estão definidas (dev local sem Docker).
- **Seed automático** via management command (`python manage.py seed`).

### Frontend

- **Vite** como bundler para hot reload rápido.
- **Tailwind CSS** para estilização utility-first.
- **Componentes UI no padrão shadcn/ui** (Card, Button, Input, Badge, etc.) — implementados manualmente sem dependência do CLI shadcn.
- **Lucide React** para ícones consistentes.
- **Axios interceptor** injeta o JWT automaticamente em todas as requisições.
- **Rotas protegidas** por role — Professor e Aluno veem telas diferentes.

### Regras de Negócio Implementadas

- Aluno deve pertencer a uma turma para ver atividades.
- Aluno não pode enviar mais de uma resposta para a mesma atividade.
- Aluno não acessa atividades de outra turma.
- Aluno pode editar resposta antes da data de entrega.
- Professor só corrige atividades que ele criou.
- Professor pode editar nota e feedback.
- Nota obrigatória, entre 0 e 10. Feedback opcional.

## Endpoints da API

| Método | Rota                          | Acesso      | Descrição                              |
|--------|-------------------------------|-------------|----------------------------------------|
| POST   | `/auth/login`                 | Público     | Login (retorna JWT + dados do usuário) |
| GET    | `/me`                         | Autenticado | Dados do usuário logado                |
| GET    | `/turmas`                     | Autenticado | Lista todas as turmas                  |
| GET    | `/me/atividades`              | Ambos       | Professor: suas atividades / Aluno: atividades da turma |
| POST   | `/atividades`                 | Professor   | Criar nova atividade                   |
| GET    | `/atividades/{id}/respostas/` | Professor   | Respostas dos alunos para uma atividade |
| POST   | `/respostas`                  | Aluno       | Enviar resposta para uma atividade     |
| GET    | `/me/respostas`               | Aluno       | Listar respostas enviadas              |
| PATCH  | `/respostas/{id}/`            | Ambos       | Aluno: editar texto / Professor: nota e feedback |

## Variáveis de Ambiente

| Variável               | Serviço  | Padrão                          | Descrição                    |
|------------------------|----------|---------------------------------|------------------------------|
| `DEBUG`                | Backend  | `0`                             | Modo debug do Django         |
| `SECRET_KEY`           | Backend  | `dev-secret`                    | Chave secreta do Django      |
| `ALLOWED_HOSTS`        | Backend  | `*`                             | Hosts permitidos             |
| `CORS_ALLOWED_ORIGINS` | Backend  | `http://localhost:5173`         | Origens CORS permitidas      |
| `DB_NAME`              | Backend  | `escola`                        | Nome do banco PostgreSQL     |
| `DB_USER`              | Backend  | `escola`                        | Usuário do PostgreSQL        |
| `DB_PASSWORD`          | Backend  | `escola123`                     | Senha do PostgreSQL          |
| `DB_HOST`              | Backend  | `db`                            | Host do PostgreSQL           |
| `DB_PORT`              | Backend  | `5432`                          | Porta do PostgreSQL          |
| `VITE_API_URL`         | Frontend | `http://localhost:8000`         | URL base da API              |
