import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { Resposta, Avaliacao } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, CheckCircle2, Loader2, MessageSquare, RotateCcw } from "lucide-react";

interface AlunoRespostas {
  aluno_id: number;
  aluno_nome: string;
  respostas: Resposta[];
  avaliacao: Avaliacao | null;
}

export default function CorrigirRespostas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState<AlunoRespostas[]>([]);
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState<number | null>(null);
  const [sucesso, setSucesso] = useState<number | null>(null);
  const [reativando, setReativando] = useState<number | null>(null);

  const carregarDados = () => {
    api.get(`/atividades/${id}/respostas/`).then((r) => {
      setDados(r.data);
      const n: Record<number, string> = {};
      const f: Record<number, string> = {};
      r.data.forEach((d: AlunoRespostas) => {
        n[d.aluno_id] = d.avaliacao ? String(d.avaliacao.nota) : "";
        f[d.aluno_id] = d.avaliacao?.feedback || "";
      });
      setNotas(n);
      setFeedbacks(f);
    });
  };

  useEffect(() => { carregarDados(); }, [id]);

  const avaliar = async (alunoId: number) => {
    setSalvando(alunoId);
    setSucesso(null);
    try {
      await api.post(`/atividades/${id}/avaliar/`, {
        aluno: alunoId, nota: Number(notas[alunoId]), feedback: feedbacks[alunoId],
      });
      setSucesso(alunoId);
      setTimeout(() => navigate("/professor/atividades"), 1000);
    } catch { /* erro */ }
    finally { setSalvando(null); }
  };

  const reativar = async (alunoId: number) => {
    if (!confirm("Isso vai apagar as respostas e a nota deste aluno. Deseja continuar?")) return;
    setReativando(alunoId);
    try {
      await api.post(`/atividades/${id}/reativar/`, { aluno: alunoId });
      carregarDados();
    } catch { /* erro */ }
    finally { setReativando(null); }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Correção de Respostas</h1>
        <p className="text-muted-foreground">{dados.length} aluno(s) responderam</p>
      </div>
      {dados.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma resposta enviada ainda.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {dados.map((d) => (
            <Card key={d.aluno_id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{d.aluno_nome}</CardTitle>
                  {d.avaliacao ? (
                    <Badge variant="success">Nota: {d.avaliacao.nota}</Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  )}
                </div>
                <CardDescription>{d.respostas.length} questão(ões) respondida(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.respostas.map((r, i) => (
                  <div key={r.id} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Questão {i + 1}: {r.questao_enunciado}</p>
                    <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{r.texto}</div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-semibold">Avaliação geral</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`nota-${d.aluno_id}`}>Nota (0-10)</Label>
                      <Input id={`nota-${d.aluno_id}`} type="number" min="0" max="10" step="0.01" value={notas[d.aluno_id] || ""} onChange={(e) => setNotas({ ...notas, [d.aluno_id]: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`fb-${d.aluno_id}`}>Feedback (opcional)</Label>
                      <Textarea id={`fb-${d.aluno_id}`} value={feedbacks[d.aluno_id] || ""} onChange={(e) => setFeedbacks({ ...feedbacks, [d.aluno_id]: e.target.value })} rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={() => avaliar(d.aluno_id)} disabled={salvando === d.aluno_id} className="gap-2">
                      {salvando === d.aluno_id ? <Loader2 className="h-4 w-4 animate-spin" /> : sucesso === d.aluno_id ? <CheckCircle2 className="h-4 w-4" /> : null}
                      {sucesso === d.aluno_id ? "Salvo!" : "Salvar Avaliação"}
                    </Button>
                    <Button variant="outline" onClick={() => reativar(d.aluno_id)} disabled={reativando === d.aluno_id} className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50">
                      {reativando === d.aluno_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Reativar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
