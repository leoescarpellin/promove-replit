import React, { useState } from 'react';
import { Layout } from '@/components/layout/layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Save, Settings as SettingsIcon, Building, Database, BellRing, FileText, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('geral');
  
  // Configurações gerais
  const [configGeral, setConfigGeral] = useState({
    nomeInstituicao: 'Grupo Promove',
    telefoneContato: '(11) 99999-9999',
    emailContato: 'contato@grupopromove.com.br',
    endereco: 'Av. Principal, 123 - São Paulo, SP',
    horaInicioExpediente: '08:00',
    horaFimExpediente: '18:00',
  });
  
  // Configurações de notificações
  const [configNotificacoes, setConfigNotificacoes] = useState({
    emailLembretesAgendamento: true,
    lembreteComAntecedencia: '24',
    notificacoesNovasCriancas: true,
    notificacoesRelatorios: true,
  });
  
  // Configurações de backup
  const [configBackup, setConfigBackup] = useState({
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    manterBackups: '30',
  });
  
  // Configurações de relatórios
  const [configRelatorios, setConfigRelatorios] = useState({
    incluirLogoPDF: true,
    formatoPadrao: 'pdf',
    corCabecalho: '#5B86E5',
  });
  
  // Função genérica para atualizar as configurações
  const handleChange = (section: string, field: string, value: any) => {
    switch(section) {
      case 'geral':
        setConfigGeral(prev => ({ ...prev, [field]: value }));
        break;
      case 'notificacoes':
        setConfigNotificacoes(prev => ({ ...prev, [field]: value }));
        break;
      case 'backup':
        setConfigBackup(prev => ({ ...prev, [field]: value }));
        break;
      case 'relatorios':
        setConfigRelatorios(prev => ({ ...prev, [field]: value }));
        break;
    }
  };
  
  // Função para salvar configurações
  const salvarConfiguracoes = () => {
    // Em uma implementação real, aqui faríamos uma chamada à API
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso.",
    });
  };
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark">Configurações</h1>
        <p className="text-neutral-medium">Personalize o funcionamento do sistema Promove</p>
      </div>
      
      {!user?.isAdmin && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso limitado</AlertTitle>
          <AlertDescription>
            Algumas configurações só podem ser alteradas por administradores do sistema.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 max-w-2xl mb-6">
            <TabsTrigger value="geral">
              <Building className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <BellRing className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="backup">
              <Database className="h-4 w-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
          </TabsList>
          
          {/* Configurações Gerais */}
          <TabsContent value="geral">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Informações básicas da instituição e funcionamento do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeInstituicao">Nome da Instituição</Label>
                    <Input 
                      id="nomeInstituicao" 
                      value={configGeral.nomeInstituicao}
                      onChange={e => handleChange('geral', 'nomeInstituicao', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefoneContato">Telefone de Contato</Label>
                    <Input 
                      id="telefoneContato" 
                      value={configGeral.telefoneContato}
                      onChange={e => handleChange('geral', 'telefoneContato', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailContato">E-mail de Contato</Label>
                    <Input 
                      id="emailContato" 
                      type="email"
                      value={configGeral.emailContato}
                      onChange={e => handleChange('geral', 'emailContato', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input 
                      id="endereco" 
                      value={configGeral.endereco}
                      onChange={e => handleChange('geral', 'endereco', e.target.value)}
                    />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horaInicioExpediente">Horário de Início do Expediente</Label>
                    <Input 
                      id="horaInicioExpediente" 
                      type="time"
                      value={configGeral.horaInicioExpediente}
                      onChange={e => handleChange('geral', 'horaInicioExpediente', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="horaFimExpediente">Horário de Fim do Expediente</Label>
                    <Input 
                      id="horaFimExpediente" 
                      type="time"
                      value={configGeral.horaFimExpediente}
                      onChange={e => handleChange('geral', 'horaFimExpediente', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={salvarConfiguracoes} className="bg-accent text-white hover:bg-accent-dark">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configurações de Notificações */}
          <TabsContent value="notificacoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>
                  Gerencie como e quando as notificações são enviadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailLembretesAgendamento">Enviar lembretes de agendamento por e-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Envia e-mails de lembrete para profissionais e responsáveis
                    </p>
                  </div>
                  <Switch
                    id="emailLembretesAgendamento"
                    checked={configNotificacoes.emailLembretesAgendamento}
                    onCheckedChange={value => handleChange('notificacoes', 'emailLembretesAgendamento', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lembreteComAntecedencia">Enviar lembretes com antecedência de (horas)</Label>
                  <Select 
                    value={configNotificacoes.lembreteComAntecedencia}
                    onValueChange={value => handleChange('notificacoes', 'lembreteComAntecedencia', value)}
                  >
                    <SelectTrigger id="lembreteComAntecedencia">
                      <SelectValue placeholder="Selecione a antecedência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificacoesNovasCriancas">Notificações de novos cadastros de pacientes</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando novos pacientes forem cadastrados no sistema
                    </p>
                  </div>
                  <Switch
                    id="notificacoesNovasCriancas"
                    checked={configNotificacoes.notificacoesNovasCriancas}
                    onCheckedChange={value => handleChange('notificacoes', 'notificacoesNovasCriancas', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notificacoesRelatorios">Notificações de relatórios pendentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes sobre relatórios que precisam ser preenchidos
                    </p>
                  </div>
                  <Switch
                    id="notificacoesRelatorios"
                    checked={configNotificacoes.notificacoesRelatorios}
                    onCheckedChange={value => handleChange('notificacoes', 'notificacoesRelatorios', value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={salvarConfiguracoes} className="bg-accent text-white hover:bg-accent-dark">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configurações de Backup */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Backup</CardTitle>
                <CardDescription>
                  Configure as opções de segurança e backup dos dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="backupAutomatico">Backup automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Realiza backup automático da base de dados
                    </p>
                  </div>
                  <Switch
                    id="backupAutomatico"
                    checked={configBackup.backupAutomatico}
                    onCheckedChange={value => handleChange('backup', 'backupAutomatico', value)}
                    disabled={!user?.isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequenciaBackup">Frequência do backup</Label>
                  <Select 
                    value={configBackup.frequenciaBackup}
                    onValueChange={value => handleChange('backup', 'frequenciaBackup', value)}
                    disabled={!user?.isAdmin}
                  >
                    <SelectTrigger id="frequenciaBackup">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manterBackups">Manter backups por (dias)</Label>
                  <Select 
                    value={configBackup.manterBackups}
                    onValueChange={value => handleChange('backup', 'manterBackups', value)}
                    disabled={!user?.isAdmin}
                  >
                    <SelectTrigger id="manterBackups">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                      <SelectItem value="365">365 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={!user?.isAdmin}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Realizar backup manual agora
                  </Button>
                </div>
                
                {!user?.isAdmin && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Acesso restrito</AlertTitle>
                    <AlertDescription>
                      Apenas administradores podem alterar as configurações de backup.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={salvarConfiguracoes} 
                  className="bg-accent text-white hover:bg-accent-dark"
                  disabled={!user?.isAdmin}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configurações de Relatórios */}
          <TabsContent value="relatorios">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Relatórios</CardTitle>
                <CardDescription>
                  Personalize a aparência e o funcionamento dos relatórios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="incluirLogoPDF">Incluir logo nos PDFs</Label>
                    <p className="text-sm text-muted-foreground">
                      Adiciona o logotipo do Promove nos relatórios em PDF
                    </p>
                  </div>
                  <Switch
                    id="incluirLogoPDF"
                    checked={configRelatorios.incluirLogoPDF}
                    onCheckedChange={value => handleChange('relatorios', 'incluirLogoPDF', value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="formatoPadrao">Formato padrão de exportação</Label>
                  <Select 
                    value={configRelatorios.formatoPadrao}
                    onValueChange={value => handleChange('relatorios', 'formatoPadrao', value)}
                  >
                    <SelectTrigger id="formatoPadrao">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corCabecalho">Cor do cabeçalho dos relatórios</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="corCabecalho" 
                      type="color"
                      value={configRelatorios.corCabecalho}
                      onChange={e => handleChange('relatorios', 'corCabecalho', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input 
                      value={configRelatorios.corCabecalho}
                      onChange={e => handleChange('relatorios', 'corCabecalho', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Label>Visualização</Label>
                  <div className="border rounded-md p-4">
                    <div 
                      className="w-full h-16 rounded-md flex items-center px-4 text-white font-medium" 
                      style={{ backgroundColor: configRelatorios.corCabecalho }}
                    >
                      <div className="flex-1">
                        {configRelatorios.incluirLogoPDF && (
                          <div className="text-xl font-bold">Grupo Promove</div>
                        )}
                        <div>Relatório de Atendimentos</div>
                      </div>
                      <div>01/01/2023</div>
                    </div>
                    <div className="mt-2 h-16 border-b border-dashed"></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={salvarConfiguracoes} className="bg-accent text-white hover:bg-accent-dark">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
