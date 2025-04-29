import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { useQuery } from '@tanstack/react-query';
import { AtendimentoForm } from '@/components/atendimentos/atendimento-form';
import { formatDateTime, formatarValor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CalendarIcon, 
  PlusCircle, 
  Filter, 
  X, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AtendimentosPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editingAtendimento, setEditingAtendimento] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    paciente: 'all',
    tipoAtendimento: 'all',
    dataInicial: '',
    dataFinal: ''
  });
  
  // Buscar atendimentos
  const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['/api/atendimentos'],
  });
  
  // Buscar crianças/pacientes
  const { data: criancas = [], isLoading: isLoadingCriancas } = useQuery({
    queryKey: ['/api/criancas'],
  });
  
  // Buscar tipos de atendimento
  const { data: tiposAtendimento = [], isLoading: isLoadingTipos } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  // Filtrar atendimentos com base nos filtros selecionados
  const atendimentosFiltrados = atendimentos.filter((atendimento: any) => {
    let matches = true;
    
    if (filtros.paciente && filtros.paciente !== 'all' && atendimento.criancaId !== parseInt(filtros.paciente)) {
      matches = false;
    }
    
    if (filtros.tipoAtendimento && filtros.tipoAtendimento !== 'all' && atendimento.tipoAtendimentoId !== parseInt(filtros.tipoAtendimento)) {
      matches = false;
    }
    
    if (filtros.dataInicial) {
      const dataInicial = new Date(filtros.dataInicial);
      const dataAtendimento = new Date(atendimento.dataInicio);
      if (dataAtendimento < dataInicial) {
        matches = false;
      }
    }
    
    if (filtros.dataFinal) {
      const dataFinal = new Date(filtros.dataFinal);
      dataFinal.setHours(23, 59, 59); // Definir para o final do dia
      const dataAtendimento = new Date(atendimento.dataInicio);
      if (dataAtendimento > dataFinal) {
        matches = false;
      }
    }
    
    return matches;
  });
  
  // Função para limpar os filtros
  const limparFiltros = () => {
    setFiltros({
      paciente: 'all',
      tipoAtendimento: 'all',
      dataInicial: '',
      dataFinal: ''
    });
  };
  
  // Função para aplicar os filtros (apenas atualizando o estado nesse caso)
  const aplicarFiltros = () => {
    // Os filtros já estão sendo aplicados via estado
    toast({
      title: "Filtros aplicados",
      description: "A lista de atendimentos foi atualizada conforme os filtros."
    });
  };
  
  // Função para editar atendimento
  const editarAtendimento = (atendimento: any) => {
    setEditingAtendimento(atendimento);
    setOpenForm(true);
  };
  
  // Função para iniciar exclusão de atendimento
  const confirmarExclusao = (id: number) => {
    setDeletingId(id);
    setOpenDeleteDialog(true);
  };
  
  // Função para excluir atendimento
  const excluirAtendimento = async () => {
    if (!deletingId) return;
    
    try {
      await apiRequest('DELETE', `/api/atendimentos/${deletingId}`);
      
      // Atualizar cache de consultas
      queryClient.invalidateQueries({ queryKey: ['/api/atendimentos'] });
      
      toast({
        title: "Atendimento excluído",
        description: "O atendimento foi excluído com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setOpenDeleteDialog(false);
      setDeletingId(null);
    }
  };
  
  // Obter nome do paciente a partir do ID
  const getNomePaciente = (criancaId: number) => {
    const crianca = criancas.find((c: any) => c.id === criancaId);
    return crianca ? crianca.nome : `Paciente #${criancaId}`;
  };
  
  // Obter nome do tipo de atendimento a partir do ID
  const getNomeTipoAtendimento = (tipoId: number) => {
    const tipo = tiposAtendimento.find((t: any) => t.id === tipoId);
    return tipo ? tipo.nome : `Tipo #${tipoId}`;
  };
  
  // Calcular duração do atendimento em horas e minutos
  const calcularDuracao = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diferencaMs = fim.getTime() - inicio.getTime();
    
    const horas = Math.floor(diferencaMs / (1000 * 60 * 60));
    const minutos = Math.floor((diferencaMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas === 0) {
      return `${minutos}min`;
    } else if (minutos === 0) {
      return `${horas}h`;
    } else {
      return `${horas}h ${minutos}min`;
    }
  };
  
  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Atendimentos</h1>
          <p className="text-neutral-medium">Gerencie os atendimentos de terapia ABA</p>
        </div>
        
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-dark text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Atendimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingAtendimento ? "Editar Atendimento" : "Novo Atendimento"}
              </DialogTitle>
              <DialogDescription>
                {editingAtendimento 
                  ? "Atualize as informações do atendimento." 
                  : "Preencha os dados para registrar um novo atendimento."}
              </DialogDescription>
            </DialogHeader>
            <AtendimentoForm
              atendimento={editingAtendimento}
              onClose={() => {
                setOpenForm(false);
                setEditingAtendimento(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <Select 
              value={filtros.paciente} 
              onValueChange={(value) => setFiltros({...filtros, paciente: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pacientes</SelectItem>
                {criancas.map((crianca: any) => (
                  <SelectItem key={crianca.id} value={crianca.id.toString()}>
                    {crianca.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Atendimento</label>
            <Select 
              value={filtros.tipoAtendimento} 
              onValueChange={(value) => setFiltros({...filtros, tipoAtendimento: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tiposAtendimento.map((tipo: any) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
            <div className="relative">
              <Input
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => setFiltros({...filtros, dataInicial: e.target.value})}
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
            <div className="relative">
              <Input
                type="date"
                value={filtros.dataFinal}
                onChange={(e) => setFiltros({...filtros, dataFinal: e.target.value})}
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={limparFiltros}
            className="mr-2"
          >
            <X className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button
            onClick={aplicarFiltros}
            className="bg-primary hover:bg-primary-dark text-black"
          >
            <Filter className="mr-2 h-4 w-4" />
            Aplicar Filtros
          </Button>
        </div>
      </div>
      
      {/* Lista de Atendimentos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAtendimentos || isLoadingCriancas || isLoadingTipos ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-3"></div>
                      <p>Carregando atendimentos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : atendimentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mb-3" />
                      <p>Nenhum atendimento encontrado</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => setOpenForm(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar atendimento
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                atendimentosFiltrados.map((atendimento: any) => (
                  <TableRow key={atendimento.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(atendimento.dataInicio).split(' ')[0]}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(atendimento.dataInicio).split(' ')[1]} - {formatDateTime(atendimento.dataFim).split(' ')[1]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {getNomePaciente(atendimento.criancaId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {getNomeTipoAtendimento(atendimento.tipoAtendimentoId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {calcularDuracao(atendimento.dataInicio, atendimento.dataFim)}
                    </TableCell>
                    <TableCell>
                      {formatarValor(atendimento.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => editarAtendimento(atendimento)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmarExclusao(atendimento.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação - a ser implementada com dados reais */}
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">{atendimentosFiltrados.length}</span> de <span className="font-medium">{atendimentosFiltrados.length}</span> resultados
            </p>
          </div>
          {/* Adicionaremos a paginação quando implementarmos a API com suporte a isso */}
        </div>
      </div>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirAtendimento}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
