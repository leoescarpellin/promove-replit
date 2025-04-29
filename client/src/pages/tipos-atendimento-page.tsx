import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { useQuery } from '@tanstack/react-query';
import { TipoAtendimentoForm } from '@/components/tipos-atendimento/tipo-atendimento-form';
import { formatarValor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
  Search, 
  PlusCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  CheckSquare,
  Users,

  FileText,
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

export default function TiposAtendimentoPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Estado para filtro de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Interfaces para tipagem
  interface TipoAtendimento {
    id: number;
    sigla: string;
    nome: string;
    descricao?: string;
    valor?: number;
    createdAt?: string;
  }
  
  interface RelacaoTipoAtendimento {
    id: number;
    usuarioId?: number;
    criancaId?: number;
    tipoAtendimentoId: number;
    valor?: number;
    createdAt?: string;
  }

  // Buscar tipos de atendimento
  const { data: tiposAtendimento = [], isLoading, refetch } = useQuery<TipoAtendimento[]>({
    queryKey: ['/api/tipos-atendimento'],
    staleTime: 1000, // Considere os dados desatualizados após 1 segundo
  });
  
  // Buscar usuários e pacientes que usam cada tipo
  const { data: criancaTiposAtendimento = [] } = useQuery<RelacaoTipoAtendimento[]>({
    queryKey: ['/api/crianca-tipos-atendimento'],
  });
  
  const { data: usuarioTiposAtendimento = [] } = useQuery<RelacaoTipoAtendimento[]>({
    queryKey: ['/api/usuario-tipos-atendimento'],
  });

  // Filtrar tipos com base na busca
  const tiposFiltrados = tiposAtendimento.filter((tipo: any) => {
    if (!searchTerm) return true;
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      tipo.nome?.toLowerCase().includes(lowerSearch) || 
      tipo.sigla?.toLowerCase().includes(lowerSearch) || 
      tipo.descricao?.toLowerCase().includes(lowerSearch) ||
      false
    );
  });
  
  // Função para editar tipo de atendimento
  const editarTipo = (tipo: any) => {
    setEditingTipo(tipo);
    setOpenForm(true);
  };
  
  // Função para iniciar exclusão de tipo de atendimento
  const confirmarExclusao = (id: number) => {
    // Verificar se o tipo está em uso
    const criancasUsando = criancaTiposAtendimento.some((rel: any) => rel.tipoAtendimentoId === id);
    const usuariosUsando = usuarioTiposAtendimento.some((rel: any) => rel.tipoAtendimentoId === id);
    
    if (criancasUsando || usuariosUsando) {
      toast({
        title: "Ação não permitida",
        description: "Este tipo de atendimento está em uso por pacientes ou usuários e não pode ser excluído.",
        variant: "destructive"
      });
      return;
    }
    
    setDeletingId(id);
    setOpenDeleteDialog(true);
  };
  
  // Função para excluir tipo de atendimento
  const excluirTipo = async () => {
    if (!deletingId) return;
    
    try {
      await apiRequest('DELETE', `/api/tipos-atendimento/${deletingId}`);
      
      // Atualizar cache de consultas e forçar a recarga dos dados
      await queryClient.invalidateQueries({ queryKey: ['/api/tipos-atendimento'] });
      
      // Forçar a recarga dos dados após a exclusão
      await refetch();
      
      toast({
        title: "Tipo de atendimento excluído",
        description: "O tipo de atendimento foi excluído com sucesso."
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
  
  // Contar pacientes e usuários que usam cada tipo
  const contarUsos = (tipoId: number) => {
    const pacientes = criancaTiposAtendimento.filter((rel: any) => rel.tipoAtendimentoId === tipoId).length;
    const usuarios = usuarioTiposAtendimento.filter((rel: any) => rel.tipoAtendimentoId === tipoId).length;
    
    return { pacientes, usuarios };
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Tipos de Atendimento</h1>
          <p className="text-neutral-medium">Gerencie os tipos de terapia e atendimentos oferecidos</p>
        </div>
        
        <Dialog open={openForm} onOpenChange={setOpenForm}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent-dark text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTipo ? "Editar Tipo de Atendimento" : "Novo Tipo de Atendimento"}
              </DialogTitle>
              <DialogDescription>
                {editingTipo 
                  ? "Atualize as informações do tipo de atendimento." 
                  : "Preencha os dados para registrar um novo tipo de atendimento."}
              </DialogDescription>
            </DialogHeader>
            <TipoAtendimentoForm
              tipo={editingTipo}
              onClose={() => {
                setOpenForm(false);
                setEditingTipo(null);
              }}
              onSuccess={() => {
                // Forçar atualização dos dados
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar tipos de atendimento por nome, sigla ou descrição..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lista de Tipos de Atendimento */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : tiposFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-medium mb-2">Nenhum tipo de atendimento encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Tente ajustar os termos da busca"
              : "Adicione tipos de atendimento para organizar suas sessões"}
          </p>
          <Button onClick={() => setOpenForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar tipo de atendimento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiposFiltrados.map((tipo: any) => {
            const { pacientes, usuarios } = contarUsos(tipo.id);
            
            return (
              <Card key={tipo.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {tipo.sigla}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => editarTipo(tipo)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => confirmarExclusao(tipo.id)}
                          className="text-red-600"
                          disabled={pacientes > 0 || usuarios > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-2">{tipo.nome}</CardTitle>
                  {tipo.descricao && (
                    <CardDescription className="line-clamp-2">{tipo.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-1 w-4 h-4 flex items-center justify-center font-medium">R$</span>
                        <span>Valor Base:</span>
                      </div>
                      <span className="font-medium">{formatarValor(tipo.valor)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>Pacientes:</span>
                      </div>
                      <span className="font-medium">{pacientes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>Profissionais:</span>
                      </div>
                      <span className="font-medium">{usuarios}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => editarTipo(tipo)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de atendimento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirTipo}
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
