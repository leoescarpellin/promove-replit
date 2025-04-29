import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/layout';
import { useQuery } from '@tanstack/react-query';
import { UsuarioForm } from '@/components/usuarios/usuario-form';
import { formatDate, calcularIdade } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  PlusCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Shield,
  CheckCircle,
  User,
  Briefcase,
  Calendar,
  MapPin,
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
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

export default function UsuariosPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado para filtro de busca
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar usuários - sempre refetch ao montar o componente
  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/usuarios'],
    refetchOnMount: true,
    staleTime: 0,
  });
  
  // Refetch explícito ao montar o componente
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  // Buscar tipos de atendimento
  const { data: tiposAtendimento = [] } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  // Buscar relações usuário-tipo de atendimento
  const { data: usuarioTiposAtendimento = [] } = useQuery({
    queryKey: ['/api/usuario-tipos-atendimento'],
  });

  // Filtrar usuários com base na busca
  const usuariosFiltrados = usuarios.filter((usuario: any) => {
    if (!searchTerm) return true;
    
    const lowerSearch = searchTerm.toLowerCase();
    return (
      usuario.nome?.toLowerCase().includes(lowerSearch) || 
      usuario.username?.toLowerCase().includes(lowerSearch) || 
      usuario.profissao?.toLowerCase().includes(lowerSearch) ||
      false
    );
  });
  
  // Função para editar usuário
  const editarUsuario = (usuario: any) => {
    setEditingUsuario(usuario);
    setOpenForm(true);
  };
  
  // Função para iniciar exclusão de usuário
  const confirmarExclusao = (id: number) => {
    // Verificar se é o próprio usuário ou o administrador principal
    if (id === user?.id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir seu próprio usuário.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar se é o administrador principal (ID 1)
    if (id === 1) {
      toast({
        title: "Ação não permitida",
        description: "O administrador principal não pode ser excluído.",
        variant: "destructive"
      });
      return;
    }
    
    setDeletingId(id);
    setOpenDeleteDialog(true);
  };
  
  // Função para excluir usuário
  const excluirUsuario = async () => {
    if (!deletingId) return;
    
    try {
      await apiRequest('DELETE', `/api/usuarios/${deletingId}`);
      
      // Atualizar cache de consultas e forçar refetch imediato
      await queryClient.invalidateQueries({ queryKey: ['/api/usuarios'] });
      await queryClient.refetchQueries({ queryKey: ['/api/usuarios'] });
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso."
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
  
  // Obter os tipos de atendimento de um usuário
  const getTiposAtendimento = (usuarioId: number) => {
    const relacoes = usuarioTiposAtendimento.filter(
      (rel: any) => rel.usuarioId === usuarioId
    );
    
    return relacoes.map((rel: any) => {
      const tipo = tiposAtendimento.find((t: any) => t.id === rel.tipoAtendimentoId);
      return tipo;
    }).filter(Boolean);
  };

  // Verificar se o usuário atual é admin
  const isAdmin = user?.isAdmin === true;

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-dark">Usuários</h1>
          <p className="text-neutral-medium">Gerencie os profissionais que utilizam o sistema</p>
        </div>
        
        {isAdmin && (
          <Dialog open={openForm} onOpenChange={setOpenForm}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent-dark text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {editingUsuario 
                    ? "Atualize as informações do usuário." 
                    : "Preencha os dados para registrar um novo usuário."}
                </DialogDescription>
              </DialogHeader>
              <UsuarioForm
                usuario={editingUsuario}
                onClose={() => {
                  setOpenForm(false);
                  setEditingUsuario(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar usuários por nome, username ou profissão..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Lista de Usuários */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-medium mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Tente ajustar os termos da busca"
              : "Adicione usuários para permitir acesso ao sistema"}
          </p>
          {isAdmin && (
            <Button onClick={() => setOpenForm(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar usuário
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Usuário</TableHead>
                <TableHead>Profissão</TableHead>
                <TableHead>Tipo de Atendimento</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosFiltrados.map((usuario: any) => {
                const tiposAtendimento = getTiposAtendimento(usuario.id);
                
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className={usuario.isAdmin ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                            {getInitials(usuario.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center">
                            {usuario.nome}
                            {usuario.isAdmin && (
                              <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-200">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">@{usuario.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {usuario.profissao ? (
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                          {usuario.profissao}
                        </div>
                      ) : (
                        <span className="text-gray-400">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tiposAtendimento.length > 0 ? (
                          tiposAtendimento.map((tipo: any) => (
                            <Badge key={tipo.id} variant="outline" className="bg-blue-100 text-blue-800">
                              {tipo.nome}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">Nenhum tipo cadastrado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {usuario.dataNascimento && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span>
                              {calcularIdade(usuario.dataNascimento)} anos ({formatDate(usuario.dataNascimento)})
                            </span>
                          </div>
                        )}
                        {usuario.endereco && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{usuario.endereco}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(isAdmin || usuario.id === user?.id) && (
                            <DropdownMenuItem onClick={() => editarUsuario(usuario)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                          )}
                          {isAdmin && usuario.id !== user?.id && usuario.id !== 1 && (
                            <DropdownMenuItem 
                              onClick={() => confirmarExclusao(usuario.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirUsuario}
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
