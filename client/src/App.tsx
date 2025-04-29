import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import AtendimentosPage from "@/pages/atendimentos-page";
import PacientesPage from "@/pages/pacientes-page";
import UsuariosPage from "@/pages/usuarios-page";
import TiposAtendimentoPage from "@/pages/tipos-atendimento-page";
import CalendarioPage from "@/pages/calendario-page";
import RelatoriosPage from "@/pages/relatorios-page";
import ConfiguracoesPage from "@/pages/configuracoes-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            {/* Rota de autenticação */}
            <Route path="/auth">
              {() => <AuthPage />}
            </Route>
            
            {/* Rotas protegidas */}
            <ProtectedRoute path="/" component={DashboardPage} />
            <ProtectedRoute path="/atendimentos" component={AtendimentosPage} />
            <ProtectedRoute path="/pacientes" component={PacientesPage} />
            <ProtectedRoute path="/usuarios" component={UsuariosPage} />
            <ProtectedRoute path="/tipos-atendimento" component={TiposAtendimentoPage} />
            <ProtectedRoute path="/calendario" component={CalendarioPage} />
            <ProtectedRoute path="/relatorios" component={RelatoriosPage} />
            <ProtectedRoute path="/configuracoes" component={ConfiguracoesPage} />
            
            {/* Fallback para 404 */}
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
