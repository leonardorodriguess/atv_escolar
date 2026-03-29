# Frontend — Plataforma de Atividades Escolares

SPA construída com React 18, TypeScript, Vite, Tailwind CSS e componentes no padrão shadcn/ui.

## Pré-requisitos

- Node.js 20+
- npm 9+

## Instalação e execução local

```bash
# 1. Instale as dependências
npm install

# 2. Configure a URL da API (opcional, padrão: http://localhost:8000)
export VITE_API_URL=http://localhost:8000

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em http://localhost:5173.

> O backend precisa estar rodando para a aplicação funcionar.

## Build de produção

```bash
npm run build
npm run preview    # preview local do build
```

Os arquivos estáticos serão gerados em `dist/`.

## Rodando via Docker (isolado)

```bash
docker build -t escola-frontend .
docker run -p 5173:5173 \
  -e VITE_API_URL=http://localhost:8000 \
  escola-frontend
```

## Dependências principais

| Pacote           | Função                                    |
|------------------|-------------------------------------------|
| react            | Biblioteca UI                             |
| react-router-dom | Roteamento SPA                            |
| axios            | Cliente HTTP com interceptor JWT          |
| tailwindcss      | Framework CSS utility-first               |
| lucide-react     | Ícones SVG                                |
| clsx             | Merge condicional de classes              |
| tailwind-merge   | Merge inteligente de classes Tailwind     |

## Estrutura

```
frontend/src/
├── components/
│   └── ui/                # Componentes reutilizáveis (estilo shadcn/ui)
│       ├── badge.tsx       # Badge com variantes (success, warning, destructive)
│       ├── button.tsx      # Botão com variantes e tamanhos
│       ├── card.tsx        # Card, CardHeader, CardTitle, CardContent, CardFooter
│       ├── input.tsx       # Input estilizado
│       ├── label.tsx       # Label para formulários
│       ├── select.tsx      # Select estilizado
│       └── textarea.tsx    # Textarea estilizado
├── lib/
│   └── utils.ts           # Função cn() para merge de classes Tailwind
├── pages/
│   ├── Login.tsx           # Tela de login
│   ├── ProfessorAtividades.tsx  # Dashboard do professor
│   ├── CriarAtividade.tsx       # Formulário de criação
│   ├── CorrigirRespostas.tsx    # Correção com nota e feedback
│   ├── AlunoAtividades.tsx      # Atividades disponíveis + envio
│   └── MinhasRespostas.tsx      # Respostas enviadas + notas
├── api.ts                 # Axios instance com interceptor JWT
├── types.ts               # Interfaces TypeScript (User, Atividade, Resposta)
├── App.tsx                # Rotas e layout principal
├── main.tsx               # Entrypoint React
└── styles.css             # Tailwind directives
```

## Rotas

| Rota                                  | Acesso    | Página                  |
|---------------------------------------|-----------|-------------------------|
| `/login`                              | Público   | Login                   |
| `/professor/atividades`               | Professor | Listagem de atividades  |
| `/professor/criar`                    | Professor | Criar atividade         |
| `/professor/atividades/:id/respostas` | Professor | Corrigir respostas      |
| `/aluno/atividades`                   | Aluno     | Atividades da turma     |
| `/aluno/respostas`                    | Aluno     | Respostas enviadas      |

## Componentes UI

Os componentes em `src/components/ui/` seguem o padrão do [shadcn/ui](https://ui.shadcn.com/):
- Implementados manualmente (sem CLI shadcn)
- Usam `cn()` para merge de classes Tailwind
- Suportam variantes via props (`variant`, `size`)
- Compatíveis com `forwardRef` para composição

## Autenticação

O token JWT é armazenado no `localStorage` com a chave `token`. O interceptor do Axios (`src/api.ts`) injeta automaticamente o header `Authorization: Bearer <token>` em todas as requisições.

Ao fazer logout, o token é removido do `localStorage` e o usuário é redirecionado para `/login`.

## Variáveis de Ambiente

| Variável       | Padrão                  | Descrição          |
|----------------|-------------------------|--------------------|
| `VITE_API_URL` | `http://localhost:8000` | URL base da API    |

> Variáveis com prefixo `VITE_` são expostas ao código client-side pelo Vite.
