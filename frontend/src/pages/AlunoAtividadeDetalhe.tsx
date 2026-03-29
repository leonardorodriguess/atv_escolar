import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { Atividade } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { ArrowLeft, Calendar, Loader2, Send, CheckCircle2, ShieldAlert } from "lucide-react";

export default function AlunoAtividadeDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [textos, setTextos] = useState<Record<number, string>>({});
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/me/atividades").then((r) => {
      const found = r.data.find((a: Atividade) => a.id === Number(id));
      if (found) setAtividade(found);
    });
    api.get("/me/atividades-respondidas").then((r) => {
      if ((r.data as number[]).includes(Number(id))) setJaRespondeu(true);
    });
  }, [id]);

  const enviar = async () => {
    if (!atividade || jaRespondeu) return;
    const resps = atividade.questoes.map((q) => ({ questao: q.id, texto: textos[q.id] || "" }));
    if (resps.some((r) => !r.texto.trim())) { setErro("Responda todas as questões"); return; }
    setEnviando(true);
    setErro("");
    try {
      await api.post("/respostas", { atividade: atividade.id, respostas: resps });
      setSucesso(true);
      setTimeout(() => navigate("/aluno/respostas"), 1000);
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao enviar");
    } finally { setEnviando(false); }
  };

  if (!atividade) return <p className="text-muted-foreground">Carregando...</p>;
  const aberta = new Date(atividade.data_entrega) > new Date();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>{atividade.titulo}</CardTitle>
            <div className="flex gap-1.5">
              {jaRespondeu && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Respondida</Badge>}
              <Badge variant={aberta ? "success" : "destructive"}>{aberta ? "Aberta" : "Encerrada"}</Badge>
            </div>
          </div>
          <CardDescription>{atividade.descricao}</CardDescription>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Entrega: {new Date(atividade.data_entrega).toLocaleDateString("pt-BR")}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {jaRespondeu ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-amber-200 bg-amber-50 py-8">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
              <p className="text-sm font-medium text-amber-800">Você já enviou suas respostas para esta atividade.</p>
              <p className="text-xs text-amber-600">Caso precise alterar, solicite ao professor para reativar a atividade.</p>
            </div>
          ) : !aberta ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-red-200 bg-red-50 py-8">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-800">Atividade encerrada.</p>
            </div>
          ) : (
            <>
              {atividade.questoes.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    {q.enunciado}
                  </Label>
                  <Textarea
                    value={textos[q.id] || ""}
                    onChange={(e) => setTextos({ ...textos, [q.id]: e.target.value })}
                    placeholder="Sua resposta..."
                    rows={3}
                  />
                </div>
              ))}
              {erro && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>}
              <Button onClick={enviar} disabled={enviando} className="w-full gap-2">
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : sucesso ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {sucesso ? "Enviado!" : "Enviar Respostas"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
