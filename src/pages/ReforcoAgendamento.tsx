import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { reforcoService } from '@/services/reforcoService';
import { congregationService } from '@/services/congregationService';
import type { ReforcoSchedule } from '@/types';
import { Calendar, Users, Plus, Trash2, Loader2, Building2, MapPin, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAYS_OF_WEEK = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

export default function ReforcoAgendamento() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();
  
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [type, setType] = useState<'culto-oficial' | 'rjm'>('culto-oficial');
  const [responsibleName, setResponsibleName] = useState('');
  const [isFromOutside, setIsFromOutside] = useState(false);
  const [outsideLocation, setOutsideLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [schedules, setSchedules] = useState<ReforcoSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [availablePeople, setAvailablePeople] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<Array<{ day: string; time: string }>>([]);

  // Carregar agendamentos do mês atual
  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const data = await reforcoService.getByMonth(year, month);
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSchedules(false);
    }
  }, [currentMonth, toast]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const loadAvailablePeople = useCallback(async () => {
    try {
      const congregation = congregations.find(c => c.id === selectedCongregationId);
      if (!congregation) return;

      const people: string[] = [];
      
      // Adicionar anciães
      congregation.elders?.forEach(elder => {
        if (elder.name) people.push(elder.name);
      });
      
      // Adicionar cooperadores
      congregation.officeCooperators?.forEach(coop => {
        if (coop.name) people.push(coop.name);
      });
      
      // Adicionar cooperadores de jovens
      congregation.youthCooperators?.forEach(coop => {
        if (coop.name) people.push(coop.name);
      });
      
      // Adicionar diáconos
      congregation.deacons?.forEach(deacon => {
        if (deacon.name) people.push(deacon.name);
      });

      setAvailablePeople([...new Set(people)].sort());
    } catch (error) {
      console.error('Error loading people:', error);
    }
  }, [congregations, selectedCongregationId]);

  const loadAvailableDays = useCallback(async () => {
    try {
      const congregation = congregations.find(c => c.id === selectedCongregationId);
      if (!congregation) return;

      const days: Array<{ day: string; time: string }> = [];
      
      if (type === 'culto-oficial') {
        // Buscar cultos oficiais
        congregation.schedules?.filter(s => s.type === 'culto').forEach(schedule => {
          days.push({ day: schedule.day, time: schedule.time });
        });
      } else {
        // Buscar RJMs
        congregation.schedules?.filter(s => s.type === 'rjm').forEach(schedule => {
          days.push({ day: schedule.day, time: schedule.time });
        });
      }

      setAvailableDays(days);
    } catch (error) {
      console.error('Error loading days:', error);
    }
  }, [congregations, selectedCongregationId, type]);

  // Carregar pessoas disponíveis quando selecionar congregação
  useEffect(() => {
    if (selectedCongregationId) {
      loadAvailablePeople();
      loadAvailableDays();
    } else {
      setAvailablePeople([]);
      setAvailableDays([]);
    }
  }, [selectedCongregationId, loadAvailablePeople, loadAvailableDays]);

  const checkIfCanSchedule = async (): Promise<{ canSchedule: boolean; message?: string }> => {
    if (!selectedCongregationId || !selectedDate) {
      return { canSchedule: false, message: 'Selecione uma congregação e uma data' };
    }

    const congregation = congregations.find(c => c.id === selectedCongregationId);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // Buscar agendamentos da congregação no mês
    const existingSchedules = await reforcoService.getByCongregationAndMonth(selectedCongregationId, year, month);
    
    // Verificar se já tem agendamento do mesmo tipo no mês
    const hasSameType = existingSchedules.some(s => s.type === type);
    
    // Exceção para Congregação Central de Ituiutaba (quinta-feira)
    const isCentralItuiutaba = congregation?.name.toLowerCase().includes('central') && 
                               congregation?.city.toLowerCase().includes('ituiutaba');
    
    if (hasSameType && !isCentralItuiutaba) {
      return { 
        canSchedule: false, 
        message: `Já existe um agendamento de ${type === 'culto-oficial' ? 'Culto Oficial' : 'RJM'} para esta congregação neste mês.` 
      };
    }

    return { canSchedule: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCongregationId || !selectedDate || !responsibleName || !selectedTime) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (isFromOutside && !outsideLocation) {
      toast({
        title: 'Localidade obrigatória',
        description: 'Informe a localidade do responsável.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se pode agendar
    const { canSchedule, message } = await checkIfCanSchedule();
    if (!canSchedule) {
      toast({
        title: 'Não é possível agendar',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const congregation = congregations.find(c => c.id === selectedCongregationId);
      
      const scheduleData: Omit<ReforcoSchedule, 'id'> = {
        congregationId: selectedCongregationId,
        congregationName: congregation?.name || '',
        type,
        date: selectedDate,
        time: selectedTime,
        responsibleName,
        isFromOutside,
        outsideLocation: isFromOutside ? outsideLocation : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await reforcoService.create(scheduleData);
      
      toast({
        title: 'Agendamento realizado!',
        description: 'O reforço foi agendado com sucesso.',
      });

      // Limpar formulário
      setSelectedCongregationId('');
      setType('culto-oficial');
      setResponsibleName('');
      setIsFromOutside(false);
      setOutsideLocation('');
      setSelectedDate(null);
      setSelectedTime('');
      
      // Recarregar agendamentos
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Erro ao agendar',
        description: 'Não foi possível salvar o agendamento.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reforcoService.delete(id);
      toast({
        title: 'Agendamento excluído',
        description: 'O agendamento foi removido com sucesso.',
      });
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o agendamento.',
        variant: 'destructive',
      });
    }
  };

  // Congregações sem agendamento no mês
  const congregationsWithoutSchedule = congregations.filter(cong => 
    !schedules.some(s => s.congregationId === cong.id)
  );

  const selectedCongregation = congregations.find(c => c.id === selectedCongregationId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Agendamento de Reforços de Coletas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os agendamentos de cultos oficiais e RJM para reforço de coletas
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Novo Agendamento
                </CardTitle>
                <CardDescription>
                  Marque até 1 culto oficial e 1 RJM por congregação por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Congregação */}
                  <div className="space-y-2">
                    <Label>Congregação *</Label>
                    <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a congregação" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-[300px]">
                        {congregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name} - {cong.city}/{cong.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label>Tipo de Reforço *</Label>
                    <Select value={type} onValueChange={(value) => setType(value as 'culto-oficial' | 'rjm')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="culto-oficial">Culto Oficial</SelectItem>
                        <SelectItem value="rjm">RJM (Reunião de Jovens e Menores)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dias disponíveis */}
                  {availableDays.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">Dias de {type === 'culto-oficial' ? 'Culto' : 'RJM'} disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableDays.map((day, index) => (
                          <Badge key={index} variant="secondary">
                            {DAYS_OF_WEEK.find(d => d.id === day.day)?.label} - {day.time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Data e Horário */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
                          setSelectedDate(date);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Horário *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Responsável */}
                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsável *</Label>
                    {!isFromOutside && availablePeople.length > 0 ? (
                      <Select value={responsibleName} onValueChange={setResponsibleName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-[300px]">
                          {availablePeople.map((person, index) => (
                            <SelectItem key={index} value={person}>
                              {person}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="responsible"
                        value={responsibleName}
                        onChange={(e) => setResponsibleName(e.target.value)}
                        placeholder="Digite o nome do responsável"
                      />
                    )}
                  </div>

                  {/* Checkbox de fora */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="from-outside"
                      checked={isFromOutside}
                      onCheckedChange={(checked) => {
                        setIsFromOutside(checked as boolean);
                        if (!checked) {
                          setOutsideLocation('');
                        } else {
                          setResponsibleName('');
                        }
                      }}
                    />
                    <Label htmlFor="from-outside" className="text-sm font-normal cursor-pointer">
                      Responsável é de outra localidade
                    </Label>
                  </div>

                  {/* Localidade (se for de fora) */}
                  {isFromOutside && (
                    <div className="space-y-2">
                      <Label htmlFor="location">Localidade *</Label>
                      <Input
                        id="location"
                        value={outsideLocation}
                        onChange={(e) => setOutsideLocation(e.target.value)}
                        placeholder="Ex: Uberlândia/MG"
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Agendar Reforço
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Congregações sem agendamento */}
            {congregationsWithoutSchedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Congregações sem Agendamento
                  </CardTitle>
                  <CardDescription>
                    {congregationsWithoutSchedule.length} congregação(ões) ainda não têm reforço agendado este mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {congregationsWithoutSchedule.slice(0, 10).map((cong) => (
                      <div key={cong.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{cong.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cong.city}/{cong.state}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCongregationId(cong.id!)}
                        >
                          Agendar
                        </Button>
                      </div>
                    ))}
                    {congregationsWithoutSchedule.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{congregationsWithoutSchedule.length - 10} congregações
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Tabela lateral - Agendamentos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos do Mês
                </CardTitle>
                <CardDescription>
                  {format(currentMonth, 'MMMM/yyyy', { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSchedules ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum agendamento neste mês</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">{schedule.congregationName}</p>
                            <Badge variant={schedule.type === 'culto-oficial' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {schedule.type === 'culto-oficial' ? 'Culto Oficial' : 'RJM'}
                            </Badge>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => schedule.id && handleDelete(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(schedule.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {schedule.responsibleName}
                            {schedule.isFromOutside && schedule.outsideLocation && (
                              <span className="text-primary">({schedule.outsideLocation})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
