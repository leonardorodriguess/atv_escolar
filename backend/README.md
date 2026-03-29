# Backend — Plataforma de Atividades Escolares

API REST construída com Django 5.1 e Django REST Framework.

## Pré-requisitos

- Python 3.12+
- pip

## Instalação e execução local

### Com PostgreSQL (recomendado)

```bash
# 1. Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Configure as variáveis de ambiente do banco
export DB_NAME=escola
export DB_USER=escola
export DB_PASSWORD=escola123
export DB_HOST=localhost
export DB_PORT=5432

# 4. Gere as migrations (cria os arquivos de migration a partir dos models)
python manage.py makemigrations core

# 5. Aplique as migrations (cria as tabelas no banco)
python manage.py migrate

# 6. Popule o banco com dados de teste
python manage.py seed

# 7. Inicie o servidor de desenvolvimento
python manage.py runserver
```

> Você precisa ter um PostgreSQL rodando localmente. Pode subir apenas o banco via Docker:
> ```bash
> docker run -d --name escola-db -p 5432:5432 \
>   -e POSTGRES_DB=escola -e POSTGRES_USER=escola -e POSTGRES_PASSWORD=escola123 \
>   postgres:16-alpine
> ```

### Com SQLite (sem instalar PostgreSQL)

Se as variáveis `DB_HOST` não estiverem definidas, o Django usa SQLite automaticamente:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py seed
python manage.py runserver
```

O servidor estará disponível em http://localhost:8000.

## Rodando via Docker (isolado)

```bash
docker build -t escola-backend .
docker run -p 8000:8000 \
  -e DEBUG=1 \
  -e SECRET_KEY=dev-secret-key \
  -e CORS_ALLOWED_ORIGINS=http://localhost:5173 \
  escola-backend
```

## Dependências

| Pacote                        | Versão  | Função                          |
|-------------------------------|---------|----------------------------------|
| Django                        | 5.1     | Framework web                    |
| djangorestframework           | 3.15.2  | API REST                         |
| djangorestframework-simplejwt | 5.3.1   | Autenticação JWT                 |
| django-cors-headers           | 4.4.0   | Configuração de CORS             |
| gunicorn                      | 23.0.0  | Servidor WSGI para produção      |
| psycopg2-binary               | 2.9.9   | Driver PostgreSQL para Python    |

| drf-spectacular               | 0.27.2  | Geração de schema OpenAPI / Swagger |

## Estrutura

```
backend/
├── config/
│   ├── settings.py       # Configurações do Django
│   ├── urls.py           # URLs raiz
│   └── wsgi.py           # Entrypoint WSGI
├── core/
│   ├── models.py         # User, Turma, Atividade, Resposta
│   ├── serializers.py    # Serializers DRF
│   ├── views.py          # Views/endpoints da API
│   ├── urls.py           # Rotas da API
│   ├── admin.py          # Registro no Django Admin
│   └── management/
│       └── commands/
│           └── seed.py   # Comando para popular dados de teste
├── Dockerfile
├── entrypoint.sh     # Script de inicialização (wait db + migrations + seed)
├── requirements.txt
└── manage.py
```

## Models

### User (Custom — `AUTH_USER_MODEL`)
| Campo      | Tipo         | Descrição                              |
|------------|--------------|----------------------------------------|
| email      | EmailField   | Login do usuário (unique)              |
| first_name | CharField    | Nome de exibição                       |
| role       | CharField    | `PROFESSOR` ou `ALUNO`                 |
| turma      | FK → Turma   | Turma do aluno (null para professores) |

### Turma
| Campo | Tipo      | Descrição      |
|-------|-----------|----------------|
| nome  | CharField | Nome da turma  |

### Atividade
| Campo        | Tipo           | Descrição                    |
|--------------|----------------|------------------------------|
| titulo       | CharField      | Título da atividade          |
| descricao    | TextField      | Descrição completa           |
| turma        | FK → Turma     | Turma destinatária           |
| professor    | FK → User      | Professor que criou          |
| data_entrega | DateTimeField  | Prazo de entrega             |
| criado_em    | DateTimeField  | Data de criação (auto)       |

### Resposta
| Campo        | Tipo          | Descrição                              |
|--------------|---------------|----------------------------------------|
| atividade    | FK → Atividade| Atividade respondida                   |
| aluno        | FK → User     | Aluno que respondeu                    |
| texto        | TextField     | Conteúdo da resposta                   |
| nota         | DecimalField  | Nota atribuída (0-10, null se pendente)|
| feedback     | TextField     | Feedback do professor (opcional)       |

Constraint: `unique_together = ("atividade", "aluno")` — impede resposta duplicada.

## Endpoints

### Documentação interativa (Swagger)

Com o backend rodando, acesse:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Schema OpenAPI (JSON): http://localhost:8000/api/schema/

Para autenticar no Swagger, clique em "Authorize" e insira: `Bearer <seu_token_jwt>`

### Rotas

| Método | Rota                          | View                    | Permissão   |
|--------|-------------------------------|-------------------------|-------------|
| POST   | `/auth/login`                 | `login_view`            | AllowAny    |
| GET    | `/me`                         | `me_view`               | Autenticado |
| GET    | `/turmas`                     | `turmas_view`           | Autenticado |
| GET    | `/me/atividades`              | `MinhasAtividadesView`  | Autenticado |
| POST   | `/atividades`                 | `CriarAtividadeView`    | Professor   |
| GET    | `/atividades/{id}/respostas/` | `RespostasAtividadeView`| Professor   |
| POST   | `/respostas`                  | `CriarRespostaView`     | Aluno       |
| GET    | `/me/respostas`               | `MinhasRespostasView`   | Aluno       |
| PATCH  | `/respostas/{id}/`            | `EditarRespostaView`    | Ambos       |

## Criação de Tabelas (Migrations)

O Django usa um sistema de migrations para criar e atualizar as tabelas no banco. O processo tem dois passos:

1. `makemigrations core` — analisa os models em `core/models.py` e gera arquivos de migration em `core/migrations/`
2. `migrate` — aplica as migrations no banco, criando as tabelas

As tabelas criadas são:
- `core_user` — usuários (professores e alunos)
- `core_turma` — turmas
- `core_atividade` — atividades criadas pelos professores
- `core_resposta` — respostas dos alunos

No Docker, o `entrypoint.sh` executa ambos os comandos automaticamente ao subir o container. Para rodar manualmente:

```bash
# Via Docker (container rodando)
docker-compose exec backend python manage.py makemigrations core
docker-compose exec backend python manage.py migrate

# Local
python manage.py makemigrations core
python manage.py migrate
```

## Comandos úteis

```bash
# Criar superusuário manualmente
python manage.py createsuperuser

# Acessar o Django Admin
# http://localhost:8000/admin (use o superusuário)

# Rodar o seed novamente (idempotente)
python manage.py seed

# Abrir shell interativo
python manage.py shell
```

## Variáveis de Ambiente

| Variável               | Padrão                  | Descrição                        |
|------------------------|-------------------------|----------------------------------|
| `DEBUG`                | `0`                     | `1` para ativar modo debug       |
| `SECRET_KEY`           | `dev-secret`            | Chave secreta do Django          |
| `ALLOWED_HOSTS`        | `*`                     | Hosts permitidos (CSV)           |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173`  | Origens CORS permitidas (CSV)   |
| `DB_NAME`              | `escola`                | Nome do banco PostgreSQL         |
| `DB_USER`              | `escola`                | Usuário do PostgreSQL            |
| `DB_PASSWORD`          | `escola123`             | Senha do PostgreSQL              |
| `DB_HOST`              | —                       | Host do PostgreSQL (se vazio, usa SQLite) |
| `DB_PORT`              | `5432`                  | Porta do PostgreSQL              |
