import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn, formatDateTime } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AtendimentoForm } from '@/components/atendimentos/atendimento-form';

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  color: string;
  pacienteNome?: string;
  profissionalNome?: string;
  tipoNome?: string;
  atendimento: any;
}

interface CalendarViewProps {
  view: string;
  atendimentos: any[];
  pacientes: any[];
  usuarios: any[];
  onAddAtendimento: () => void;
}

export function CalendarView({ view, atendimentos, pacientes, usuarios, onAddAtendimento }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  
  // Mapear atendimentos para eventos do calendário
  useEffect(() => {
    const mappedEvents = atendimentos.map((atendimento) => {
      const paciente = pacientes.find((p) => p.id === atendimento.criancaId);
      const usuario = usuarios.find((u) => u.id === atendimento.usuarioId);
      
      return {
        id: atendimento.id,
        title: paciente?.nome || `Paciente #${atendimento.criancaId}`,
        start: new Date(atendimento.dataInicio),
        end: new Date(atendimento.dataFim),
        color: getCategoryColor(atendimento.tipoAtendimentoId),
        pacienteNome: paciente?.nome,
        profissionalNome: usuario?.nome,
        tipoNome: getTipoNome(atendimento.tipoAtendimentoId),
        atendimento,
      };
    });
    
    setEvents(mappedEvents);
  }, [atendimentos, pacientes, usuarios]);
  
  // Função para obter cores diferentes com base no tipo de atendimento
  const getCategoryColor = (categoryId: number) => {
    const colors = ['#FF6B6B', '#5B86E5', '#FFD966', '#5CBCAA', '#9C79F0', '#FF9F68'];
    return colors[categoryId % colors.length];
  };
  
  // Função auxiliar para obter o nome do tipo de atendimento (mockado por enquanto)
  const getTipoNome = (tipoId: number) => {
    const tipos = {
      1: 'Terapia ABA',
      2: 'Avaliação Inicial',
      3: 'Intervenção Social',
    };
    
    return tipos[tipoId as keyof typeof tipos] || `Tipo #${tipoId}`;
  };
  
  // Navegar para o próximo período
  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  // Navegar para o período anterior
  const prevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  // Navegar para hoje
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handler para abrir detalhes do evento
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setOpenEventDialog(true);
  };
  
  // Renderizar calendário mensal
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    
    // Começar no primeiro dia da semana que contém o primeiro dia do mês
    const monthStartDate = startOfWeek(start, { locale: ptBR });
    // Terminar no último dia da semana que contém o último dia do mês
    const monthEndDate = endOfWeek(end, { locale: ptBR });
    
    const days = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
          <div 
            key={index} 
            className="h-10 flex items-center justify-center font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
        
        {/* Dias do mês */}
        {days.map((day, dayIdx) => {
          // Filtrar eventos para este dia
          const dayEvents = events.filter(event => 
            isSameDay(day, event.start)
          );
          
          return (
            <div
              key={dayIdx}
              className={cn(
                "min-h-[120px] p-1 border rounded-md",
                isSameMonth(day, currentDate) 
                  ? "bg-white" 
                  : "bg-gray-50 text-gray-400",
                isSameDay(day, new Date()) && "border-accent"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={cn(
                  "text-sm",
                  isSameDay(day, new Date()) && "font-bold text-accent"
                )}>
                  {format(day, 'd')}
                </span>
                
                {isSameMonth(day, currentDate) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5" 
                    onClick={onAddAtendimento}
                  >
                    <PlusCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {/* Eventos do dia */}
              <div className="space-y-1 max-h-[100px] overflow-y-auto">
                {dayEvents.slice(0, 3).map((event, eventIdx) => (
                  <TooltipProvider key={eventIdx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="text-xs p-1 rounded-md cursor-pointer truncate"
                          style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
                          onClick={() => handleEventClick(event)}
                        >
                          {format(event.start, 'HH:mm')} - {event.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-medium">{event.title}</div>
                          <div>{format(event.start, 'dd/MM/yyyy HH:mm')} - {format(event.end, 'HH:mm')}</div>
                          <div>Profissional: {event.profissionalNome}</div>
                          <div>Tipo: {event.tipoNome}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    + {dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Renderizar calendário semanal
  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    const end = endOfWeek(currentDate, { locale: ptBR });
    const days = eachDayOfInterval({ start, end });
    
    // Horários de 7h às 20h
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-8 border-b">
            {/* Célula de canto */}
            <div className="p-2 border-r"></div>
            
            {/* Cabeçalhos dos dias */}
            {days.map((day, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-2 text-center",
                  isSameDay(day, new Date()) && "bg-accent/10 font-bold"
                )}
              >
                <div className="font-medium">{format(day, 'EEEE', { locale: ptBR })}</div>
                <div className={cn(
                  "text-sm",
                  isSameDay(day, new Date()) && "text-accent font-bold"
                )}>
                  {format(day, 'dd/MM')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Horários e eventos */}
          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b">
                {/* Hora */}
                <div className="p-2 border-r text-sm text-gray-500 text-right">
                  {hour}:00
                </div>
                
                {/* Células para cada dia */}
                {days.map((day, dayIdx) => {
                  const dayStart = new Date(day);
                  dayStart.setHours(hour);
                  dayStart.setMinutes(0);
                  
                  const dayEnd = new Date(day);
                  dayEnd.setHours(hour + 1);
                  dayEnd.setMinutes(0);
                  
                  // Encontrar eventos que ocorrem nesta hora
                  const hourEvents = events.filter(event => {
                    const eventStart = new Date(event.start);
                    const eventEnd = new Date(event.end);
                    
                    // Evento começa durante esta hora ou começou antes mas ainda está em andamento
                    return (
                      (eventStart >= dayStart && eventStart < dayEnd) || 
                      (eventStart < dayStart && eventEnd > dayStart)
                    ) && isSameDay(day, eventStart);
                  });
                  
                  return (
                    <div 
                      key={dayIdx} 
                      className={cn(
                        "p-1 min-h-[60px] relative border-r",
                        isSameDay(day, new Date()) && "bg-accent/5"
                      )}
                    >
                      {hourEvents.map((event, eventIdx) => (
                        <TooltipProvider key={eventIdx}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="text-xs p-1 rounded-md cursor-pointer mb-1 truncate"
                                style={{ backgroundColor: `${event.color}20`, borderLeft: `3px solid ${event.color}` }}
                                onClick={() => handleEventClick(event)}
                              >
                                {format(event.start, 'HH:mm')} - {event.title}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">{event.title}</div>
                                <div>{format(event.start, 'dd/MM/yyyy HH:mm')} - {format(event.end, 'HH:mm')}</div>
                                <div>Profissional: {event.profissionalNome}</div>
                                <div>Tipo: {event.tipoNome}</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Renderizar visualização diária
  const renderDayView = () => {
    // Horários de 7h às 20h
    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    
    // Filtrando eventos para o dia atual
    const dayEvents = events.filter(event => 
      isSameDay(currentDate, event.start)
    );
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {/* Header do dia */}
        <div className="text-center p-2 bg-accent/10 rounded-md">
          <h3 className="text-lg font-medium">
            {format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>
        
        {/* Grade de horários */}
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourStart = new Date(currentDate);
            hourStart.setHours(hour);
            hourStart.setMinutes(0);
            
            const hourEnd = new Date(currentDate);
            hourEnd.setHours(hour + 1);
            hourEnd.setMinutes(0);
            
            // Encontrar eventos que ocorrem nesta hora
            const hourEvents = dayEvents.filter(event => {
              const eventStart = new Date(event.start);
              const eventEnd = new Date(event.end);
              
              // Evento começa durante esta hora ou começou antes mas ainda está em andamento
              return (
                (eventStart >= hourStart && eventStart < hourEnd) || 
                (eventStart < hourStart && eventEnd > hourStart)
              );
            });
            
            return (
              <div key={hour} className="grid grid-cols-[80px_1fr] gap-2">
                <div className="text-right pr-2 pt-2 text-sm text-gray-500 border-r">
                  {hour}:00
                </div>
                
                <div className="min-h-[60px] relative">
                  {hourEvents.length === 0 ? (
                    <div className="h-full w-full border border-dashed rounded-md p-2 flex items-center justify-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-400 hover:text-accent"
                        onClick={onAddAtendimento}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Agendar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hourEvents.map((event, eventIdx) => (
                        <Card
                          key={eventIdx}
                          className="p-2 cursor-pointer hover:shadow-md transition-shadow"
                          style={{ borderLeft: `4px solid ${event.color}` }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-gray-500">
                                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                              </div>
                            </div>
                            <Badge style={{ backgroundColor: event.color }}>
                              {event.tipoNome}
                            </Badge>
                          </div>
                          <div className="text-sm mt-1">
                            Profissional: {event.profissionalNome}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Renderizar o título do período
  const renderTitle = () => {
    if (view === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { locale: ptBR });
      const end = endOfWeek(currentDate, { locale: ptBR });
      return `${format(start, "dd 'de' MMM", { locale: ptBR })} - ${format(end, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
    } else if (view === 'day') {
      return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
    return '';
  };
  
  return (
    <div className="space-y-4">
      {/* Cabeçalho do Calendário */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <h2 className="text-xl font-bold">
          {renderTitle()}
        </h2>
        
        <Button variant="outline" onClick={onAddAtendimento}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>
      
      {/* Conteúdo do Calendário */}
      <div className="bg-white rounded-md p-2">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
      
      {/* Dialog para visualizar/editar evento */}
      {selectedEvent && (
        <Dialog open={openEventDialog} onOpenChange={setOpenEventDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Atendimento</DialogTitle>
              <DialogDescription>
                Visualize ou edite os detalhes deste atendimento.
              </DialogDescription>
            </DialogHeader>
            
            <AtendimentoForm
              atendimento={selectedEvent.atendimento}
              onClose={() => {
                setOpenEventDialog(false);
                setSelectedEvent(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
