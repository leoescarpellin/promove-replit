import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCriancaSchema } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatarValor, calcularIdade } from '@/lib/utils';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Save, Trash2, CalendarIcon, X, Plus } from 'lucide-react';
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

// Estendendo o schema da criança
const clienteFormSchema = insertCriancaSchema;

type ClienteFormValues = z.infer<typeof clienteFormSchema>;

// Schema para o tipo de atendimento do cliente
const tipoAtendimentoClienteSchema = z.object({
  tipoAtendimentoId: z.string().min(1, "Selecione um tipo de atendimento"),
  valor: z.string().optional(),
});

type TipoAtendimentoClienteValues = z.infer<typeof tipoAtendimentoClienteSchema>;

interface ClienteFormProps {
  cliente?: any;
  onClose: () => void;
}

export function ClienteForm({ cliente, onClose }: ClienteFormProps) {
  const { toast } = useToast();
  const [tiposAtendimentoCliente, setTiposAtendimentoCliente] = useState<any[]>([]);
  const [openTipoDialog, setOpenTipoDialog] = useState(false);
  
  // Buscar tipos de atendimento
  const { data: tiposAtendimento = [] } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  // Buscar relações criança-tipo caso esteja editando
  const { data: criancaTiposAtendimento = [], isLoading: isLoadingTiposAtendimento } = useQuery({
    queryKey: ['/api/crianca-tipos-atendimento'],
    enabled: !!cliente,
  });
  
  // Preparar valores iniciais para o formulário
  const getDefaultValues = () => {
    if (cliente) {
      return {
        nome: cliente.nome || '',
        endereco: cliente.endereco || '',
        dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento).toISOString().split('T')[0] : '',
        pai: cliente.pai || '',
        mae: cliente.mae || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
      };
    }
    
    return {
      nome: '',
      endereco: '',
      dataNascimento: '',
      pai: '',
      mae: '',
      email: '',
      telefone: '',
    };
  };
  
  // Formulário principal do cliente
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Formulário para adicionar tipo de atendimento
  const tipoForm = useForm<TipoAtendimentoClienteValues>({
    resolver: zodResolver(tipoAtendimentoClienteSchema),
    defaultValues: {
      tipoAtendimentoId: '',
      valor: '',
    },
  });
  
  // Carregar tipos de atendimento existentes ao editar
  React.useEffect(() => {
    if (cliente && !isLoadingTiposAtendimento) {
      // Filtrar tipos de atendimento desta criança
      const tiposDaCrianca = criancaTiposAtendimento.filter(
        (rel: any) => rel.criancaId === cliente.id
      );
      
      // Mapear para o formato que usamos no estado
      const tiposMapeados = tiposDaCrianca.map((rel: any) => {
        const tipo = tiposAtendimento.find((t: any) => t.id === rel.tipoAtendimentoId);
        return {
          id: rel.id,
          tipoAtendimentoId: rel.tipoAtendimentoId,
          nome: tipo?.nome || `Tipo #${rel.tipoAtendimentoId}`,
          sigla: tipo?.sigla || '',
          valor: rel.valor,
        };
      });
      
      setTiposAtendimentoCliente(tiposMapeados);
    }
  }, [cliente, criancaTiposAtendimento, isLoadingTiposAtendimento, tiposAtendimento]);
  
  // Adicionar tipo de atendimento à lista
  const adicionarTipoAtendimento = (data: TipoAtendimentoClienteValues) => {
    const tipoId = parseInt(data.tipoAtendimentoId);
    const tipoExistente = tiposAtendimento.find((t: any) => t.id === tipoId);
    
    // Verificar se já existe este tipo
    const jaExiste = tiposAtendimentoCliente.some(
      (t) => t.tipoAtendimentoId === tipoId
    );
    
    if (jaExiste) {
      toast({
        title: "Tipo já adicionado",
        description: "Este tipo de atendimento já foi adicionado para este cliente.",
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
      
      setTiposAtendimentoCliente([...tiposAtendimentoCliente, novoTipo]);
      setOpenTipoDialog(false);
      tipoForm.reset();
    }
  };
  
  // Remover tipo de atendimento da lista
  const removerTipoAtendimento = (index: number) => {
    const novosTipos = [...tiposAtendimentoCliente];
    novosTipos.splice(index, 1);
    setTiposAtendimentoCliente(novosTipos);
  };
  
  // Enviar formulário principal
  const onSubmit = async (data: ClienteFormValues) => {
    try {
      let criancaId: number;
      
      if (cliente) {
        // Atualizar cliente existente
        await apiRequest('PUT', `/api/criancas/${cliente.id}`, data);
        criancaId = cliente.id;
        
        toast({
          title: "Cliente atualizado",
          description: "Os dados do cliente foram atualizados com sucesso.",
        });
      } else {
        // Criar novo cliente
        const response = await apiRequest('POST', '/api/criancas', data);
        const novoCliente = await response.json();
        criancaId = novoCliente.id;
        
        toast({
          title: "Cliente cadastrado",
          description: "O cliente foi cadastrado com sucesso.",
        });
      }
      
      // Lidar com os tipos de atendimento
      if (cliente) {
        // Se estiver editando, comparar para saber quais remover e quais adicionar
        const tiposAtuais = criancaTiposAtendimento
          .filter((rel: any) => rel.criancaId === cliente.id)
          .map((rel: any) => rel.id);
        
        const tiposIdsFormulario = tiposAtendimentoCliente
          .filter(t => t.id !== null)
          .map(t => t.id);
        
        // Encontrar relações a remover (estão no backend mas não no formulário)
        const relacoesPraRemover = tiposAtuais.filter(
          (id: number) => !tiposIdsFormulario.includes(id)
        );
        
        // Remover relações
        for (const relId of relacoesPraRemover) {
          await apiRequest('DELETE', `/api/crianca-tipos-atendimento/${relId}`);
        }
      }
      
      // Adicionar novas relações ou atualizar existentes
      for (const tipo of tiposAtendimentoCliente) {
        if (!tipo.id) {
          // Nova relação
          await apiRequest('POST', '/api/crianca-tipos-atendimento', {
            criancaId,
            tipoAtendimentoId: tipo.tipoAtendimentoId,
            valor: tipo.valor,
          });
        }
        // Não estamos atualizando relações existentes neste exemplo, para simplificar
      }
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/criancas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crianca-tipos-atendimento'] });
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o cliente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações básicas */}
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome da criança" />
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
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone de Contato</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(00) 00000-0000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Pai</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do pai" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="mae"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Mãe</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome da mãe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail para Contato</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="email@exemplo.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Tipo de Atendimento</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de atendimento para este cliente. Você pode definir um valor personalizado ou deixar em branco para usar o valor padrão.
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
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0" 
                              {...field} 
                              placeholder="Deixe em branco para usar o valor padrão"
                            />
                          </FormControl>
                          <FormDescription>
                            Se não definir um valor, será usado o valor do profissional ou o valor padrão do tipo de atendimento.
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
          
          {tiposAtendimentoCliente.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p>Nenhum tipo de atendimento adicionado.</p>
                <p className="text-sm mt-2">Clique em "Adicionar Tipo" para incluir tipos de atendimento para este cliente.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tiposAtendimentoCliente.map((tipo, index) => (
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
          {cliente ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                // Não implementado aqui, geralmente seria um modal de confirmação
                toast({
                  title: "Funcionalidade não implementada",
                  description: "A exclusão de clientes deve ser feita com cuidado e não está implementada neste formulário.",
                  variant: "destructive",
                });
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
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
              {cliente ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}