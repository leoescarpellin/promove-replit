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
import { Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Estendendo o schema de tipo de atendimento com validações mais específicas
const tipoAtendimentoFormSchema = insertTipoAtendimentoSchema.extend({
  sigla: z.string().min(1, "A sigla é obrigatória").max(5, "A sigla deve ter no máximo 5 caracteres"),
  nome: z.string().min(1, "O nome é obrigatório"),
  valor: z.string().min(1, "O valor é obrigatório").transform(val => val === "" ? null : val),
});

type TipoAtendimentoFormValues = z.infer<typeof tipoAtendimentoFormSchema>;

interface TipoAtendimentoFormProps {
  tipo?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TipoAtendimentoForm({ tipo, onClose, onSuccess }: TipoAtendimentoFormProps) {
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
      // Manter o valor como string para compatibilidade com o schema
      const formattedData = {
        ...data,
        // Não converter o valor para número, pois o schema espera string
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
      
      // Chamar callback de sucesso se existir
      if (onSuccess) {
        onSuccess();
      }
      
      // Fechar o formulário
      onClose();
    } catch (error) {
      // Tratar erro de validação do formulário
      if (error instanceof Error) {
        // Se o erro contiver mensagem sobre campo obrigatório, exiba uma mensagem mais amigável
        if (error.message.includes("valor") || error.message.includes("Erro ao criar tipo de atendimento")) {
          toast({
            title: "Campos obrigatórios não preenchidos",
            description: "Os campos Sigla, Nome e Valor são obrigatórios. Por favor, verifique e tente novamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao salvar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao salvar o tipo de atendimento. Verifique todos os campos e tente novamente.",
          variant: "destructive",
        });
      }
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
                <FormLabel>Sigla *</FormLabel>
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
                  <FormLabel>Nome *</FormLabel>
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
              <FormLabel>Valor Padrão *</FormLabel>
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
        
        <div className="mt-2 text-sm text-gray-500">
          <span className="text-red-500">*</span> Campos obrigatórios
        </div>
        
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
