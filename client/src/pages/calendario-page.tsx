import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { CalendarView } from '@/components/calendar/calendar-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AtendimentoForm } from '@/components/atendimentos/atendimento-form';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  PlusCircle,
  Filter,
  RefreshCcw,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CalendarioPage() {
  const [calendarView, setCalendarView] = useState('month');
  const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);
  const [filtroPaciente, setFiltroPaciente] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const { user } = useAuth();

  // Buscar atendimentos
  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['/api/atendimentos'],
  });
  
  // Buscar pacientes
  const { data: pacientes = [], isLoading: isLoadingPacientes } = useQuery({
    queryKey: ['/api/criancas'],
  });
  
  // Buscar usuários
  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ['/api/usuarios'],
  });
  
  // Filtrar atendimentos
  const atendimentosFiltrados = atendimentos.filter((atendimento: any) => {
    let matches = true;
    
    if (filtroUsuario && filtroUsuario !== 'all' && parseInt(filtroUsuario) !== atendimento.usuarioId) {
      matches = false;
    }
    
    if (filtroPaciente && filtroPaciente !== 'all' && parseInt(filtroPaciente) !== atendimento.criancaId) {
      matches = false;
    }
    
    return matches;
  });
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltroUsuario(null);
    setFiltroPaciente(null);
  };
  
  // Carregar somente o usuário atual
  const carregarApenasUsuarioAtual = () => {
    if (user) {
      setFiltroUsuario(String(user.id));
      setFiltroPaciente(null);
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Calendário</h1>
          <p className="text-neutral-medium">Visualize e gerencie a agenda de atendimentos</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent-dark text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Novo Atendimento</DialogTitle>
                <DialogDescription>
                  Preencha os dados para agendar um novo atendimento.
                </DialogDescription>
              </DialogHeader>
              <AtendimentoForm
                onClose={() => setOpenForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Controles do Calendário */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
            <div className="flex flex-wrap gap-4">
              <Select value={filtroUsuario || ""} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Profissionais</SelectLabel>
                    {usuarios.map((usuario: any) => (
                      <SelectItem key={usuario.id} value={String(usuario.id)}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Select value={filtroPaciente || ""} onValueChange={setFiltroPaciente}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  <SelectGroup>
                    <SelectLabel>Pacientes</SelectLabel>
                    {pacientes.map((paciente: any) => (
                      <SelectItem key={paciente.id} value={String(paciente.id)}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={limparFiltros}
                  className="h-10"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={carregarApenasUsuarioAtual}
                  className="h-10"
                >
                  <User className="mr-2 h-4 w-4" />
                  Meus Atendimentos
                </Button>
              </div>
            </div>
            
            <div>
              <Tabs value={calendarView} onValueChange={setCalendarView}>
                <TabsList>
                  <TabsTrigger value="month" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Mensal
                  </TabsTrigger>
                  <TabsTrigger value="week" className="flex items-center">
                    <CalendarRange className="h-4 w-4 mr-2" />
                    Semanal
                  </TabsTrigger>
                  <TabsTrigger value="day" className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Diário
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Calendário */}
      {isLoadingAtendimentos || isLoadingPacientes || isLoadingUsuarios ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        <Card className="p-4">
          <CalendarView 
            view={calendarView} 
            atendimentos={atendimentosFiltrados}
            pacientes={pacientes}
            usuarios={usuarios}
            onAddAtendimento={() => setOpenForm(true)}
          />
        </Card>
      )}
    </Layout>
  );
}
