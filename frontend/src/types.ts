export interface User {
  id: number;
  email: string;
  first_name: string;
  role: "PROFESSOR" | "ALUNO";
  turma: number | null;
}

export interface Questao {
  id: number;
  enunciado: string;
  ordem: number;
}

export interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  turma: number;
  turma_nome: string;
  professor: number;
  professor_nome: string;
  data_entrega: string;
  criado_em: string;
  questoes: Questao[];
}

export interface Resposta {
  id: number;
  questao: number;
  questao_enunciado: string;
  aluno: number;
  aluno_nome: string;
  texto: string;
  enviado_em: string;
  atualizado_em: string;
}

export interface Avaliacao {
  id: number;
  atividade: number;
  atividade_titulo: string;
  aluno: number;
  aluno_nome: string;
  nota: number;
  feedback: string;
  criado_em: string;
  atualizado_em: string;
}
