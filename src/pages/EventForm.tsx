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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { eventService } from '@/services/eventService';
import { congregationService, CongregationData } from '@/services/congregationService';
import { eventTypeService, CustomEventType } from '@/services/eventTypeService';
import { EventType, eventTypeLabels } from '@/types';
import { ArrowLeft, CalendarIcon, Clock, Loader2, Save, FileText, MapPin, Users, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSecondDeleteDialog, setShowSecondDeleteDialog] = useState(false);
  const [congregations, setCongregations] = useState<CongregationData[]>([]);
  const [loadingCongregations, setLoadingCongregations] = useState(true);
  const [allElders, setAllElders] = useState<string[]>([]);
  const [allCooperators, setAllCooperators] = useState<string[]>([]);
  const [allDeacons, setAllDeacons] = useState<string[]>([]);
  const [allYouthCooperators, setAllYouthCooperators] = useState<string[]>([]);
  const [loadingMinisters, setLoadingMinisters] = useState(true);
  const [customEventTypes, setCustomEventTypes] = useState<CustomEventType[]>([]);
  const [showAddEventTypeDialog, setShowAddEventTypeDialog] = useState(false);
  const [newEventTypeName, setNewEventTypeName] = useState('');
  const [newEventTypeLabel, setNewEventTypeLabel] = useState('');
  const [loadingNewEventType, setLoadingNewEventType] = useState(false);
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: '' as EventType | string,
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [congregationsData, ministersData, customTypes] = await Promise.all([
          congregationService.getAll(),
          congregationService.getAllMinisters(),
          eventTypeService.getAll(),
        ]);
        
        setCongregations(congregationsData);
        setAllElders(ministersData.elders);
        setAllCooperators(ministersData.cooperators);
        setAllDeacons(ministersData.deacons);
        setAllYouthCooperators(ministersData.youthCooperators);
        setCustomEventTypes(customTypes);
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

  const handleDelete = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      await eventService.delete(id);
      toast({
        title: 'Evento excluído!',
        description: 'O evento foi excluído com sucesso.',
      });
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o evento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEventType = async () => {
    if (!newEventTypeLabel.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o nome do tipo de evento.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingNewEventType(true);
    try {
      // Gerar um nome automaticamente baseado no label
      const name = newEventTypeLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .trim();

      await eventTypeService.create({
        name: `custom-${name}`,
        label: newEventTypeLabel.trim(),
      });

      // Recarregar tipos personalizados
      const customTypes = await eventTypeService.getAll();
      setCustomEventTypes(customTypes);

      toast({
        title: 'Tipo adicionado!',
        description: 'O novo tipo de evento foi criado com sucesso.',
      });

      setShowAddEventTypeDialog(false);
      setNewEventTypeLabel('');
      setNewEventTypeName('');
    } catch (error) {
      console.error('Error adding event type:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível criar o tipo de evento.',
        variant: 'destructive',
      });
    } finally {
      setLoadingNewEventType(false);
    }
  };

  const handleDeleteCustomEventType = async (typeId: string) => {
    try {
      await eventTypeService.delete(typeId);
      
      // Recarregar tipos personalizados
      const customTypes = await eventTypeService.getAll();
      setCustomEventTypes(customTypes);

      toast({
        title: 'Tipo removido!',
        description: 'O tipo de evento foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting event type:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o tipo de evento.',
        variant: 'destructive',
      });
    }
  };

  // Combinar tipos padrão e personalizados
  const allEventTypes = {
    ...eventTypeLabels,
    ...Object.fromEntries(
      customEventTypes.map(ct => [ct.name, ct.label])
    ),
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
                <div className="flex items-center justify-between">
                  <Label>Tipo de Evento *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddEventTypeDialog(true)}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Tipo
                  </Button>
                </div>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as EventType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="font-semibold text-xs text-muted-foreground px-2 py-1.5">
                      Tipos Padrão
                    </div>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                    {customEventTypes.length > 0 && (
                      <>
                        <div className="font-semibold text-xs text-muted-foreground px-2 py-1.5 border-t mt-1 pt-2">
                          Tipos Personalizados
                        </div>
                        {customEventTypes.map((customType) => (
                          <SelectItem key={customType.name} value={customType.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{customType.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Lista de tipos personalizados para gerenciar */}
                {customEventTypes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipos Personalizados Criados:</Label>
                    <div className="space-y-1">
                      {customEventTypes.map((customType) => (
                        <div
                          key={customType.id}
                          className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md text-sm"
                        >
                          <span>{customType.label}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomEventType(customType.id)}
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    {formData.type === 'santa-ceia' ? 'Participantes da Santa Ceia' : 'Batizados'}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="irmaos">
                        Irmãos
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
                        Irmãs
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
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
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
            
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            
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
                  {isEditMode ? 'Salvar Alterações' : 'Agendar Evento'}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* First Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a excluir o evento <strong>"{formData.title}"</strong>.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowDeleteDialog(false);
                  setShowSecondDeleteDialog(true);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Continuar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Second Delete Confirmation Dialog */}
        <AlertDialog open={showSecondDeleteDialog} onOpenChange={setShowSecondDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">⚠️ Confirmação Final</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-semibold">Esta é sua última chance de cancelar!</p>
                <p>
                  O evento <strong>"{formData.title}"</strong> será excluído permanentemente.
                  Todos os dados associados serão perdidos.
                </p>
                <p className="text-destructive font-medium">
                  Esta ação é IRREVERSÍVEL.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowSecondDeleteDialog(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowSecondDeleteDialog(false);
                  handleDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, Excluir Definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Event Type Dialog */}
        <Dialog open={showAddEventTypeDialog} onOpenChange={setShowAddEventTypeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Tipo de Evento</DialogTitle>
              <DialogDescription>
                Crie um novo tipo de evento personalizado que estará disponível para todos os futuros agendamentos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="eventTypeLabel">Nome do Tipo de Evento *</Label>
                <Input
                  id="eventTypeLabel"
                  placeholder="Ex: Vigília de Oração"
                  value={newEventTypeLabel}
                  onChange={(e) => setNewEventTypeLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEventType();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Este nome aparecerá na lista de tipos de eventos.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddEventTypeDialog(false);
                  setNewEventTypeLabel('');
                  setNewEventTypeName('');
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddEventType}
                disabled={loadingNewEventType || !newEventTypeLabel.trim()}
              >
                {loadingNewEventType ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
