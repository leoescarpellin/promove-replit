import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAtendimentoSchema } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatarValor } from '@/lib/utils';

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
import { CalendarIcon, Clock, DollarSign, Save, Trash2 } from 'lucide-react';

// Estendendo o schema de atendimento para validação adicional
const atendimentoFormSchema = insertAtendimentoSchema.extend({
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  horaInicio: z.string().min(1, "Hora de início é obrigatória"),
  dataFim: z.string().min(1, "Data de fim é obrigatória"),
  horaFim: z.string().min(1, "Hora de fim é obrigatória"),
}).refine((data) => {
  const inicio = new Date(`${data.dataInicio}T${data.horaInicio}`);
  const fim = new Date(`${data.dataFim}T${data.horaFim}`);
  return fim > inicio;
}, {
  message: "O horário de término deve ser posterior ao horário de início",
  path: ["horaFim"],
});

type AtendimentoFormValues = z.infer<typeof atendimentoFormSchema>;

interface AtendimentoFormProps {
  atendimento?: any;
  onClose: () => void;
}

export function AtendimentoForm({ atendimento, onClose }: AtendimentoFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [valorAtendimento, setValorAtendimento] = useState<string | null>(null);
  
  // Buscar dados para os selects
  const { data: pacientes = [] } = useQuery({
    queryKey: ['/api/criancas'],
  });
  
  const { data: tiposAtendimento = [] } = useQuery({
    queryKey: ['/api/tipos-atendimento'],
  });
  
  const { data: criancaTiposAtendimento = [] } = useQuery({
    queryKey: ['/api/crianca-tipos-atendimento'],
  });
  
  const { data: usuarioTiposAtendimento = [] } = useQuery({
    queryKey: ['/api/usuario-tipos-atendimento'],
  });
  
  // Preparar valores iniciais para o formulário
  const getDefaultValues = () => {
    if (atendimento) {
      const dataInicio = new Date(atendimento.dataInicio);
      const dataFim = new Date(atendimento.dataFim);
      
      return {
        usuarioId: atendimento.usuarioId,
        criancaId: atendimento.criancaId,
        tipoAtendimentoId: atendimento.tipoAtendimentoId,
        dataInicio: dataInicio.toISOString().split('T')[0],
        horaInicio: dataInicio.toTimeString().slice(0, 5),
        dataFim: dataFim.toISOString().split('T')[0],
        horaFim: dataFim.toTimeString().slice(0, 5),
        descricao: atendimento.descricao || '',
        valor: atendimento.valor?.toString() || '',
      };
    }
    
    // Valores padrão para novo atendimento
    const hoje = new Date();
    const dataString = hoje.toISOString().split('T')[0];
    
    // Adicionar 1 hora para o fim do atendimento
    const horaFim = new Date(hoje.getTime() + 60 * 60 * 1000);
    
    return {
      usuarioId: user?.id,
      criancaId: '',
      tipoAtendimentoId: '',
      dataInicio: dataString,
      horaInicio: hoje.toTimeString().slice(0, 5),
      dataFim: dataString,
      horaFim: horaFim.toTimeString().slice(0, 5),
      descricao: '',
      valor: '',
    };
  };
  
  // Criar formulário
  const form = useForm<AtendimentoFormValues>({
    resolver: zodResolver(atendimentoFormSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Atualizar valor automaticamente quando muda paciente ou tipo
  useEffect(() => {
    const criancaId = form.watch('criancaId');
    const tipoId = form.watch('tipoAtendimentoId');
    const usuarioId = form.watch('usuarioId');
    
    if (!criancaId || !tipoId || !usuarioId) return;
    
    // 1. Verificar se o paciente tem um valor específico para este tipo
    const criancaTipoRelacao = criancaTiposAtendimento.find(
      (rel: any) => rel.criancaId === parseInt(criancaId) && rel.tipoAtendimentoId === parseInt(tipoId)
    );
    
    if (criancaTipoRelacao?.valor) {
      setValorAtendimento(criancaTipoRelacao.valor.toString());
      form.setValue('valor', criancaTipoRelacao.valor.toString());
      return;
    }
    
    // 2. Verificar se o usuário tem um valor específico para este tipo
    const usuarioTipoRelacao = usuarioTiposAtendimento.find(
      (rel: any) => rel.usuarioId === parseInt(usuarioId) && rel.tipoAtendimentoId === parseInt(tipoId)
    );
    
    if (usuarioTipoRelacao?.valor) {
      setValorAtendimento(usuarioTipoRelacao.valor.toString());
      form.setValue('valor', usuarioTipoRelacao.valor.toString());
      return;
    }
    
    // 3. Usar o valor padrão do tipo de atendimento
    const tipo = tiposAtendimento.find((t: any) => t.id === parseInt(tipoId));
    
    if (tipo?.valor) {
      setValorAtendimento(tipo.valor.toString());
      form.setValue('valor', tipo.valor.toString());
      return;
    }
    
    setValorAtendimento(null);
  }, [form.watch('criancaId'), form.watch('tipoAtendimentoId'), form.watch('usuarioId')]);
  
  // Enviar formulário
  const onSubmit = async (data: AtendimentoFormValues) => {
    try {
      // Converter data e hora para o formato ISO
      const dataInicioObj = new Date(`${data.dataInicio}T${data.horaInicio}`);
      const dataFimObj = new Date(`${data.dataFim}T${data.horaFim}`);
      
      const atendimentoData = {
        usuarioId: parseInt(data.usuarioId.toString()),
        criancaId: parseInt(data.criancaId.toString()),
        tipoAtendimentoId: parseInt(data.tipoAtendimentoId.toString()),
        dataInicio: dataInicioObj.toISOString(),
        dataFim: dataFimObj.toISOString(),
        descricao: data.descricao,
        valor: data.valor, // Não converter o valor para número, pois o schema espera string
      };
      
      if (atendimento) {
        // Atualizar atendimento existente
        await apiRequest('PUT', `/api/atendimentos/${atendimento.id}`, atendimentoData);
        toast({
          title: "Atendimento atualizado",
          description: "O atendimento foi atualizado com sucesso.",
        });
      } else {
        // Criar novo atendimento
        await apiRequest('POST', '/api/atendimentos', atendimentoData);
        toast({
          title: "Atendimento agendado",
          description: "O atendimento foi agendado com sucesso.",
        });
      }
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/atendimentos'] });
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o atendimento.",
        variant: "destructive",
      });
    }
  };
  
  // Excluir atendimento
  const excluirAtendimento = async () => {
    if (!atendimento) return;
    
    try {
      await apiRequest('DELETE', `/api/atendimentos/${atendimento.id}`);
      
      toast({
        title: "Atendimento excluído",
        description: "O atendimento foi excluído com sucesso.",
      });
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/atendimentos'] });
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o atendimento.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profissional e Paciente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="usuarioId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profissional</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o profissional" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Se for o usuário atual, mostrar apenas ele */}
                    {user && (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.nome}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="criancaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paciente</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pacientes.map((paciente: any) => (
                      <SelectItem key={paciente.id} value={paciente.id.toString()}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Tipo de Atendimento */}
        <FormField
          control={form.control}
          name="tipoAtendimentoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Atendimento</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de atendimento" />
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
        
        {/* Data e Hora */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="horaInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="time" 
                            className="pl-10" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Término</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="horaFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Término</FormLabel>
                    <div className="flex">
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            type="time" 
                            className="pl-10" 
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        {/* Descrição */}
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhes sobre o atendimento"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Valor */}
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <div className="flex">
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 flex items-center justify-center font-semibold">
                      R$
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      className="pl-10" 
                      {...field}
                    />
                  </div>
                </FormControl>
              </div>
              {valorAtendimento && (
                <FormDescription>
                  Valor sugerido para este atendimento: {formatarValor(valorAtendimento)}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Ações */}
        <Separator />
        <div className="flex justify-between">
          {atendimento ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={excluirAtendimento}
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
              {atendimento ? "Atualizar" : "Agendar"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
