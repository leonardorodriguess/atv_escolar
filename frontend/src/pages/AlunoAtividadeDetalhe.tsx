import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import { Atividade, Resposta } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { ArrowLeft, Calendar, Loader2, Send, CheckCircle2, ShieldAlert, Pencil } from "lucide-react";

export default function AlunoAtividadeDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modoEditar = searchParams.get("editar") === "1";

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [textos, setTextos] = useState<Record<number, string>>({});
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [respostasCarregadas, setRespostasCarregadas] = useState(false);
  const [respostaIds, setRespostaIds] = useState<Record<number, number>>({});

  useEffect(() => {
    api.get("/me/atividades").then((r) => {
      const found = r.data.find((a: Atividade) => a.id === Number(id));
      if (found) setAtividade(found);
      else setNaoEncontrada(true);
    });
    api.get("/me/atividades-respondidas").then((r) => {
      if ((r.data as number[]).includes(Number(id))) setJaRespondeu(true);
    });
  }, [id]);

  // Carregar respostas existentes quando em modo edição
  useEffect(() => {
    if (modoEditar && jaRespondeu && atividade) {
      api.get(`/me/respostas/atividade/${id}/`).then((r) => {
        const t: Record<number, string> = {};
        const ids: Record<number, number> = {};
        (r.data as Resposta[]).forEach((resp) => { t[resp.questao] = resp.texto; ids[resp.questao] = resp.id; });
        setTextos(t);
        setRespostaIds(ids);
        setRespostasCarregadas(true);
      });
    }
  }, [modoEditar, jaRespondeu, atividade, id]);

  const enviar = async () => {
    if (!atividade) return;
    const resps = atividade.questoes.map((q) => ({ questao: q.id, texto: textos[q.id] || "" }));
    if (resps.some((r) => !r.texto.trim())) { setErro("Responda todas as questões"); return; }
    setEnviando(true);
    setErro("");
    try {
      if (modoEditar && jaRespondeu) {
        for (const q of atividade.questoes) {
          const rid = respostaIds[q.id];
          if (rid) await api.patch(`/respostas/${rid}/`, { texto: textos[q.id] || "" });
        }
      } else {
        await api.post("/respostas", { atividade: atividade.id, respostas: resps });
      }
      setSucesso(true);
      setTimeout(() => navigate("/aluno/respostas"), 1000);
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao enviar");
    } finally { setEnviando(false); }
  };

  if (naoEncontrada) return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <Card className="flex flex-col items-center justify-center py-12">
        <ShieldAlert className="mb-3 h-10 w-10 text-destructive/50" />
        <p className="text-sm font-medium text-destructive">Atividade não encontrada ou não pertence à sua turma.</p>
      </Card>
    </div>
  );
  if (!atividade) return <p className="text-muted-foreground">Carregando...</p>;
  if (modoEditar && jaRespondeu && !respostasCarregadas) return <p className="text-muted-foreground">Carregando respostas...</p>;

  const aberta = new Date(atividade.data_entrega) > new Date();
  const editando = modoEditar && jaRespondeu && aberta;

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
              {editando && <Badge variant="outline" className="gap-1"><Pencil className="h-3 w-3" />Editando</Badge>}
              {jaRespondeu && !editando && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Respondida</Badge>}
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
          {jaRespondeu && !aberta ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-red-200 bg-red-50 py-8">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-800">Atividade encerrada. Respostas não podem ser editadas.</p>
            </div>
          ) : jaRespondeu && !editando ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-amber-200 bg-amber-50 py-8">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
              <p className="text-sm font-medium text-amber-800">Você já enviou suas respostas para esta atividade.</p>
              {aberta && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/aluno/atividades/${id}?editar=1`)}>
                  <Pencil className="h-3.5 w-3.5" />Editar Respostas
                </Button>
              )}
            </div>
          ) : !aberta ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-red-200 bg-red-50 py-8">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-800">Atividade encerrada.</p>
            </div>
          ) : (
            <>
              {editando && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm text-blue-800">Você está editando suas respostas. Altere o que precisar e salve.</p>
                </div>
              )}
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
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : sucesso ? <CheckCircle2 className="h-4 w-4" /> : editando ? <Pencil className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {sucesso ? "Salvo!" : editando ? "Salvar Alterações" : "Enviar Respostas"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
