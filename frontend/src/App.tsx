import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import api from "./api";
import { User } from "./types";
import Login from "./pages/Login.tsx";
import ProfessorAtividades from "./pages/ProfessorAtividades.tsx";
import CriarAtividade from "./pages/CriarAtividade.tsx";
import CorrigirRespostas from "./pages/CorrigirRespostas.tsx";
import AlunoAtividades from "./pages/AlunoAtividades.tsx";
import AlunoAtividadeDetalhe from "./pages/AlunoAtividadeDetalhe.tsx";
import MinhasRespostas from "./pages/MinhasRespostas.tsx";
import GerenciarTurmas from "./pages/GerenciarTurmas.tsx";
import { Button } from "./components/ui/button.tsx";
import { Badge } from "./components/ui/badge.tsx";
import { BookOpen, PlusCircle, ClipboardList, Send, LogOut, GraduationCap, Users } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    navigate(u.role === "PROFESSOR" ? "/professor/atividades" : "/aluno/atividades");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const navItems = user?.role === "PROFESSOR"
    ? [
        { to: "/professor/atividades", label: "Minhas Atividades", icon: BookOpen },
        { to: "/professor/criar", label: "Criar Atividade", icon: PlusCircle },
        { to: "/professor/turmas", label: "Turmas", icon: Users },
      ]
    : [
        { to: "/aluno/atividades", label: "Atividades", icon: ClipboardList },
        { to: "/aluno/respostas", label: "Minhas Respostas", icon: Send },
      ];

  return (
    <div className="min-h-screen bg-slate-50">
      {user && (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold tracking-tight">Plataforma Escolar</span>
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <Link key={item.to} to={item.to}>
                      <Button variant={active ? "secondary" : "ghost"} size="sm" className="gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-muted-foreground">{user.first_name}</span>
                {user.role === "ALUNO" && user.turma_nome && (
                  <Badge variant="outline">{user.turma_nome}</Badge>
                )}
                <Badge variant={user.role === "PROFESSOR" ? "default" : "success"}>{user.role}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/professor/atividades" element={user?.role === "PROFESSOR" ? <ProfessorAtividades /> : <Navigate to="/login" />} />
          <Route path="/professor/criar" element={user?.role === "PROFESSOR" ? <CriarAtividade /> : <Navigate to="/login" />} />
          <Route path="/professor/turmas" element={user?.role === "PROFESSOR" ? <GerenciarTurmas /> : <Navigate to="/login" />} />
          <Route path="/professor/atividades/:id/respostas" element={user?.role === "PROFESSOR" ? <CorrigirRespostas /> : <Navigate to="/login" />} />
          <Route path="/aluno/atividades" element={user?.role === "ALUNO" ? <AlunoAtividades /> : <Navigate to="/login" />} />
          <Route path="/aluno/atividades/:id" element={user?.role === "ALUNO" ? <AlunoAtividadeDetalhe /> : <Navigate to="/login" />} />
          <Route path="/aluno/respostas" element={user?.role === "ALUNO" ? <MinhasRespostas /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? (user.role === "PROFESSOR" ? "/professor/atividades" : "/aluno/atividades") : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}
