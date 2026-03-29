import { useState, useEffect } from "react";
import api from "../api";
import { Resposta, Avaliacao } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Clock, MessageSquare, Star } from "lucide-react";

interface AtividadeRespostas {
  atividade_id: number;
  atividade_titulo: string;
  respostas: Resposta[];
  avaliacao: Avaliacao | null;
}

export default function MinhasRespostas() {
  const [dados, setDados] = useState<AtividadeRespostas[]>([]);

  useEffect(() => {
    api.get("/me/respostas").then((r) => setDados(r.data));
  }, []);

  const total = dados.length;
  const corrigidas = dados.filter((d) => d.avaliacao).length;
  const pendentes = total - corrigidas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minhas Respostas</h1>
        <p className="text-muted-foreground">Acompanhe suas respostas e notas</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Atividades respondidas</CardDescription>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Corrigidas</CardDescription>
            <Star className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">{corrigidas}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pendentes</CardDescription>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-600">{pendentes}</p></CardContent>
        </Card>
      </div>

      {dados.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma resposta enviada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {dados.map((d) => (
            <Card key={d.atividade_id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{d.atividade_titulo}</CardTitle>
                  {d.avaliacao ? (
                    <Badge variant="success" className="text-sm">Nota: {d.avaliacao.nota}</Badge>
                  ) : (
                    <Badge variant="warning">Aguardando correção</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.respostas.map((r, i) => (
                  <div key={r.id} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Questão {i + 1}: {r.questao_enunciado}</p>
                    <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{r.texto}</div>
                  </div>
                ))}
                {d.avaliacao?.feedback && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">Feedback do Professor</p>
                    <p className="text-sm text-emerald-900">{d.avaliacao.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
