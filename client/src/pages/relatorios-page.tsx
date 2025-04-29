import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { formatarValor, formatDate, calcularIdade } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  Calendar,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Users,
  User,
  Filter,
  RefreshCcw,
  Printer,
  FileSpreadsheet,
  FileOutput
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#FF6B6B', '#5B86E5', '#FFD966', '#5CBCAA', '#9C79F0', '#FF9F68'];

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('atendimentos');
  const [filtroUsuario, setFiltroUsuario] = useState<string | null>(null);
  const [filtroPaciente, setFiltroPaciente] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<{ from: Date; to: Date } | null>(null);
  
  // Buscar dados
  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['/api/atendimentos'],
  });
  
  const { data: pacientes = [], isLoading: isLoadingPacientes } = useQuery({
    queryKey: ['/api/criancas'],
  });
  
  const { data: usuarios = [], isLoading: isLoadingUsuarios } = useQuery({
    queryKey: ['/api/usuarios'],
  });
  
  const { data: tiposAtendimento = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  const isLoading = isLoadingAtendimentos || isLoadingPacientes || isLoadingUsuarios || isLoadingTipos;
  
  // Filtrar atendimentos
  const atendimentosFiltrados = atendimentos.filter((atendimento: any) => {
    let matches = true;
    
    if (filtroUsuario && filtroUsuario !== 'all' && parseInt(filtroUsuario) !== atendimento.usuarioId) {
      matches = false;
    }
    
    if (filtroPaciente && filtroPaciente !== 'all' && parseInt(filtroPaciente) !== atendimento.criancaId) {
      matches = false;
    }
    
    if (filtroPeriodo) {
      const dataAtendimento = new Date(atendimento.dataInicio);
      if (
        dataAtendimento < filtroPeriodo.from || 
        dataAtendimento > filtroPeriodo.to
      ) {
        matches = false;
      }
    }
    
    return matches;
  });
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltroUsuario(null);
    setFiltroPaciente(null);
    setFiltroPeriodo(null);
  };
  
  // Carregar somente o usuário atual
  const carregarApenasUsuarioAtual = () => {
    if (user) {
      setFiltroUsuario(String(user.id));
      setFiltroPaciente(null);
    }
  };
  
  // Preparar dados para os gráficos
  
  // Atendimentos por tipo
  const atendimentosPorTipo = tiposAtendimento.map((tipo: any) => {
    const count = atendimentosFiltrados.filter(
      (a: any) => a.tipoAtendimentoId === tipo.id
    ).length;
    
    return {
      name: tipo.nome,
      value: count
    };
  }).filter((item) => item.value > 0);
  
  // Atendimentos por paciente
  const atendimentosPorPaciente = pacientes.map((paciente: any) => {
    const count = atendimentosFiltrados.filter(
      (a: any) => a.criancaId === paciente.id
    ).length;
    
    return {
      name: paciente.nome,
      atendimentos: count
    };
  }).filter((item) => item.atendimentos > 0)
    .sort((a, b) => b.atendimentos - a.atendimentos)
    .slice(0, 10);
  
  // Atendimentos por mês
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
  
  const atendimentosPorMes = ultimosMeses.map((mes) => {
    const count = atendimentosFiltrados.filter((a: any) => {
      const dataAtendimento = new Date(a.dataInicio);
      return dataAtendimento.getMonth() === mes.mes && 
             dataAtendimento.getFullYear() === mes.ano;
    }).length;
    
    return {
      name: `${mes.nome}/${mes.ano.toString().substr(2, 2)}`,
      atendimentos: count
    };
  });
  
  // Faturamento por mês
  const faturamentoPorMes = ultimosMeses.map((mes) => {
    const atendimentosDoMes = atendimentosFiltrados.filter((a: any) => {
      const dataAtendimento = new Date(a.dataInicio);
      return dataAtendimento.getMonth() === mes.mes && 
             dataAtendimento.getFullYear() === mes.ano;
    });
    
    const total = atendimentosDoMes.reduce((acc: number, a: any) => 
      acc + (parseFloat(a.valor) || 0), 0);
    
    return {
      name: `${mes.nome}/${mes.ano.toString().substr(2, 2)}`,
      valor: parseFloat(total.toFixed(2))
    };
  });

  // Funções para obter nomes a partir de IDs
  const getNomePaciente = (id: number) => {
    const paciente = pacientes.find((p: any) => p.id === id);
    return paciente ? paciente.nome : `Paciente #${id}`;
  };
  
  const getNomeUsuario = (id: number) => {
    const usuario = usuarios.find((u: any) => u.id === id);
    return usuario ? usuario.nome : `Usuário #${id}`;
  };
  
  const getNomeTipo = (id: number) => {
    const tipo = tiposAtendimento.find((t: any) => t.id === id);
    return tipo ? tipo.nome : `Tipo #${id}`;
  };
  
  // Função para simular impressão do relatório
  const imprimirRelatorio = () => {
    window.print();
  };
  
  // Funções para exportação dos relatórios
  const exportarParaExcel = () => {
    // Preparar dados para exportação
    const dadosExportacao = atendimentosFiltrados.map((atendimento: any) => ({
      'Data': formatDate(atendimento.dataInicio),
      'Horário': new Date(atendimento.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      'Paciente': getNomePaciente(atendimento.criancaId),
      'Profissional': getNomeUsuario(atendimento.usuarioId),
      'Tipo de Atendimento': getNomeTipo(atendimento.tipoAtendimentoId),
      'Valor': formatarValor(atendimento.valor),
      'Descrição': atendimento.descricao || ''
    }));
    
    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Atendimentos");
    
    // Definir nome do arquivo com data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `relatorio-atendimentos-${dataAtual}.xlsx`;
    
    // Exportar para Excel
    XLSX.writeFile(wb, nomeArquivo);
  };

  const exportarParaPDF = () => {
    // Criar documento PDF
    const doc = new jsPDF();
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text("Relatório de Atendimentos - Grupo Promove", 14, 20);
    
    // Adicionar data do relatório
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Adicionar filtros aplicados
    let linhaAtual = 40;
    doc.setFontSize(12);
    doc.text("Filtros aplicados:", 14, linhaAtual);
    linhaAtual += 8;
    
    if (filtroUsuario && filtroUsuario !== 'all') {
      doc.text(`• Profissional: ${getNomeUsuario(parseInt(filtroUsuario))}`, 14, linhaAtual);
      linhaAtual += 6;
    }
    
    if (filtroPaciente && filtroPaciente !== 'all') {
      doc.text(`• Paciente: ${getNomePaciente(parseInt(filtroPaciente))}`, 14, linhaAtual);
      linhaAtual += 6;
    }
    
    if (filtroPeriodo && filtroPeriodo.from && filtroPeriodo.to) {
      doc.text(`• Período: ${filtroPeriodo.from.toLocaleDateString('pt-BR')} a ${filtroPeriodo.to.toLocaleDateString('pt-BR')}`, 14, linhaAtual);
      linhaAtual += 6;
    }
    
    linhaAtual += 5;
    
    // Adicionar tabela de atendimentos
    const headers = [
      ['Data', 'Paciente', 'Profissional', 'Tipo de Atendimento', 'Valor']
    ];
    
    const dados = atendimentosFiltrados.map((atendimento: any) => [
      formatDate(atendimento.dataInicio),
      getNomePaciente(atendimento.criancaId),
      getNomeUsuario(atendimento.usuarioId),
      getNomeTipo(atendimento.tipoAtendimentoId),
      formatarValor(atendimento.valor)
    ]);
    
    autoTable(doc, {
      head: headers,
      body: dados,
      startY: linhaAtual,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [255, 217, 102], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    // Adicionar rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount} - © ${new Date().getFullYear()} Grupo Promove. Todos os direitos reservados.`,
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: "center" }
      );
    }
    
    // Definir nome do arquivo
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `relatorio-atendimentos-${dataAtual}.pdf`;
    
    // Salvar PDF
    doc.save(nomeArquivo);
  };
  
  // Menu para escolher o tipo de exportação
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Relatórios</h1>
          <p className="text-neutral-medium">Visualize dados e métricas dos atendimentos</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={imprimirRelatorio}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportarParaExcel();
                      setShowExportMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar para Excel
                  </button>
                  <button
                    onClick={() => {
                      exportarParaPDF();
                      setShowExportMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileOutput className="mr-2 h-4 w-4" />
                    Exportar para PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Ajuste os filtros para personalizar os relatórios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profissional</label>
              <Select value={filtroUsuario || ""} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos os profissionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {usuarios.map((usuario: any) => (
                    <SelectItem key={usuario.id} value={String(usuario.id)}>
                      {usuario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
              <Select value={filtroPaciente || ""} onValueChange={setFiltroPaciente}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos os pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {pacientes.map((paciente: any) => (
                    <SelectItem key={paciente.id} value={String(paciente.id)}>
                      {paciente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <DateRangePicker 
                from={filtroPeriodo?.from} 
                to={filtroPeriodo?.to}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setFiltroPeriodo({
                      from: range.from,
                      to: range.to
                    });
                  } else {
                    setFiltroPeriodo(null);
                  }
                }}
              />
            </div>
            
            <div className="flex items-end space-x-2 pb-1">
              <Button 
                variant="outline" 
                onClick={limparFiltros}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              
              <Button 
                onClick={carregarApenasUsuarioAtual}
                variant="outline"
              >
                <User className="mr-2 h-4 w-4" />
                Meus Atendimentos
              </Button>
              
              <Button className="bg-primary hover:bg-primary-dark text-black">
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Atendimentos</p>
                <p className="text-2xl font-bold">{atendimentosFiltrados.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pacientes Atendidos</p>
                <p className="text-2xl font-bold">
                  {new Set(atendimentosFiltrados.map((a: any) => a.criancaId)).size}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Horas de Atendimento</p>
                <p className="text-2xl font-bold">
                  {atendimentosFiltrados.reduce((acc: number, atendimento: any) => {
                    const inicio = new Date(atendimento.dataInicio);
                    const fim = new Date(atendimento.dataFim);
                    const horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
                    return acc + horas;
                  }, 0).toFixed(0)}h
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Faturamento Total</p>
                <p className="text-2xl font-bold">
                  {formatarValor(atendimentosFiltrados.reduce(
                    (acc: number, atendimento: any) => acc + parseFloat(atendimento.valor || 0), 
                    0
                  ))}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Abas dos relatórios */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-3 h-14">
          <TabsTrigger value="atendimentos" className="h-12">
            <FileText className="mr-2 h-4 w-4" />
            Atendimentos
          </TabsTrigger>
          <TabsTrigger value="comparativos" className="h-12">
            <BarChartIcon className="mr-2 h-4 w-4" />
            Comparativos
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="h-12">
            <LineChartIcon className="mr-2 h-4 w-4" />
            Evolução
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de Atendimentos */}
        <TabsContent value="atendimentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Atendimentos</CardTitle>
              <CardDescription>
                Detalhamento de todos os atendimentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
              ) : atendimentosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium mb-2">Nenhum atendimento encontrado</h3>
                  <p className="text-gray-500">
                    Ajuste os filtros ou cadastre novos atendimentos
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atendimentosFiltrados.map((atendimento: any) => {
                        const dataInicio = new Date(atendimento.dataInicio);
                        const dataFim = new Date(atendimento.dataFim);
                        const duracao = Math.round((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60));
                        const horas = Math.floor(duracao / 60);
                        const minutos = duracao % 60;
                        
                        return (
                          <TableRow key={atendimento.id}>
                            <TableCell>
                              {formatDate(atendimento.dataInicio)} {dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell>{getNomePaciente(atendimento.criancaId)}</TableCell>
                            <TableCell>{getNomeUsuario(atendimento.usuarioId)}</TableCell>
                            <TableCell>{getNomeTipo(atendimento.tipoAtendimentoId)}</TableCell>
                            <TableCell>
                              {horas > 0 ? `${horas}h ` : ''}{minutos > 0 ? `${minutos}min` : ''}
                            </TableCell>
                            <TableCell>{formatarValor(atendimento.valor)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab de Comparativos */}
        <TabsContent value="comparativos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Tipo</CardTitle>
                <CardDescription>
                  Distribuição dos atendimentos por tipo de terapia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                  </div>
                ) : atendimentosPorTipo.length === 0 ? (
                  <div className="text-center py-8">
                    <PieChartIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Sem dados para exibir</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={atendimentosPorTipo}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {atendimentosPorTipo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Paciente</CardTitle>
                <CardDescription>
                  Quantidade de atendimentos por paciente (Top 10)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                  </div>
                ) : atendimentosPorPaciente.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChartIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Sem dados para exibir</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={atendimentosPorPaciente} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="atendimentos" fill="#5B86E5" name="Atendimentos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab de Evolução */}
        <TabsContent value="evolucao" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Atendimentos por Mês</CardTitle>
                <CardDescription>
                  Quantidade de atendimentos nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={atendimentosPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="atendimentos" 
                          stroke="#5B86E5" 
                          activeDot={{ r: 8 }}
                          name="Atendimentos"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Faturamento por Mês</CardTitle>
                <CardDescription>
                  Valor total faturado nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={faturamentoPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatarValor(value)} />
                        <Legend />
                        <Bar 
                          dataKey="valor" 
                          fill="#FF6B6B" 
                          name="Faturamento"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}

// Componentes extras necessários para o relatório
function Clock(props: any) {
  return <LineChartIcon {...props} />;
}

function DollarSign(props: any) {
  return <div className={props.className}><span className="font-bold">R$</span></div>;
}
