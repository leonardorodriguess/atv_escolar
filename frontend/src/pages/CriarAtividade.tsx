import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Loader2, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";

interface Turma { id: number; nome: string; }

export default function CriarAtividade() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [turma, setTurma] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [questoes, setQuestoes] = useState([{ enunciado: "", ordem: 0 }]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { api.get("/turmas").then((r) => setTurmas(r.data)); }, []);

  const addQuestao = () => setQuestoes([...questoes, { enunciado: "", ordem: questoes.length }]);
  const removeQuestao = (i: number) => {
    if (questoes.length <= 1) return;
    setQuestoes(questoes.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, ordem: idx })));
  };
  const updateQuestao = (i: number, enunciado: string) => {
    const copy = [...questoes];
    copy[i] = { ...copy[i], enunciado };
    setQuestoes(copy);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    if (questoes.some((q) => !q.enunciado.trim())) { setErro("Preencha todas as questões"); return; }
    setLoading(true);
    try {
      await api.post("/atividades", {
        titulo, descricao, turma: Number(turma), data_entrega: dataEntrega, questoes,
      });
      navigate("/professor/atividades");
    } catch { setErro("Erro ao criar atividade"); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Criar Atividade</CardTitle>
          <CardDescription>Preencha os dados e adicione as questões</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Trabalho de POO" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição geral</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva a atividade..." required rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="turma">Turma</Label>
                <Select id="turma" value={turma} onChange={(e) => setTurma(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_entrega">Data de Entrega</Label>
                <Input id="data_entrega" type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questões ({questoes.length})</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addQuestao}>
                  <PlusCircle className="h-3.5 w-3.5" />Adicionar
                </Button>
              </div>
              {questoes.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{i + 1}</div>
                  <Textarea value={q.enunciado} onChange={(e) => updateQuestao(i, e.target.value)} placeholder={`Enunciado da questão ${i + 1}`} rows={2} className="flex-1" />
                  {questoes.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQuestao(i)} className="shrink-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {erro && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Atividade
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
