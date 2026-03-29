import { useState, useEffect, FormEvent } from "react";
import api from "../api";
import { User } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Users, PlusCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";

interface Turma { id: number; nome: string; }

export default function GerenciarTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [alunos, setAlunos] = useState<Record<number, User[]>>({});
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  const carregarTurmas = () => api.get("/turmas").then((r) => setTurmas(r.data));

  useEffect(() => { carregarTurmas(); }, []);

  const criarTurma = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!nome.trim()) return;
    setLoading(true);
    try {
      await api.post("/turmas/criar", { nome: nome.trim() });
      setNome("");
      carregarTurmas();
    } catch (err: any) {
      setErro(err.response?.data?.detail || "Erro ao criar turma");
    } finally { setLoading(false); }
  };

  const toggleAlunos = async (turmaId: number) => {
    if (expandida === turmaId) { setExpandida(null); return; }
    setExpandida(turmaId);
    if (!alunos[turmaId]) {
      setLoadingAlunos(true);
      try {
        const r = await api.get(`/turmas/${turmaId}/alunos/`);
        setAlunos((prev) => ({ ...prev, [turmaId]: r.data }));
      } catch { /* ignore */ }
      finally { setLoadingAlunos(false); }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Turmas</h1>
        <p className="text-muted-foreground">Crie turmas e veja os alunos matriculados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={criarTurma} className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome-turma">Nome da turma</Label>
              <Input id="nome-turma" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Turma C" required />
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Criar
            </Button>
          </form>
          {erro && <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {turmas.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma turma cadastrada.</p>
          </Card>
        ) : (
          turmas.map((t) => {
            const aberta = expandida === t.id;
            const lista = alunos[t.id] || [];
            return (
              <Card key={t.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="cursor-pointer" onClick={() => toggleAlunos(t.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {aberta ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <CardTitle className="text-base">{t.nome}</CardTitle>
                    </div>
                    {aberta && !loadingAlunos && (
                      <Badge variant="outline">{lista.length} aluno(s)</Badge>
                    )}
                  </div>
                </CardHeader>
                {aberta && (
                  <CardContent>
                    {loadingAlunos ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />Carregando...
                      </div>
                    ) : lista.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum aluno nesta turma.</p>
                    ) : (
                      <div className="space-y-2">
                        {lista.map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{a.first_name}</p>
                              <p className="text-xs text-muted-foreground">{a.email}</p>
                            </div>
                            <Badge variant="success">Aluno</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
