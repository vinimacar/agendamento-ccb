import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/services/eventService';
import { congregationService, CongregationData } from '@/services/congregationService';
import { EventType, eventTypeLabels } from '@/types';
import { ArrowLeft, CalendarIcon, Clock, Loader2, Save, FileText, MapPin, Users, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { EventSchedule } from '@/types';

const DAYS_OF_WEEK = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda' },
  { id: 'terca', label: 'Terça' },
  { id: 'quarta', label: 'Quarta' },
  { id: 'quinta', label: 'Quinta' },
  { id: 'sexta', label: 'Sexta' },
  { id: 'sabado', label: 'Sábado' },
];

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [congregations, setCongregations] = useState<CongregationData[]>([]);
  const [loadingCongregations, setLoadingCongregations] = useState(true);
  const [allElders, setAllElders] = useState<string[]>([]);
  const [allCooperators, setAllCooperators] = useState<string[]>([]);
  const [allDeacons, setAllDeacons] = useState<string[]>([]);
  const [allYouthCooperators, setAllYouthCooperators] = useState<string[]>([]);
  const [loadingMinisters, setLoadingMinisters] = useState(true);
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: '' as EventType | '',
    date: undefined as Date | undefined,
    time: '',
    congregationId: '',
    elderName: '',
    elderFromOtherLocation: false,
    otherElderName: '',
    ministerRole: 'elder' as 'elder' | 'cooperator' | 'deacon' | 'youth-cooperator',
    description: '',
    irmaos: '',
    irmas: '',
  });

  // Estados para horários de cultos e RJM
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<EventSchedule>({
    day: '',
    time: '',
    type: 'culto',
    hasSpecialRule: false,
    weekOfMonth: undefined,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [congregationsData, ministersData] = await Promise.all([
          congregationService.getAll(),
          congregationService.getAllMinisters(),
        ]);
        
        setCongregations(congregationsData);
        setAllElders(ministersData.elders);
        setAllCooperators(ministersData.cooperators);
        setAllDeacons(ministersData.deacons);
        setAllYouthCooperators(ministersData.youthCooperators);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingCongregations(false);
        setLoadingMinisters(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!isEditMode || !id) return;
      
      setLoadingData(true);
      try {
        const data = await eventService.getById(id);
        if (data) {
          setFormData({
            title: data.title || '',
            type: data.type || '',
            date: data.date,
            time: data.time || '',
            congregationId: data.congregationId || '',
            elderName: data.elderName || '',
            elderFromOtherLocation: data.elderFromOtherLocation || false,
            otherElderName: data.elderFromOtherLocation ? data.elderName || '' : '',
            ministerRole: data.ministerRole || 'elder',
            description: data.description || '',
            irmaos: data.irmaos?.toString() || '',
            irmas: data.irmas?.toString() || '',
          });
          if (data.schedules) {
            setSchedules(data.schedules);
          }
        } else {
          toast({
            title: 'Evento não encontrado',
            variant: 'destructive',
          });
          navigate('/events');
        }
      } catch (error) {
        console.error('Error loading event:', error);
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar os dados do evento.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadEvent();
  }, [id, isEditMode, navigate, toast]);

  const selectedCongregation = congregations.find(c => c.id === formData.congregationId);

  // Funções para gerenciar horários
  const addSchedule = () => {
    if (!newSchedule.day || !newSchedule.time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o dia e horário.',
        variant: 'destructive',
      });
      return;
    }

    if (newSchedule.hasSpecialRule && !newSchedule.weekOfMonth) {
      toast({
        title: 'Regra especial incompleta',
        description: 'Selecione a semana do mês.',
        variant: 'destructive',
      });
      return;
    }

    setSchedules([...schedules, { ...newSchedule }]);
    setNewSchedule({
      day: '',
      time: '',
      type: 'culto',
      hasSpecialRule: false,
      weekOfMonth: undefined,
    });
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const getDayLabel = (dayId: string) => {
    return DAYS_OF_WEEK.find(d => d.id === dayId)?.label || dayId;
  };

  const getWeekLabel = (week?: string) => {
    const labels: Record<string, string> = {
      '1': '1º',
      '2': '2º',
      '3': '3º',
      '4': '4º',
    };
    return week ? labels[week] : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.type || !formData.date || !formData.time) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        type: formData.type as EventType,
        date: formData.date!,
        time: formData.time,
        congregationId: formData.congregationId || undefined,
        congregationName: selectedCongregation?.name || undefined,
        description: formData.description || undefined,
        elderName: undefined as string | undefined,
        elderFromOtherLocation: undefined as boolean | undefined,
        ministerRole: undefined as 'elder' | 'cooperator' | 'deacon' | 'youth-cooperator' | undefined,
        irmaos: undefined as number | undefined,
        irmas: undefined as number | undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
      };

      // Adicionar oficiante (ancião, cooperador, diácono ou cooperador de jovens)
      if (formData.elderFromOtherLocation && formData.otherElderName) {
        eventData.elderName = formData.otherElderName;
        eventData.elderFromOtherLocation = true;
        eventData.ministerRole = formData.ministerRole;
      } else if (formData.elderName) {
        eventData.elderName = formData.elderName;
        eventData.elderFromOtherLocation = false;
        eventData.ministerRole = formData.ministerRole;
      }

      // Adicionar campos de contagem para Santa Ceia e Batismo
      if (formData.type === 'santa-ceia' || formData.type === 'batismo') {
        if (formData.irmaos) eventData.irmaos = parseInt(formData.irmaos);
        if (formData.irmas) eventData.irmas = parseInt(formData.irmas);
      }

      if (isEditMode && id) {
        await eventService.update(id, eventData);
        toast({
          title: 'Evento atualizado!',
          description: 'O evento foi atualizado com sucesso.',
        });
      } else {
        await eventService.create(eventData);
        toast({
          title: 'Evento agendado!',
          description: 'O evento foi salvo com sucesso.',
        });
      }

      navigate('/events');
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível agendar o evento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando evento...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isEditMode ? 'Editar Evento' : 'Novo Evento'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? 'Atualize os dados do evento' : 'Agende um novo evento'}
            </p>
          </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações do Evento */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Informações do Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Evento *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Culto de Adoração"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Evento *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Detalhes adicionais sobre o evento..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Campos condicionais para Santa Ceia e Batismo */}
              {(formData.type === 'santa-ceia' || formData.type === 'batismo') && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-foreground">
                    {formData.type === 'santa-ceia' ? 'Participantes da Santa Ceia' : 'Batizandos'}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="irmaos">
                        {formData.type === 'santa-ceia' ? 'Irmãos' : 'Homens'}
                      </Label>
                      <Input
                        id="irmaos"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.irmaos}
                        onChange={(e) => setFormData({ ...formData, irmaos: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="irmas">
                        {formData.type === 'santa-ceia' ? 'Irmãs' : 'Mulheres'}
                      </Label>
                      <Input
                        id="irmas"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.irmas}
                        onChange={(e) => setFormData({ ...formData, irmas: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        {(parseInt(formData.irmaos) || 0) + (parseInt(formData.irmas) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data e Hora */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Data e Hora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          format(formData.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => setFormData({ ...formData, date })}
                        initialFocus
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Hora *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horários de Cultos e RJM */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horários de Cultos e RJM (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de horários cadastrados */}
              {schedules.length > 0 && (
                <div className="space-y-2">
                  <Label>Horários Cadastrados</Label>
                  <div className="space-y-2">
                    {schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium",
                            schedule.type === 'culto' 
                              ? "bg-primary/10 text-primary border border-primary/20" 
                              : "bg-accent/10 text-accent border border-accent/20"
                          )}>
                            {schedule.type === 'culto' ? 'Culto' : 'RJM'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-foreground">{getDayLabel(schedule.day)}</span>
                            <span className="text-muted-foreground"> às </span>
                            <span className="font-medium text-foreground">{schedule.time}</span>
                            {schedule.hasSpecialRule && schedule.weekOfMonth && (
                              <>
                                <span className="text-muted-foreground"> - </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                  {getWeekLabel(schedule.weekOfMonth)} {getDayLabel(schedule.day)} do mês
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/20"
                          onClick={() => removeSchedule(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulário para adicionar novo horário */}
              <div className="space-y-4 p-4 rounded-lg border border-dashed border-border">
                <Label className="text-base font-semibold">Adicionar Novo Horário</Label>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={newSchedule.type}
                      onValueChange={(value: 'culto' | 'rjm') => 
                        setNewSchedule({ ...newSchedule, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culto">Culto</SelectItem>
                        <SelectItem value="rjm">RJM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dia da Semana *</Label>
                    <Select
                      value={newSchedule.day}
                      onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.id} value={day.id}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Horário *</Label>
                    <Input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    />
                  </div>
                </div>

                {/* Checkbox para regra especial */}
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="hasSpecialRule"
                    checked={newSchedule.hasSpecialRule}
                    onCheckedChange={(checked) => 
                      setNewSchedule({ 
                        ...newSchedule, 
                        hasSpecialRule: checked as boolean,
                        weekOfMonth: checked ? newSchedule.weekOfMonth : undefined,
                      })
                    }
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="hasSpecialRule" 
                      className="text-sm font-normal cursor-pointer leading-none"
                    >
                      Tem regra especial de repetição mensal
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marque se o culto/RJM ocorre apenas em uma semana específica do mês
                    </p>
                  </div>
                </div>

                {/* Campo condicional para semana do mês */}
                {newSchedule.hasSpecialRule && (
                  <div className="space-y-2 pl-6">
                    <Label>Semana do Mês *</Label>
                    <Select
                      value={newSchedule.weekOfMonth}
                      onValueChange={(value: '1' | '2' | '3' | '4') => 
                        setNewSchedule({ ...newSchedule, weekOfMonth: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a semana" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º {getDayLabel(newSchedule.day) || 'dia'} do mês</SelectItem>
                        <SelectItem value="2">2º {getDayLabel(newSchedule.day) || 'dia'} do mês</SelectItem>
                        <SelectItem value="3">3º {getDayLabel(newSchedule.day) || 'dia'} do mês</SelectItem>
                        <SelectItem value="4">4º {getDayLabel(newSchedule.day) || 'dia'} do mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addSchedule}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Horário
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Congregação */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Congregação (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Selecione a Congregação</Label>
                <Select
                  value={formData.congregationId}
                  onValueChange={(value) => setFormData({ ...formData, congregationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCongregations ? 'Carregando...' : 'Nenhuma (evento geral)'} />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((congregation) => (
                      <SelectItem key={congregation.id} value={congregation.id}>
                        {congregation.name} - {congregation.city}/{congregation.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Oficiante */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Oficiante (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de tipo de ministro para eventos de reforço */}
              {(formData.type === 'culto-oficial-reforco' || formData.type === 'rjm-reforco') && (
                <div className="space-y-2">
                  <Label>Tipo de Oficiante</Label>
                  <Select
                    value={formData.ministerRole}
                    onValueChange={(value: 'elder' | 'cooperator' | 'deacon' | 'youth-cooperator') => 
                      setFormData({ ...formData, ministerRole: value, elderName: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elder">Ancião</SelectItem>
                      <SelectItem value="cooperator">Cooperador</SelectItem>
                      <SelectItem value="deacon">Diácono</SelectItem>
                      <SelectItem value="youth-cooperator">Cooperador de Jovens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {formData.ministerRole === 'elder' && 'Selecione o Ancião'}
                  {formData.ministerRole === 'cooperator' && 'Selecione o Cooperador'}
                  {formData.ministerRole === 'deacon' && 'Selecione o Diácono'}
                  {formData.ministerRole === 'youth-cooperator' && 'Selecione o Cooperador de Jovens'}
                </Label>
                <Select
                  value={formData.elderName}
                  onValueChange={(value) => setFormData({ ...formData, elderName: value })}
                  disabled={loadingMinisters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingMinisters ? 'Carregando...' : 
                      formData.ministerRole === 'elder' ? 'Selecione um ancião' :
                      formData.ministerRole === 'cooperator' ? 'Selecione um cooperador' :
                      formData.ministerRole === 'deacon' ? 'Selecione um diácono' :
                      'Selecione um cooperador de jovens'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.ministerRole === 'elder' && allElders.map((elder) => (
                      <SelectItem key={elder} value={elder}>
                        {elder}
                      </SelectItem>
                    ))}
                    {formData.ministerRole === 'cooperator' && allCooperators.map((cooperator) => (
                      <SelectItem key={cooperator} value={cooperator}>
                        {cooperator}
                      </SelectItem>
                    ))}
                    {formData.ministerRole === 'deacon' && allDeacons.map((deacon) => (
                      <SelectItem key={deacon} value={deacon}>
                        {deacon}
                      </SelectItem>
                    ))}
                    {formData.ministerRole === 'youth-cooperator' && allYouthCooperators.map((youthCoop) => (
                      <SelectItem key={youthCoop} value={youthCoop}>
                        {youthCoop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="elderFromOther"
                  checked={formData.elderFromOtherLocation}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    elderFromOtherLocation: e.target.checked,
                    elderName: e.target.checked ? '' : formData.elderName,
                    otherElderName: e.target.checked ? formData.otherElderName : ''
                  })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="elderFromOther" className="text-sm font-normal cursor-pointer">
                  {formData.ministerRole === 'elder' && 'Ancião de outra localidade (não cadastrado)'}
                  {formData.ministerRole === 'cooperator' && 'Cooperador de outra localidade (não cadastrado)'}
                  {formData.ministerRole === 'deacon' && 'Diácono de outra localidade (não cadastrado)'}
                  {formData.ministerRole === 'youth-cooperator' && 'Cooperador de Jovens de outra localidade (não cadastrado)'}
                </Label>
              </div>

              {formData.elderFromOtherLocation && (
                <div className="space-y-2">
                  <Label htmlFor="otherElderName">
                    {formData.ministerRole === 'elder' && 'Nome do Ancião'}
                    {formData.ministerRole === 'cooperator' && 'Nome do Cooperador'}
                    {formData.ministerRole === 'deacon' && 'Nome do Diácono'}
                    {formData.ministerRole === 'youth-cooperator' && 'Nome do Cooperador de Jovens'}
                  </Label>
                  <Input
                    id="otherElderName"
                    placeholder={
                      formData.ministerRole === 'elder' ? 'Digite o nome do ancião' :
                      formData.ministerRole === 'cooperator' ? 'Digite o nome do cooperador' :
                      formData.ministerRole === 'deacon' ? 'Digite o nome do diácono' :
                      'Digite o nome do cooperador de jovens'
                    }
                    value={formData.otherElderName}
                    onChange={(e) => setFormData({ ...formData, otherElderName: e.target.value })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/events')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gradient-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Agendar Evento
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
