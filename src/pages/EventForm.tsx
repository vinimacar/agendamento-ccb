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
import { ArrowLeft, CalendarIcon, Clock, Loader2, Save, FileText, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [congregations, setCongregations] = useState<CongregationData[]>([]);
  const [loadingCongregations, setLoadingCongregations] = useState(true);
  const [allElders, setAllElders] = useState<string[]>([]);
  const [loadingElders, setLoadingElders] = useState(true);
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
    description: '',
    irmaos: '',
    irmas: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [congregationsData, eldersData] = await Promise.all([
          congregationService.getAll(),
          congregationService.getNonLocalElders(),
        ]);
        
        setCongregations(congregationsData);
        
        // Buscar todos os anciães (locais e não-locais)
        const eldersSet = new Set<string>();
        congregationsData.forEach(congregation => {
          congregation.elders?.forEach(elder => {
            if (elder.name.trim()) {
              eldersSet.add(elder.name.trim());
            }
          });
        });
        
        setAllElders(Array.from(eldersSet).sort());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingCongregations(false);
        setLoadingElders(false);
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
            description: data.description || '',
            irmaos: data.irmaos?.toString() || '',
            irmas: data.irmas?.toString() || '',
          });
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
        irmaos: undefined as number | undefined,
        irmas: undefined as number | undefined,
      };

      // Adicionar ancião oficiante
      if (formData.elderFromOtherLocation && formData.otherElderName) {
        eventData.elderName = formData.otherElderName;
        eventData.elderFromOtherLocation = true;
      } else if (formData.elderName) {
        eventData.elderName = formData.elderName;
        eventData.elderFromOtherLocation = false;
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

          {/* Ancião Oficiante */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Ancião Oficiante (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o Ancião</Label>
                <Select
                  value={formData.elderName}
                  onValueChange={(value) => setFormData({ ...formData, elderName: value })}
                  disabled={loadingElders}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingElders ? 'Carregando anciães...' : 'Selecione um ancião'} />
                  </SelectTrigger>
                  <SelectContent>
                    {allElders.map((elder) => (
                      <SelectItem key={elder} value={elder}>
                        {elder}
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
                  Ancião de outra localidade (não cadastrado)
                </Label>
              </div>

              {formData.elderFromOtherLocation && (
                <div className="space-y-2">
                  <Label htmlFor="otherElderName">Nome do Ancião</Label>
                  <Input
                    id="otherElderName"
                    placeholder="Digite o nome do ancião"
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
