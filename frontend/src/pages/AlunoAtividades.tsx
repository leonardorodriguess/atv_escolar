import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Atividade } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar, ClipboardList, Eye, CheckCircle2, Pencil } from "lucide-react";

export default function AlunoAtividades() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [respondidas, setRespondidas] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get("/me/atividades").then((r) => setAtividades(r.data));
    api.get("/me/atividades-respondidas").then((r) => setRespondidas(new Set(r.data)));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atividades Disponíveis</h1>
        <p className="text-muted-foreground">Visualize e responda as atividades da sua turma</p>
      </div>
      {atividades.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma atividade disponível.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {atividades.map((a) => {
            const aberta = new Date(a.data_entrega) > new Date();
            const jaRespondeu = respondidas.has(a.id);
            return (
              <Card key={a.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{a.titulo}</CardTitle>
                    <div className="flex gap-1.5">
                      {jaRespondeu && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Respondida</Badge>}
                      <Badge variant={aberta ? "success" : "destructive"}>{aberta ? "Aberta" : "Encerrada"}</Badge>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-3">{a.descricao}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Entrega: {new Date(a.data_entrega).toLocaleDateString("pt-BR")}</span>
                    <span>{a.questoes.length} questão(ões)</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {jaRespondeu && aberta ? (
                    <Link to={`/aluno/atividades/${a.id}?editar=1`}>
                      <Button variant="outline" size="sm" className="gap-2"><Pencil className="h-3.5 w-3.5" />Editar Respostas</Button>
                    </Link>
                  ) : jaRespondeu ? (
                    <p className="text-sm text-muted-foreground">Atividade encerrada. Respostas não podem ser editadas.</p>
                  ) : aberta ? (
                    <Link to={`/aluno/atividades/${a.id}`}>
                      <Button variant="outline" size="sm" className="gap-2"><Eye className="h-3.5 w-3.5" />Responder</Button>
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Atividade encerrada.</p>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
