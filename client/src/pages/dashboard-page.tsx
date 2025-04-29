import React, { useEffect } from 'react';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatDateTime, calcularIdade } from '@/lib/utils';
import { CalendarClock, Users, Clock, ArrowUp, ArrowDown, MoreHorizontal, FileText, UserPlus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Interface para mapear os tipos esperados
interface Atendimento {
  id: number;
  dataInicio: string;
  dataFim: string;
  criancaId: number;
  usuarioId: number;
  tipoAtendimentoId: number;
  observacoes?: string;
  valor: number | string;
  createdAt?: string;
}

// Esta função será usada para gerar dados de atendimentos por mês com dados reais
const gerarDadosAtendimentosPorMes = (atendimentos: Atendimento[]) => {
  const hoje = new Date();
  const ultimosMeses = Array.from({ length: 6 }, (_, i) => {
    const data = new Date();
    data.setMonth(hoje.getMonth() - i);
    return {
      data,
      nome: data.toLocaleString('pt-BR', { month: 'short' }),
      ano: data.getFullYear(),
      mes: data.getMonth()
    };
  }).reverse();
  
  return ultimosMeses.map((mes) => {
    const count = atendimentos.filter((a: any) => {
      const dataAtendimento = new Date(a.dataInicio);
      return dataAtendimento.getMonth() === mes.mes && 
             dataAtendimento.getFullYear() === mes.ano;
    }).length;
    
    return {
      name: `${mes.nome}/${mes.ano.toString().substring(2, 4)}`,
      atendimentos: count
    };
  });
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Definir tipo para Criança
  interface Crianca {
    id: number;
    nome: string;
    dataNascimento: string;
    responsavel: string;
    telefone: string;
    email: string;
    endereco: string;
    observacoes?: string;
    createdAt?: string;
  }
  
  // Buscar atendimentos
  const { data: atendimentos = [] } = useQuery<Atendimento[]>({
    queryKey: ['/api/atendimentos'],
    enabled: !!user,
  });
  
  // Buscar pacientes
  const { data: pacientes = [] } = useQuery<Crianca[]>({
    queryKey: ['/api/criancas'],
    enabled: !!user,
  });
  
  // Filtrar próximos atendimentos (simulação com dados reais quando disponíveis)
  const proximosAtendimentos = atendimentos
    .filter((atendimento: any) => new Date(atendimento.dataInicio) > new Date())
    .sort((a: any, b: any) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
    .slice(0, 3);

  // Filtrar atendimentos recentes (simulação com dados reais quando disponíveis)
  const atendimentosRecentes = atendimentos
    .filter((atendimento: any) => new Date(atendimento.dataInicio) <= new Date())
    .sort((a: any, b: any) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
    .slice(0, 3);
    
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">Painel de Controle</h1>
        <p className="text-neutral-medium">Bem-vindo(a) ao sistema Promove de Atendimento ABA</p>
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Atendimentos do Mês</p>
                <p className="text-2xl font-bold">{atendimentos.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                <CalendarClock className="h-6 w-6 text-neutral-dark" />
              </div>
            </div>
            <div className="mt-4 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="mr-1 h-3 w-3" /> 12% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pacientes Ativos</p>
                <p className="text-2xl font-bold">{pacientes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#FF9E9E] flex items-center justify-center">
                <Users className="h-6 w-6 text-neutral-dark" />
              </div>
            </div>
            <div className="mt-4 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="mr-1 h-3 w-3" /> {Math.min(2, pacientes.length)} novos neste mês
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Horas de Atendimento</p>
                <p className="text-2xl font-bold">
                  {atendimentos.reduce((acc: number, curr: any) => {
                    const inicio = new Date(curr.dataInicio);
                    const fim = new Date(curr.dataFim);
                    const horasAtendimento = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
                    return acc + horasAtendimento;
                  }, 0).toFixed(0)}h
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#8EADF0] flex items-center justify-center">
                <Clock className="h-6 w-6 text-neutral-dark" />
              </div>
            </div>
            <div className="mt-4 text-xs">
              <span className="text-red-500 flex items-center">
                <ArrowDown className="mr-1 h-3 w-3" /> 5% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico e Lista de Atendimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Atendimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por Mês</CardTitle>
            <CardDescription>Visualização dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gerarDadosAtendimentosPorMes(atendimentos)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="atendimentos" fill="#5B86E5" name="Atendimentos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Próximos Atendimentos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Próximos Atendimentos</CardTitle>
              <CardDescription>Agendamentos previstos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-accent" onClick={() => navigate('/calendario')}>
              Ver calendário
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximosAtendimentos.length > 0 ? (
                proximosAtendimentos.map((atendimento: any) => (
                  <div 
                    key={atendimento.id} 
                    className="flex border-l-4 border-primary bg-primary-light bg-opacity-20 p-3 rounded-r-md"
                  >
                    <div className="mr-3">
                      <div className="text-sm font-medium">
                        {formatDateTime(atendimento.dataInicio)} - {formatDateTime(atendimento.dataFim)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {/* Aqui precisaríamos buscar os dados da criança e tipo de atendimento pelo ID */}
                        Atendimento para paciente #{atendimento.criancaId}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CalendarDays className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Nenhum atendimento agendado</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => navigate('/atendimentos')}
                  >
                    Agendar atendimento
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Atividade Recente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-accent" onClick={() => navigate('/relatorios')}>
            Ver tudo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {atendimentosRecentes.length > 0 ? (
              atendimentosRecentes.map((atendimento: any) => (
                <div key={atendimento.id} className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3 flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Atendimento realizado</span> para paciente #{atendimento.criancaId}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(atendimento.dataInicio)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>Nenhuma atividade recente registrada</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
