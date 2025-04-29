import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertTipoAtendimentoSchema } from '@shared/schema';
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
import { Separator } from '@/components/ui/separator';
import { Save, DollarSign, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Estendendo o schema de tipo de atendimento
const tipoAtendimentoFormSchema = insertTipoAtendimentoSchema;

type TipoAtendimentoFormValues = z.infer<typeof tipoAtendimentoFormSchema>;

interface TipoAtendimentoFormProps {
  tipo?: any;
  onClose: () => void;
}

export function TipoAtendimentoForm({ tipo, onClose }: TipoAtendimentoFormProps) {
  const { toast } = useToast();
  
  // Preparar valores iniciais para o formulário
  const getDefaultValues = () => {
    if (tipo) {
      return {
        sigla: tipo.sigla || '',
        nome: tipo.nome || '',
        descricao: tipo.descricao || '',
        valor: tipo.valor?.toString() || '',
      };
    }
    
    return {
      sigla: '',
      nome: '',
      descricao: '',
      valor: '',
    };
  };
  
  // Criar formulário
  const form = useForm<TipoAtendimentoFormValues>({
    resolver: zodResolver(tipoAtendimentoFormSchema),
    defaultValues: getDefaultValues(),
  });
  
  // Enviar formulário
  const onSubmit = async (data: TipoAtendimentoFormValues) => {
    try {
      // Converter o valor para número se estiver presente
      const formattedData = {
        ...data,
        valor: data.valor ? parseFloat(data.valor) : null,
      };
      
      if (tipo) {
        // Atualizar tipo existente
        await apiRequest('PUT', `/api/tipos-atendimento/${tipo.id}`, formattedData);
        toast({
          title: "Tipo de atendimento atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        // Criar novo tipo
        await apiRequest('POST', '/api/tipos-atendimento', formattedData);
        toast({
          title: "Tipo de atendimento criado",
          description: "O novo tipo de atendimento foi cadastrado com sucesso.",
        });
      }
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ['/api/tipos-atendimento'] });
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o tipo de atendimento.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="sigla"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sigla</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: ABA" maxLength={5} />
                </FormControl>
                <FormDescription>
                  Abreviação curta para o tipo de atendimento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Terapia ABA" />
                  </FormControl>
                  <FormDescription>
                    Nome completo do tipo de atendimento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Descreva o que é este tipo de atendimento e suas características" 
                  className="resize-none min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                Uma descrição detalhada do tipo de atendimento
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Padrão</FormLabel>
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
                      placeholder="0.00"
                    />
                  </div>
                </FormControl>
              </div>
              <FormDescription>
                Valor padrão por sessão deste tipo de atendimento
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {tipo && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Alterações no valor padrão não afetarão valores personalizados já configurados para profissionais ou pacientes.
            </AlertDescription>
          </Alert>
        )}
        
        <Separator />
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent-dark text-white">
            <Save className="mr-2 h-4 w-4" />
            {tipo ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
