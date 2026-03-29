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
git clone https://github.com/leonardorodriguess/atv_escolar.git
cd atv_escolar

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
- Aluno só pode enviar respostas uma única vez por atividade, mas pode editar antes da data de entrega (se ainda não foi avaliado).
- Aluno não acessa atividades de outra turma.
- Professor pode reativar uma atividade para um aluno, permitindo novo envio.
- Professor só corrige atividades que ele criou.
- Professor pode editar nota e feedback.
- Professor pode criar turmas e visualizar os alunos matriculados.
- Nota obrigatória, entre 0 e 10. Feedback opcional.

## Endpoints da API

| Método | Rota                              | Acesso      | Descrição                              |
|--------|-----------------------------------|-------------|----------------------------------------|
| POST   | `/auth/login`                     | Público     | Login (retorna JWT + dados do usuário) |
| GET    | `/me`                             | Autenticado | Dados do usuário logado                |
| GET    | `/turmas`                         | Autenticado | Lista todas as turmas                  |
| POST   | `/turmas/criar`                   | Professor   | Criar nova turma                       |
| GET    | `/turmas/{id}/alunos/`            | Professor   | Listar alunos de uma turma             |
| GET    | `/me/atividades`                  | Ambos       | Professor: suas atividades / Aluno: atividades da turma |
| POST   | `/atividades`                     | Professor   | Criar nova atividade                   |
| GET    | `/atividades/{id}/respostas/`     | Professor   | Respostas dos alunos para uma atividade |
| POST   | `/atividades/{id}/reativar/`      | Professor   | Reativar atividade para um aluno       |
| POST   | `/respostas`                      | Aluno       | Enviar respostas (envio único)         |
| PATCH  | `/respostas/{id}/`                | Ambos       | Aluno: editar texto / Professor: nota e feedback |
| GET    | `/me/respostas`                   | Aluno       | Listar respostas enviadas com notas    |
| GET    | `/me/respostas/atividade/{id}/`   | Aluno       | Respostas do aluno em uma atividade    |
| GET    | `/me/atividades-respondidas`      | Aluno       | IDs de atividades já respondidas       |

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


## Possíveis Melhorias

### Avaliação e Notas

- **Nota por questão**: Permitir que o professor atribua uma nota individual para cada questão da atividade, em vez de uma nota única por atividade. Isso daria um feedback mais granular ao aluno.
- **Valor/peso por questão**: Ao criar a atividade, o professor poderia definir o valor (pontuação máxima) de cada questão. A nota final seria calculada automaticamente com base nos pesos.
- **Nota automática com gabarito**: Para questões objetivas, o professor poderia cadastrar a resposta esperada e o sistema corrigiria automaticamente.
- **Média do aluno**: Dashboard com média geral do aluno considerando todas as atividades avaliadas.

### Gestão de Turmas e Alunos

- **Matricular/remover alunos pela interface**: Hoje a associação aluno → turma é feita via seed ou Django admin. O professor poderia gerenciar isso diretamente pela plataforma.
- **Cadastro de alunos pelo professor**: Permitir que o professor cadastre novos alunos e já os associe a uma turma.
- **Importação em lote (CSV)**: Upload de planilha com lista de alunos para cadastro em massa.
- **Aluno em múltiplas turmas**: Atualmente cada aluno pertence a uma única turma. Suportar múltiplas turmas via relação ManyToMany.

### Atividades

- **Tipos de questão**: Além de texto livre, suportar múltipla escolha, verdadeiro/falso e preenchimento de lacunas.
- **Anexos**: Permitir upload de arquivos (PDF, imagens) tanto nas questões quanto nas respostas.
- **Rascunho de atividade**: Professor poderia salvar atividades como rascunho antes de publicar para a turma.
- **Duplicar atividade**: Copiar uma atividade existente para outra turma ou período.
- **Ordenação e filtros**: Filtrar atividades por turma, status (aberta/encerrada) e período.

### Experiência do Aluno

- **Rascunho de respostas**: Salvar respostas parciais antes do envio definitivo (auto-save).
- **Notificações**: Avisar o aluno quando uma nova atividade for criada ou quando receber uma avaliação.
- **Histórico de notas**: Página com histórico completo de notas e evolução ao longo do tempo.

### Infraestrutura e Segurança

- **Refresh token automático**: Renovar o token JWT automaticamente quando estiver próximo de expirar.
- **Rate limiting**: Limitar tentativas de login para prevenir brute force.
- **Logs de auditoria**: Registrar ações importantes (envio de respostas, avaliações, reativações).
- **Testes automatizados**: Cobertura de testes unitários e de integração no backend e frontend.
- **CI/CD**: Pipeline de deploy automatizado com testes, lint e build.
