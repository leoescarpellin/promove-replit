import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatarValor, calcularIdade } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  Trash2, 
  CalendarIcon, 
  X, 
  Plus, 
  Check, 
  Shield, 
  UserPlus, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Criar um novo schema baseado no insertUserSchema, mas com senha opcional para edição
const usuarioFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  profissao: z.string().optional(),
  endereco: z.string().optional(),
  dataNascimento: z.string().optional(),
  pix: z.string().optional(),
  isAdmin: z.boolean().default(false)
}).refine((data) => {
  // Se uma senha foi fornecida, então confirmPassword deve ser igual
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

// Schema para o tipo de atendimento do usuário
const tipoAtendimentoUsuarioSchema = z.object({
  tipoAtendimentoId: z.string().min(1, "Selecione um tipo de atendimento"),
  valor: z.string().optional(),
});

type TipoAtendimentoUsuarioValues = z.infer<typeof tipoAtendimentoUsuarioSchema>;

interface UsuarioFormProps {
  usuario?: any;
  onClose: () => void;
}

export function UsuarioForm({ usuario, onClose }: UsuarioFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tiposAtendimentoUsuario, setTiposAtendimentoUsuario] = useState<any[]>([]);
  const [openTipoDialog, setOpenTipoDialog] = useState(false);
  
  // Buscar tipos de atendimento
  const { data: tiposAtendimento = [] } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  // Buscar relações usuário-tipo caso esteja editando
  const { data: usuarioTiposAtendimento = [], isLoading: isLoadingTiposAtendimento } = useQuery({
    queryKey: ['/api/usuario-tipos-atendimento'],
    enabled: !!usuario,
  });
  
  // Preparar valores iniciais para o formulário
  const getDefaultValues = () => {
    if (usuario) {
      return {
        nome: usuario.nome || '',
        username: usuario.username || '',
        password: '',
        confirmPassword: '',
        profissao: usuario.profissao || '',
        endereco: usuario.endereco || '',
        dataNascimento: usuario.dataNascimento ? new Date(usuario.dataNascimento).toISOString().split('T')[0] : '',
        pix: usuario.pix || '',
        isAdmin: usuario.isAdmin || false,
      };
    }
    
    return {
      nome: '',
      username: '',
      password: '',
      confirmPassword: '',
      profissao: '',
      endereco: '',
      dataNascimento: '',
      pix: '',
      isAdmin: false,
    };
  };
  
  // Formulário principal do usuário
  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Formulário para adicionar tipo de atendimento
  const tipoForm = useForm<TipoAtendimentoUsuarioValues>({
    resolver: zodResolver(tipoAtendimentoUsuarioSchema),
    defaultValues: {
      tipoAtendimentoId: '',
      valor: '',
    },
  });
  
  // Carregar tipos de atendimento existentes ao editar
  React.useEffect(() => {
    if (usuario && !isLoadingTiposAtendimento) {
      // Filtrar tipos de atendimento deste usuário
      const tiposDoUsuario = usuarioTiposAtendimento.filter(
        (rel: any) => rel.usuarioId === usuario.id
      );
      
      // Mapear para o formato que usamos no estado
      const tiposMapeados = tiposDoUsuario.map((rel: any) => {
        const tipo = tiposAtendimento.find((t: any) => t.id === rel.tipoAtendimentoId);
        return {
          id: rel.id,
          tipoAtendimentoId: rel.tipoAtendimentoId,
          nome: tipo?.nome || `Tipo #${rel.tipoAtendimentoId}`,
          sigla: tipo?.sigla || '',
          valor: rel.valor,
        };
      });
      
      setTiposAtendimentoUsuario(tiposMapeados);
    }
  }, [usuario, usuarioTiposAtendimento, isLoadingTiposAtendimento, tiposAtendimento]);
  
  // Adicionar tipo de atendimento à lista
  const adicionarTipoAtendimento = (data: TipoAtendimentoUsuarioValues) => {
    const tipoId = parseInt(data.tipoAtendimentoId);
    const tipoExistente = tiposAtendimento.find((t: any) => t.id === tipoId);
    
    // Verificar se já existe este tipo
    const jaExiste = tiposAtendimentoUsuario.some(
      (t) => t.tipoAtendimentoId === tipoId
    );
    
    if (jaExiste) {
      toast({
        title: "Tipo já adicionado",
        description: "Este tipo de atendimento já foi adicionado para este usuário.",
        variant: "destructive",
      });
      return;
    }
    
    if (tipoExistente) {
      const novoTipo = {
        id: null, // será gerado pelo backend
        tipoAtendimentoId: tipoId,
        nome: tipoExistente.nome,
        sigla: tipoExistente.sigla,
        valor: data.valor ? parseFloat(data.valor) : null,
      };
      
      setTiposAtendimentoUsuario([...tiposAtendimentoUsuario, novoTipo]);
      setOpenTipoDialog(false);
      tipoForm.reset();
    }
  };
  
  // Remover tipo de atendimento da lista
  const removerTipoAtendimento = (index: number) => {
    const novosTipos = [...tiposAtendimentoUsuario];
    novosTipos.splice(index, 1);
    setTiposAtendimentoUsuario(novosTipos);
  };
  
  // Verificar se o usuário atual é admin
  const isAdmin = user?.isAdmin === true;
  
  // Enviar formulário principal
  const onSubmit = async (data: UsuarioFormValues) => {
    try {
      // Se o formulário não tem senha e estamos editando, remover campo de senha
      if (usuario && !data.password) {
        delete data.password;
        delete data.confirmPassword;
      }
      
      let usuarioId: number;
      
      if (usuario) {
        // Atualizar usuário existente
        await apiRequest('PUT', `/api/usuarios/${usuario.id}`, data);
        usuarioId = usuario.id;
        
        toast({
          title: "Usuário atualizado",
          description: "Os dados do usuário foram atualizados com sucesso.",
        });
      } else {
        // Criar novo usuário - precisa de senha
        if (!data.password) {
          toast({
            title: "Senha obrigatória",
            description: "É necessário definir uma senha para o novo usuário.",
            variant: "destructive",
          });
          return;
        }
        
        const response = await apiRequest('POST', '/api/register', data);
        const novoUsuario = await response.json();
        usuarioId = novoUsuario.id;
        
        toast({
          title: "Usuário cadastrado",
          description: "O usuário foi cadastrado com sucesso.",
        });
      }
      
      // Lidar com os tipos de atendimento
      if (usuario) {
        // Se estiver editando, comparar para saber quais remover e quais adicionar
        const tiposAtuais = usuarioTiposAtendimento
          .filter((rel: any) => rel.usuarioId === usuario.id)
          .map((rel: any) => rel.id);
        
        const tiposIdsFormulario = tiposAtendimentoUsuario
          .filter(t => t.id !== null)
          .map(t => t.id);
        
        // Encontrar relações a remover (estão no backend mas não no formulário)
        const relacoesPraRemover = tiposAtuais.filter(
          (id: number) => !tiposIdsFormulario.includes(id)
        );
        
        // Remover relações
        for (const relId of relacoesPraRemover) {
          await apiRequest('DELETE', `/api/usuario-tipos-atendimento/${relId}`);
        }
      }
      
      // Adicionar novas relações ou atualizar existentes
      for (const tipo of tiposAtendimentoUsuario) {
        if (!tipo.id) {
          // Nova relação
          await apiRequest('POST', '/api/usuario-tipos-atendimento', {
            usuarioId,
            tipoAtendimentoId: tipo.tipoAtendimentoId,
            valor: tipo.valor,
          });
        }
        // Não estamos atualizando relações existentes neste exemplo, para simplificar
      }
      
      // Atualizar cache e forçar refetch imediato
      await queryClient.invalidateQueries({ queryKey: ['/api/usuarios'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/usuario-tipos-atendimento'] });
      
      // Refetch explícito para garantir atualização imediata
      await queryClient.refetchQueries({ queryKey: ['/api/usuarios'] });
      await queryClient.refetchQueries({ queryKey: ['/api/usuario-tipos-atendimento'] });
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o usuário.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do usuário" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Login para acesso" />
                </FormControl>
                <FormDescription>
                  Usado para login no sistema
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Senha (obrigatória apenas para novos usuários) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{usuario ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    placeholder={usuario ? "Deixe em branco para não alterar" : "Senha para acesso"} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{usuario ? "Confirmar Nova Senha" : "Confirmar Senha"}</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    {...field} 
                    placeholder="Confirme a senha" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="profissao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profissão</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Terapeuta ABA, Psicóloga, etc." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <div className="flex">
                  <FormControl>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        type="date" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                </div>
                {field.value && (
                  <FormDescription>
                    Idade atual: {calcularIdade(field.value)} anos
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Chave PIX para pagamentos" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Endereço completo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Administrador */}
        {isAdmin && (
          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-red-500" />
                    Administrador do Sistema
                  </FormLabel>
                  <FormDescription>
                    Administradores têm acesso irrestrito a todas as funcionalidades do sistema.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={usuario?.id === 1} // Não permite mudar o admin principal
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        
        {/* Tipos de Atendimento */}
        <Separator className="my-6" />
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Tipos de Atendimento</h3>
            
            <Dialog open={openTipoDialog} onOpenChange={setOpenTipoDialog}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tipo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Tipo de Atendimento</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de atendimento para este profissional. Você pode definir um valor personalizado ou deixar em branco para usar o valor padrão.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...tipoForm}>
                  <form 
                    onSubmit={tipoForm.handleSubmit(adicionarTipoAtendimento)} 
                    className="space-y-4 pt-4"
                  >
                    <FormField
                      control={tipoForm.control}
                      name="tipoAtendimentoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Atendimento</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tiposAtendimento.map((tipo: any) => (
                                <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                  {tipo.nome} ({tipo.sigla})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={tipoForm.control}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Personalizado (opcional)</FormLabel>
                          <div className="flex">
                            <FormControl>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  className="pl-10" 
                                  {...field} 
                                  placeholder="Deixe em branco para usar o valor padrão"
                                />
                              </div>
                            </FormControl>
                          </div>
                          <FormDescription>
                            Se não definir um valor, será usado o valor padrão do tipo de atendimento.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setOpenTipoDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        <Check className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {tiposAtendimentoUsuario.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>Nenhum tipo de atendimento adicionado.</p>
                <p className="text-sm mt-2">Clique em "Adicionar Tipo" para incluir tipos de atendimento para este profissional.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tiposAtendimentoUsuario.map((tipo, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-blue-100 text-blue-800">
                          {tipo.sigla}
                        </Badge>
                        <div>
                          <p className="font-medium">{tipo.nome}</p>
                          <p className="text-sm text-gray-500">
                            {tipo.valor ? formatarValor(tipo.valor) : "Valor padrão"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerTipoAtendimento(index)}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Ações */}
        <Separator className="my-6" />
        <div className="flex justify-between">
          {usuario ? (
            <div></div> // Exclusão é gerenciada na página de listagem, não no formulário
          ) : (
            <div></div>
          )}
          
          <div className="space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent-dark text-white">
              <Save className="mr-2 h-4 w-4" />
              {usuario ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
