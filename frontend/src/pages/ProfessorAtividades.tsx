import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Atividade } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BookOpen, Calendar, Users, Eye, PlusCircle } from "lucide-react";

export default function ProfessorAtividades() {
  const [atividades, setAtividades] = useState<Atividade[]>([]);

  useEffect(() => {
    api.get("/me/atividades").then((r) => setAtividades(r.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas Atividades</h1>
          <p className="text-muted-foreground">Gerencie as atividades que você criou</p>
        </div>
        <Link to="/professor/criar">
          <Button className="gap-2"><PlusCircle className="h-4 w-4" />Nova Atividade</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total</CardDescription>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{atividades.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Abertas</CardDescription>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {atividades.filter((a) => new Date(a.data_entrega) > new Date()).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Encerradas</CardDescription>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {atividades.filter((a) => new Date(a.data_entrega) <= new Date()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {atividades.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Nenhuma atividade criada ainda.</p>
          <Link to="/professor/criar"><Button variant="outline" className="mt-4 gap-2"><PlusCircle className="h-4 w-4" />Criar primeira atividade</Button></Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {atividades.map((a) => {
            const aberta = new Date(a.data_entrega) > new Date();
            return (
              <Card key={a.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{a.titulo}</CardTitle>
                    <Badge variant={aberta ? "success" : "destructive"}>{aberta ? "Aberta" : "Encerrada"}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{a.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{a.turma_nome}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(a.data_entrega).toLocaleDateString("pt-BR")}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/professor/atividades/${a.id}/respostas`}>
                    <Button variant="outline" size="sm" className="gap-2"><Eye className="h-3.5 w-3.5" />Ver Respostas</Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
