import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { useQuery } from '@tanstack/react-query';
import { ClienteForm } from '@/components/clientes/cliente-form';
import { formatDate, calcularIdade } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  Search, 
  PlusCircle, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Phone,
  Mail,
  Users,
  User,
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export default function PacientesPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Buscar clientes
  const { data: clientes = [], isLoading: isLoadingClientes, refetch } = useQuery({
    queryKey: ['/api/criancas'],
    staleTime: 1000, // Considere os dados desatualizados após 1 segundo para atualizar mais rápido
  });
  
  // Buscar tipos de atendimento para filtro
  const { data: tiposAtendimento = [] } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
    staleTime: 1000, // Considere os dados desatualizados após 1 segundo para atualizar mais rápido
  });
  
  // Buscar relações criança-tipo de atendimento
  const { data: criancaTiposAtendimento = [] } = useQuery({
    queryKey: ['/api/crianca-tipos-atendimento'],
    staleTime: 1000, // Considere os dados desatualizados após 1 segundo para atualizar mais rápido
  });
  
  // Buscar próximos atendimentos
  const { data: atendimentos = [] } = useQuery({
    queryKey: ['/api/atendimentos'],
    staleTime: 1000, // Considere os dados desatualizados após 1 segundo para atualizar mais rápido
  });

  // Filtrar clientes com base na busca e tipo de atendimento
  const clientesFiltrados = clientes.filter((cliente: any) => {
    let matchesSearch = true;
    let matchesTipo = true;
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      matchesSearch = 
        cliente.nome?.toLowerCase().includes(lowerSearch) || 
        cliente.pai?.toLowerCase().includes(lowerSearch) || 
        cliente.mae?.toLowerCase().includes(lowerSearch) || 
        cliente.email?.toLowerCase().includes(lowerSearch) ||
        false;
    }
    
    // Filtrar por tipo de atendimento
    if (filtroTipo && filtroTipo !== 'all') {
      const tipoAtendimentoId = parseInt(filtroTipo);
      const temTipoAtendimento = criancaTiposAtendimento.some(
        (rel: any) => rel.criancaId === cliente.id && rel.tipoAtendimentoId === tipoAtendimentoId
      );
      matchesTipo = temTipoAtendimento;
    }
    
    return matchesSearch && matchesTipo;
  });
  
  // Função para editar cliente
  const editarCliente = (cliente: any) => {
    setEditingCliente(cliente);
    setOpenForm(true);
  };
  
  // Função para iniciar exclusão de cliente
  const confirmarExclusao = (id: number) => {
    setDeletingId(id);
    setOpenDeleteDialog(true);
  };
  
  // Função para excluir cliente
  const excluirCliente = async () => {
    if (!deletingId) return;
    
    try {
      await apiRequest('DELETE', `/api/criancas/${deletingId}`);
      
      // Atualizar cache de consultas e forçar a recarga dos dados
      await queryClient.invalidateQueries({ queryKey: ['/api/criancas'] });
      
      // Forçar a recarga dos dados após a exclusão
      await refetch();
      
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso."
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
  
  // Obter os tipos de atendimento de um cliente
  const getTiposAtendimento = (clienteId: number) => {
    const relacoes = criancaTiposAtendimento.filter(
      (rel: any) => rel.criancaId === clienteId
    );
    
    return relacoes.map((rel: any) => {
      const tipo = tiposAtendimento.find((t: any) => t.id === rel.tipoAtendimentoId);
      return tipo;
    }).filter(Boolean);
  };
  
  // Obter o próximo atendimento de um cliente
  const getProximoAtendimento = (clienteId: number) => {
    const hoje = new Date();
    return atendimentos
      .filter((a: any) => 
        a.criancaId === clienteId && 
        new Date(a.dataInicio) > hoje
      )
      .sort((a: any, b: any) => 
        new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
      )[0];
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Clientes</h1>
          <p className="text-neutral-medium">Gerencie as crianças atendidas pela terapia ABA</p>
        </div>
        
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-dark text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingCliente ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCliente 
                  ? "Atualize as informações do cliente." 
                  : "Preencha os dados para registrar um novo cliente."}
              </DialogDescription>
            </DialogHeader>
            <ClienteForm
              cliente={editingCliente}
              onClose={() => {
                setOpenForm(false);
                setEditingCliente(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Busca e Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar clientes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filtroTipo}
              onValueChange={setFiltroTipo}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {tiposAtendimento.map((tipo: any) => (
                  <SelectItem key={tipo.id} value={tipo.id.toString()}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              className="bg-primary hover:bg-primary-dark text-black"
              onClick={() => {
                // Os filtros já são aplicados automaticamente pelos estados
                toast({
                  title: "Filtros aplicados",
                  description: "Lista de clientes atualizada conforme os filtros."
                });
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Filtrar</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Lista de Clientes */}
      {isLoadingClientes ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : clientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filtroTipo 
              ? "Tente ajustar os filtros de busca"
              : "Adicione seu primeiro cliente para começar"}
          </p>
          <Button onClick={() => setOpenForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente: any) => {
            const tiposAtendimento = getTiposAtendimento(cliente.id);
            const proximoAtendimento = getProximoAtendimento(cliente.id);
            
            return (
              <Card key={cliente.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 bg-primary-light text-primary-dark">
                          <AvatarFallback>{getInitials(cliente.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <h3 className="font-medium text-lg">{cliente.nome}</h3>
                          <p className="text-sm text-gray-500">
                            {calcularIdade(cliente.dataNascimento)} anos 
                            {cliente.dataNascimento && ` (${formatDate(cliente.dataNascimento)})`}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editarCliente(cliente)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => confirmarExclusao(cliente.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <Users className="w-5 h-5 text-gray-500 mr-2" />
                        <span>Pais: {cliente.pai} {cliente.pai && cliente.mae ? 'e' : ''} {cliente.mae}</span>
                      </div>
                      {cliente.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="w-5 h-5 text-gray-500 mr-2" />
                          <span>{cliente.email}</span>
                        </div>
                      )}
                      {cliente.telefone && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-5 h-5 text-gray-500 mr-2" />
                          <span>{cliente.telefone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-sm font-medium">Atendimentos:</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tiposAtendimento.length > 0 ? (
                          tiposAtendimento.map((tipo: any) => (
                            <Badge key={tipo.id} variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {tipo.nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">Nenhum tipo de atendimento</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {proximoAtendimento ? (
                        <>Próx. atendimento: <span className="font-medium">{formatDate(proximoAtendimento.dataInicio)}</span></>
                      ) : (
                        "Sem atendimentos agendados"
                      )}
                    </span>
                    <Button variant="ghost" size="sm" className="text-accent hover:text-accent-dark">
                      <Calendar className="h-4 w-4 mr-1" />
                      Ver agenda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Paginação (simplificada) */}
      {clientesFiltrados.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">{clientesFiltrados.length}</span> de <span className="font-medium">{clientesFiltrados.length}</span> clientes
            </p>
          </div>
        </div>
      )}
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirCliente}
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
