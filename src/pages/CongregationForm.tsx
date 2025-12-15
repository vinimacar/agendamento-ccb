import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon, 
  Music, 
  Plus, 
  X,
  Building,
  Loader2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { congregationService } from '@/services/congregationService';
import type { EventSchedule } from '@/types';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const DAYS_OF_WEEK = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

const REHEARSAL_TYPES = ['Local', 'Regional', 'GEM', 'Geral'] as const;

interface PersonEntry {
  name: string;
  isLocal: boolean;
}

interface RehearsalEntry {
  type: typeof REHEARSAL_TYPES[number];
  day?: string; // Dia da semana (para ensaios recorrentes)
  date?: Date; // Data específica (para ensaios pontuais)
  time: string;
  repeats: boolean; // Se repete semanalmente
  months?: number[]; // Meses em que o ensaio ocorre (1-12)
}

export default function CongregationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditMode = !!id;

  // Address
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [admin, setAdmin] = useState('');
  const [regional, setRegional] = useState('');

  // Ministry
  const [elders, setElders] = useState<PersonEntry[]>([]);
  const [officeCooperators, setOfficeCooperators] = useState<PersonEntry[]>([]);
  const [youthCooperators, setYouthCooperators] = useState<PersonEntry[]>([]);
  const [deacons, setDeacons] = useState<PersonEntry[]>([]);
  const [regionalSupervisor, setRegionalSupervisor] = useState<PersonEntry>({ name: '', isLocal: true });
  const [localSupervisor, setLocalSupervisor] = useState('');
  const [examiner, setExaminer] = useState<PersonEntry>({ name: '', isLocal: true });

  // Worship Days & RJM
  const [worshipDays, setWorshipDays] = useState<string[]>([]);
  const [rjmDays, setRjmDays] = useState<string[]>([]);
  
  // Schedules (new system)
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<EventSchedule>({
    day: '',
    time: '',
    type: 'culto',
    hasSpecialRule: false,
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // For multi-day selection
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]); // For multi-week selection

  // EBI (Espaço Bíblico Infantil)
  const [hasEBI, setHasEBI] = useState(false);
  const [ebiSchedules, setEbiSchedules] = useState<Array<{ day: string; time: string }>>([]);
  const [newEbiDay, setNewEbiDay] = useState('');
  const [newEbiTime, setNewEbiTime] = useState('');

  // RJM (Reunião da Juventude Mocidade)
  const [hasRJM, setHasRJM] = useState(false);
  const [diaconName, setDiaconName] = useState('');

  // Rehearsals
  const [rehearsals, setRehearsals] = useState<RehearsalEntry[]>([]);

  // Temp states for adding people
  const [newElderName, setNewElderName] = useState('');
  const [newElderIsLocal, setNewElderIsLocal] = useState(true);
  const [newOfficeCoopName, setNewOfficeCoopName] = useState('');
  const [newOfficeCoopIsLocal, setNewOfficeCoopIsLocal] = useState(true);
  const [newYouthCoopName, setNewYouthCoopName] = useState('');
  const [newYouthCoopIsLocal, setNewYouthCoopIsLocal] = useState(true);
  const [newDeaconName, setNewDeaconName] = useState('');
  const [newDeaconIsLocal, setNewDeaconIsLocal] = useState(true);

  // Autocomplete suggestions
  const [elderSuggestions, setElderSuggestions] = useState<string[]>([]);
  const [deaconSuggestions, setDeaconSuggestions] = useState<string[]>([]);

  // Rehearsal form
  const [newRehearsalType, setNewRehearsalType] = useState<typeof REHEARSAL_TYPES[number]>('Local');
  const [newRehearsalDay, setNewRehearsalDay] = useState('');
  const [newRehearsalDate, setNewRehearsalDate] = useState<Date | undefined>(undefined);
  const [newRehearsalTime, setNewRehearsalTime] = useState('');
  const [newRehearsalRepeats, setNewRehearsalRepeats] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const addPerson = (
    list: PersonEntry[],
    setList: React.Dispatch<React.SetStateAction<PersonEntry[]>>,
    name: string,
    isLocal: boolean,
    clearName: () => void
  ) => {
    if (name.trim()) {
      setList([...list, { name: name.trim(), isLocal }]);
      clearName();
    }
  };

  const removePerson = (
    list: PersonEntry[],
    setList: React.Dispatch<React.SetStateAction<PersonEntry[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const addRehearsal = () => {
    // Validar que tem horário e pelo menos dia ou data
    if (!newRehearsalTime) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha o horário do ensaio.",
      });
      return;
    }
    
    if (!newRehearsalDay && !newRehearsalDate) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um dia da semana ou uma data específica.",
      });
      return;
    }

    const newRehearsal: RehearsalEntry = {
      type: newRehearsalType,
      time: newRehearsalTime,
      repeats: newRehearsalRepeats,
    };
    
    // Only add day or date if they have values
    if (newRehearsalDay) {
      newRehearsal.day = newRehearsalDay;
    }
    if (newRehearsalDate) {
      newRehearsal.date = newRehearsalDate;
    }
    if (selectedMonths.length > 0) {
      newRehearsal.months = selectedMonths;
    }
    
    setRehearsals([...rehearsals, newRehearsal]);
    setNewRehearsalDay('');
    setNewRehearsalDate(undefined);
    setNewRehearsalTime('');
    setNewRehearsalRepeats(false);
    setSelectedMonths([]);
  };

  const removeRehearsal = (index: number) => {
    setRehearsals(rehearsals.filter((_, i) => i !== index));
  };

  const addEbiSchedule = () => {
    if (!newEbiDay || !newEbiTime) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha o dia e horário do EBI.",
      });
      return;
    }

    setEbiSchedules([...ebiSchedules, { day: newEbiDay, time: newEbiTime }]);
    setNewEbiDay('');
    setNewEbiTime('');
  };

  const removeEbiSchedule = (index: number) => {
    setEbiSchedules(ebiSchedules.filter((_, i) => i !== index));
  };

  const toggleDay = (dayId: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(dayId)) {
      setList(list.filter((d) => d !== dayId));
    } else {
      setList([...list, dayId]);
    }
  };

  useEffect(() => {
    // Carregar sugestões de anciães e diáconos não-locais
    const loadSuggestions = async () => {
      try {
        const [elders, deacons] = await Promise.all([
          congregationService.getNonLocalElders(),
          congregationService.getNonLocalDeacons(),
        ]);
        setElderSuggestions(elders);
        setDeaconSuggestions(deacons);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    };

    loadSuggestions();
  }, []);

  useEffect(() => {
    const loadCongregation = async () => {
      if (!isEditMode || !id) return;
      
      setLoadingData(true);
      try {
        const data = await congregationService.getById(id);
        if (data) {
          setName(data.name || '');
          setStreet(data.street || '');
          setNumber(data.number || '');
          setNeighborhood(data.neighborhood || '');
          setCity(data.city || '');
          setState(data.state || '');
          setAdmin(data.admin || '');
          setRegional(data.regional || '');
          setElders(data.elders || []);
          setOfficeCooperators(data.officeCooperators || []);
          setYouthCooperators(data.youthCooperators || []);
          setDeacons(data.deacons || []);
          setRegionalSupervisor(data.regionalSupervisor || { name: '', isLocal: true });
          setLocalSupervisor(data.localSupervisor || '');
          setExaminer(data.examiner || { name: '', isLocal: true });
          setWorshipDays(data.worshipDays || []);
          setRjmDays(data.rjmDays || []);
          setSchedules(data.schedules || []);
          setHasEBI(data.hasEBI || false);
          setEbiSchedules(data.ebiSchedules || []);
          setHasRJM(data.hasRJM || false);
          setDiaconName(data.diaconName || '');
          setRehearsals(data.rehearsals || []);
        } else {
          toast({
            title: 'Congregação não encontrada',
            variant: 'destructive',
          });
          navigate('/congregations');
        }
      } catch (error) {
        console.error('Error loading congregation:', error);
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar os dados da congregação.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadCongregation();
  }, [id, isEditMode, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!name || !city || !state) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos o nome, cidade e estado.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const congregationData = {
        name,
        street,
        number,
        neighborhood,
        city,
        state,
        admin,
        regional,
        elders,
        officeCooperators,
        youthCooperators,
        deacons,
        regionalSupervisor,
        localSupervisor,
        examiner,
        worshipDays,
        rjmDays,
        schedules,
        hasEBI,
        ebiSchedules: hasEBI ? ebiSchedules : [],
        hasRJM,
        diaconName,
        rehearsals,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (isEditMode && id) {
        await congregationService.update(id, congregationData);
        toast({
          title: 'Congregação atualizada!',
          description: `${name} foi atualizada com sucesso.`,
        });
      } else {
        await congregationService.create(congregationData);
        toast({
          title: 'Congregação cadastrada!',
          description: `${name} foi cadastrada com sucesso.`,
        });
      }

      navigate('/congregations');
    } catch (error) {
      console.error('Error saving congregation:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Ocorreu um erro ao salvar a congregação. Verifique sua conexão.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/congregations">
            <Button type="button" variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isEditMode ? 'Editar Congregação' : 'Nova Congregação'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? 'Atualize os dados da congregação' : 'Preencha os dados da congregação'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="address" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="address" className="gap-2">
              <MapPin className="h-4 w-4 hidden sm:inline" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="ministry" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              Ministério
            </TabsTrigger>
            <TabsTrigger value="worship" className="gap-2">
              <CalendarIcon className="h-4 w-4 hidden sm:inline" />
              Cultos
            </TabsTrigger>
            <TabsTrigger value="rehearsals" className="gap-2">
              <Music className="h-4 w-4 hidden sm:inline" />
              Ensaios
            </TabsTrigger>
          </TabsList>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Dados da Congregação
                </CardTitle>
                <CardDescription>Informações de identificação e localização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Congregação *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Congregação Central"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        placeholder="Nome da rua"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        placeholder="Nº"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Nome do bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        placeholder="Nome da cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">UF *</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin">Administração</Label>
                      <Input
                        id="admin"
                        placeholder="Ex: Regional São Paulo"
                        value={admin}
                        onChange={(e) => setAdmin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regional">Regional</Label>
                      <Input
                        id="regional"
                        placeholder="Ex: Regional Sul"
                        value={regional}
                        onChange={(e) => setRegional(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ministry Tab */}
          <TabsContent value="ministry">
            <div className="space-y-6">
              {/* Elders */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle>Anciões Locais ou Responsáveis</CardTitle>
                  <CardDescription>Adicione os anciões da congregação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {elders.map((elder, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        <span className={elder.isLocal ? 'uppercase font-bold' : ''}>
                          {elder.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({elder.isLocal ? 'Local' : 'Responsável'})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removePerson(elders, setElders, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do ancião"
                        value={newElderName}
                        onChange={(e) => setNewElderName(e.target.value)}
                        list={!newElderIsLocal ? "elder-suggestions" : undefined}
                      />
                      {!newElderIsLocal && elderSuggestions.length > 0 && (
                        <datalist id="elder-suggestions">
                          {elderSuggestions.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="elderLocal"
                        checked={newElderIsLocal}
                        onCheckedChange={(checked) => setNewElderIsLocal(checked as boolean)}
                      />
                      <Label htmlFor="elderLocal" className="text-sm whitespace-nowrap">
                        Local
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addPerson(elders, setElders, newElderName, newElderIsLocal, () =>
                          setNewElderName('')
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Office Cooperators */}
              <Card>
                <CardHeader>
                  <CardTitle>Cooperadores do Ofício</CardTitle>
                  <CardDescription>Adicione os cooperadores do ofício</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {officeCooperators.map((coop, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {coop.name}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({coop.isLocal ? 'Local' : 'Responsável'})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removePerson(officeCooperators, setOfficeCooperators, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Nome do cooperador"
                      value={newOfficeCoopName}
                      onChange={(e) => setNewOfficeCoopName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="officeCoopLocal"
                        checked={newOfficeCoopIsLocal}
                        onCheckedChange={(checked) => setNewOfficeCoopIsLocal(checked as boolean)}
                      />
                      <Label htmlFor="officeCoopLocal" className="text-sm whitespace-nowrap">
                        Local
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addPerson(officeCooperators, setOfficeCooperators, newOfficeCoopName, newOfficeCoopIsLocal, () =>
                          setNewOfficeCoopName('')
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Youth Cooperators */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle>Cooperadores de Jovens e Menores</CardTitle>
                  <CardDescription>Adicione os cooperadores de jovens e menores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {youthCooperators.map((coop, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {coop.name}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({coop.isLocal ? 'Local' : 'Responsável'})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removePerson(youthCooperators, setYouthCooperators, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Nome do cooperador"
                      value={newYouthCoopName}
                      onChange={(e) => setNewYouthCoopName(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="youthCoopLocal"
                        checked={newYouthCoopIsLocal}
                        onCheckedChange={(checked) => setNewYouthCoopIsLocal(checked as boolean)}
                      />
                      <Label htmlFor="youthCoopLocal" className="text-sm whitespace-nowrap">
                        Local
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addPerson(youthCooperators, setYouthCooperators, newYouthCoopName, newYouthCoopIsLocal, () =>
                          setNewYouthCoopName('')
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Deacons */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle>Diáconos</CardTitle>
                  <CardDescription>Adicione os diáconos da congregação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {deacons.map((deacon, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        <span className={deacon.isLocal ? 'font-bold' : ''}>
                          {deacon.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({deacon.isLocal ? 'Local' : 'Responsável'})
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removePerson(deacons, setDeacons, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do diácono"
                        value={newDeaconName}
                        onChange={(e) => setNewDeaconName(e.target.value)}
                        list={!newDeaconIsLocal ? "deacon-suggestions" : undefined}
                      />
                      {!newDeaconIsLocal && deaconSuggestions.length > 0 && (
                        <datalist id="deacon-suggestions">
                          {deaconSuggestions.map((name, i) => (
                            <option key={i} value={name} />
                          ))}
                        </datalist>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deaconLocal"
                        checked={newDeaconIsLocal}
                        onCheckedChange={(checked) => setNewDeaconIsLocal(checked as boolean)}
                      />
                      <Label htmlFor="deaconLocal" className="text-sm whitespace-nowrap">
                        Local
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addPerson(deacons, setDeacons, newDeaconName, newDeaconIsLocal, () =>
                          setNewDeaconName('')
                        )
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Supervisors & Examiner */}
              <Card>
                <CardHeader>
                  <CardTitle>Encarregados e Examinadora</CardTitle>
                  <CardDescription>Responsáveis pela congregação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Encarregado Regional</Label>
                      <Input
                        placeholder="Nome do encarregado regional"
                        value={regionalSupervisor.name}
                        onChange={(e) =>
                          setRegionalSupervisor({ ...regionalSupervisor, name: e.target.value })
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="regionalSupervisorLocal"
                          checked={regionalSupervisor.isLocal}
                          onCheckedChange={(checked) =>
                            setRegionalSupervisor({ ...regionalSupervisor, isLocal: checked as boolean })
                          }
                        />
                        <Label htmlFor="regionalSupervisorLocal" className="text-sm">
                          Local ou Responsável
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Encarregado Local</Label>
                      <Input
                        placeholder="Nome do encarregado local"
                        value={localSupervisor}
                        onChange={(e) => setLocalSupervisor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Examinadora</Label>
                    <Input
                      placeholder="Nome da examinadora"
                      value={examiner.name}
                      onChange={(e) => setExaminer({ ...examiner, name: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="examinerLocal"
                        checked={examiner.isLocal}
                        onCheckedChange={(checked) =>
                          setExaminer({ ...examiner, isLocal: checked as boolean })
                        }
                      />
                      <Label htmlFor="examinerLocal" className="text-sm">
                        Local ou Responsável
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Worship Tab */}
          <TabsContent value="worship">
            <div className="space-y-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Horários de Cultos e RJM
                  </CardTitle>
                  <CardDescription>Cadastre os horários fixos de cultos oficiais e reuniões de jovens com regras especiais de repetição</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Lista de horários cadastrados - Separados por tipo */}
                  {schedules.length > 0 && (
                    <div className="space-y-6">
                      {/* Cultos Oficiais */}
                      {schedules.filter(s => s.type === 'culto').length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Badge variant="default" className="text-sm">Cultos Oficiais</Badge>
                            <span className="text-xs text-muted-foreground">
                              ({schedules.filter(s => s.type === 'culto').length})
                            </span>
                          </div>
                          {schedules
                            .map((schedule, index) => ({ schedule, originalIndex: index }))
                            .filter(({ schedule }) => schedule.type === 'culto')
                            .map(({ schedule, originalIndex }) => (
                              <div
                                key={originalIndex}
                                className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {DAYS_OF_WEEK.find(d => d.id === schedule.day)?.label}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {schedule.time}
                                      {schedule.hasSpecialRule && schedule.weekOfMonth && schedule.weekOfMonth.length > 0 && (
                                        <span className="ml-2 text-primary font-medium">
                                          • {schedule.weekOfMonth.map(w => ['1ª', '2ª', '3ª', '4ª'][parseInt(w) - 1]).join(' e ')} semana{schedule.weekOfMonth.length > 1 ? 's' : ''} do mês
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSchedules(schedules.filter((_, i) => i !== originalIndex))}
                                  className="h-8 w-8 hover:bg-destructive/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* RJM */}
                      {schedules.filter(s => s.type === 'rjm').length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-border">
                            <Badge variant="secondary" className="text-sm">Reunião de Jovens e Menores (RJM)</Badge>
                            <span className="text-xs text-muted-foreground">
                              ({schedules.filter(s => s.type === 'rjm').length})
                            </span>
                          </div>
                          {schedules
                            .map((schedule, index) => ({ schedule, originalIndex: index }))
                            .filter(({ schedule }) => schedule.type === 'rjm')
                            .map(({ schedule, originalIndex }) => (
                              <div
                                key={originalIndex}
                                className="flex items-center justify-between p-4 rounded-lg bg-secondary/5 border border-secondary/20"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-secondary-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {DAYS_OF_WEEK.find(d => d.id === schedule.day)?.label}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {schedule.time}
                                      {schedule.hasSpecialRule && schedule.weekOfMonth && schedule.weekOfMonth.length > 0 && (
                                        <span className="ml-2 text-secondary-foreground font-medium">
                                          • {schedule.weekOfMonth.map(w => ['1ª', '2ª', '3ª', '4ª'][parseInt(w) - 1]).join(' e ')} semana{schedule.weekOfMonth.length > 1 ? 's' : ''} do mês
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSchedules(schedules.filter((_, i) => i !== originalIndex))}
                                  className="h-8 w-8 hover:bg-destructive/20"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulário para adicionar novo horário */}
                  <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Adicionar Novo Horário</Label>
                    </div>
                    
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
                            <SelectItem value="culto">Culto Oficial</SelectItem>
                            <SelectItem value="rjm">RJM (Reunião de Jovens)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Horário *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={newSchedule.time}
                            onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Multi-day selector */}
                    <div className="space-y-2">
                      <Label>Dias da Semana * (selecione um ou mais)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-background border border-border">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.id}`}
                              checked={selectedDays.includes(day.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day.id]);
                                } else {
                                  setSelectedDays(selectedDays.filter((d) => d !== day.id));
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`day-${day.id}`} 
                              className="text-sm font-normal cursor-pointer"
                            >
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checkbox para regra especial */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                      <Checkbox
                        id="hasSpecialRule-schedule"
                        checked={newSchedule.hasSpecialRule}
                        onCheckedChange={(checked) => 
                          setNewSchedule({ 
                            ...newSchedule, 
                            hasSpecialRule: checked as boolean,
                            weekOfMonth: checked ? newSchedule.weekOfMonth : undefined,
                          })
                        }
                      />
                      <div className="space-y-1 flex-1">
                        <Label 
                          htmlFor="hasSpecialRule-schedule" 
                          className="text-sm font-medium cursor-pointer leading-none flex items-center gap-2"
                        >
                          <CalendarIcon className="h-4 w-4" />
                          Tem regra especial de repetição mensal
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Marque se o culto/RJM ocorre apenas em semanas específicas do mês (ex: 1º e 3º domingos)
                        </p>
                      </div>
                    </div>

                    {/* Campo condicional para semana do mês - Multi-select */}
                    {newSchedule.hasSpecialRule && (
                      <div className="space-y-3 pl-6 p-4 rounded-lg bg-background border-l-4 border-primary">
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Semanas do Mês * (selecione uma ou mais)
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: '1', label: '1ª semana do mês' },
                            { value: '2', label: '2ª semana do mês' },
                            { value: '3', label: '3ª semana do mês' },
                            { value: '4', label: '4ª semana do mês' },
                          ].map((week) => (
                            <div key={week.value} className="flex items-center space-x-2 p-2 rounded border border-border hover:bg-muted/50">
                              <Checkbox
                                id={`week-${week.value}`}
                                checked={selectedWeeks.includes(week.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedWeeks([...selectedWeeks, week.value]);
                                  } else {
                                    setSelectedWeeks(selectedWeeks.filter((w) => w !== week.value));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`week-${week.value}`} 
                                className="text-sm font-normal cursor-pointer"
                              >
                                {week.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (selectedDays.length === 0 || !newSchedule.time) {
                          toast({
                            title: 'Campos obrigatórios',
                            description: 'Selecione pelo menos um dia e preencha o horário.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        if (newSchedule.hasSpecialRule && selectedWeeks.length === 0) {
                          toast({
                            title: 'Regra especial incompleta',
                            description: 'Selecione pelo menos uma semana do mês.',
                            variant: 'destructive',
                          });
                          return;
                        }
                        
                        // Create a schedule entry for each selected day
                        const newSchedules = selectedDays.map((day) => {
                          const schedule: EventSchedule = {
                            day,
                            time: newSchedule.time,
                            type: newSchedule.type,
                            hasSpecialRule: newSchedule.hasSpecialRule,
                          };
                          
                          // Only add weekOfMonth if it has a value
                          if (newSchedule.hasSpecialRule && selectedWeeks.length > 0) {
                            schedule.weekOfMonth = selectedWeeks;
                          }
                          
                          return schedule;
                        });
                        
                        setSchedules([...schedules, ...newSchedules]);
                        setSelectedDays([]);
                        setSelectedWeeks([]);
                        setNewSchedule({
                          day: '',
                          time: '',
                          type: 'culto',
                          hasSpecialRule: false,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Horário
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* EBI Card */}
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    EBI - Espaço Bíblico Infantil
                  </CardTitle>
                  <CardDescription>Configure se a congregação possui EBI e seus horários</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Checkbox para EBI */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has-ebi"
                      checked={hasEBI}
                      onCheckedChange={(checked) => {
                        setHasEBI(checked as boolean);
                        if (!checked) {
                          setEbiSchedules([]);
                        }
                      }}
                    />
                    <Label htmlFor="has-ebi" className="text-sm font-medium cursor-pointer">
                      Esta congregação possui EBI (Espaço Bíblico Infantil)
                    </Label>
                  </div>

                  {/* Lista de horários do EBI */}
                  {hasEBI && ebiSchedules.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Badge variant="default" className="text-sm">Horários do EBI</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({ebiSchedules.length})
                        </span>
                      </div>
                      {ebiSchedules.map((ebi, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {DAYS_OF_WEEK.find(d => d.id === ebi.day)?.label}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {ebi.time}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEbiSchedule(index)}
                            className="h-8 w-8 hover:bg-destructive/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulário para adicionar horário do EBI */}
                  {hasEBI && (
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                      <h4 className="font-medium text-sm">Adicionar Horário do EBI</h4>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dia da Semana *</Label>
                          <Select value={newEbiDay} onValueChange={setNewEbiDay}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o dia" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.id} value={day.id}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ebi-time">Horário *</Label>
                          <Input
                            id="ebi-time"
                            type="time"
                            value={newEbiTime}
                            onChange={(e) => setNewEbiTime(e.target.value)}
                            placeholder="00:00"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addEbiSchedule}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Horário do EBI
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Rehearsals Tab */}
          <TabsContent value="rehearsals">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
              <CardHeader>
                <CardTitle>Ensaios</CardTitle>
                <CardDescription>Cadastre os ensaios da congregação (Local, Regional, GEM ou Geral)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rehearsals List - Organized by Type */}
                {rehearsals.length > 0 && (
                  <div className="space-y-6">
                    {REHEARSAL_TYPES.map((type) => {
                      const typeRehearsals = rehearsals.filter((r) => r.type === type);
                      if (typeRehearsals.length === 0) return null;
                      
                      return (
                        <div key={type} className="space-y-3">
                          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            Ensaios {type}
                          </h3>
                          <div className="space-y-2 pl-6">
                            {typeRehearsals.map((rehearsal, index) => {
                              const globalIndex = rehearsals.indexOf(rehearsal);
                              return (
                                <div
                                  key={globalIndex}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge variant={rehearsal.type === 'Local' ? 'default' : 'secondary'}>
                                      {rehearsal.type}
                                    </Badge>
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {rehearsal.date 
                                          ? format(rehearsal.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                          : rehearsal.day ? DAYS_OF_WEEK.find((d) => d.id === rehearsal.day)?.label : 'Sem data'
                                        }
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {rehearsal.time}
                                        {rehearsal.repeats && ' • Repete semanalmente'}
                                        {rehearsal.date && !rehearsal.repeats && ' • Data específica'}
                                        {rehearsal.months && rehearsal.months.length > 0 && (
                                          <span> • {rehearsal.months.length} mês(es)</span>
                                        )}
                                      </p>
                                      {rehearsal.months && rehearsal.months.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {rehearsal.months.map(m => (
                                            <Badge key={m} variant="outline" className="text-xs">
                                              {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m - 1]}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => removeRehearsal(globalIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Rehearsal Form */}
                <div className="p-4 rounded-lg border border-dashed border-border space-y-4">
                  <p className="text-sm font-medium text-foreground">Adicionar Ensaio</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select value={newRehearsalType} onValueChange={(v) => setNewRehearsalType(v as typeof REHEARSAL_TYPES[number])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {REHEARSAL_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Horário *</Label>
                      <Input
                        type="time"
                        value={newRehearsalTime}
                        onChange={(e) => setNewRehearsalTime(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Scheduling Options */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="repeats-rehearsal"
                        checked={newRehearsalRepeats}
                        onCheckedChange={(checked) => {
                          setNewRehearsalRepeats(checked as boolean);
                          if (checked) {
                            setNewRehearsalDate(undefined); // Clear specific date if repeating
                          } else {
                            setNewRehearsalDay(''); // Clear weekday if not repeating
                          }
                        }}
                      />
                      <Label htmlFor="repeats-rehearsal" className="text-sm font-normal cursor-pointer">
                        Ensaio recorrente (repete toda semana)
                      </Label>
                    </div>

                    {newRehearsalRepeats ? (
                      // Weekday selector for recurring rehearsals
                      <>
                        <div className="space-y-2">
                          <Label>Dia da Semana *</Label>
                          <Select value={newRehearsalDay} onValueChange={setNewRehearsalDay}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o dia da semana" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.id} value={day.id}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Month selector */}
                        <div className="space-y-2">
                          <Label>Meses que ocorre o ensaio</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { num: 1, name: 'Jan' },
                              { num: 2, name: 'Fev' },
                              { num: 3, name: 'Mar' },
                              { num: 4, name: 'Abr' },
                              { num: 5, name: 'Mai' },
                              { num: 6, name: 'Jun' },
                              { num: 7, name: 'Jul' },
                              { num: 8, name: 'Ago' },
                              { num: 9, name: 'Set' },
                              { num: 10, name: 'Out' },
                              { num: 11, name: 'Nov' },
                              { num: 12, name: 'Dez' },
                            ].map((month) => (
                              <Button
                                key={month.num}
                                type="button"
                                variant={selectedMonths.includes(month.num) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setSelectedMonths(
                                    selectedMonths.includes(month.num)
                                      ? selectedMonths.filter((m) => m !== month.num)
                                      : [...selectedMonths, month.num].sort((a, b) => a - b)
                                  );
                                }}
                                className="h-8"
                              >
                                {month.name}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedMonths.length === 0 
                              ? 'Nenhum mês selecionado (ensaio ocorre todos os meses)'
                              : `Selecionados: ${selectedMonths.length} mês(es)`
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      // Calendar for specific date
                      <div className="space-y-2">
                        <Label>Data Específica *</Label>
                        <Popover modal={true}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !newRehearsalDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newRehearsalDate ? (
                                format(newRehearsalDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data do ensaio</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newRehearsalDate}
                              onSelect={(date) => setNewRehearsalDate(date)}
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  <Button type="button" variant="outline" onClick={addRehearsal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ensaio
                  </Button>
                </div>

                {/* Tabela anual de ensaios */}
                {rehearsals.some(r => r.repeats) && (
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Visualização Anual de Ensaios</h3>
                      <Select value={viewYear.toString()} onValueChange={(v) => setViewYear(parseInt(v))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="text-left p-3 font-medium">Tipo</th>
                              <th className="text-left p-3 font-medium">Dia</th>
                              <th className="text-left p-3 font-medium">Horário</th>
                              <th className="text-left p-3 font-medium">Meses</th>
                              <th className="text-center p-3 font-medium">Total/Ano</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {rehearsals.filter(r => r.repeats).map((rehearsal, idx) => {
                              // Calcular quantos ensaios por ano
                              const monthsToShow = rehearsal.months && rehearsal.months.length > 0 
                                ? rehearsal.months 
                                : Array.from({ length: 12 }, (_, i) => i + 1);
                              
                              // Aproximadamente 4 ensaios por mês
                              const totalPerYear = monthsToShow.length * 4;
                              
                              return (
                                <tr key={idx} className="hover:bg-muted/30">
                                  <td className="p-3">
                                    <Badge variant={rehearsal.type === 'Local' ? 'default' : 'secondary'}>
                                      {rehearsal.type}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    {rehearsal.day ? DAYS_OF_WEEK.find(d => d.id === rehearsal.day)?.label : '-'}
                                  </td>
                                  <td className="p-3">{rehearsal.time}</td>
                                  <td className="p-3">
                                    {rehearsal.months && rehearsal.months.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {rehearsal.months.map(m => (
                                          <Badge key={m} variant="outline" className="text-xs">
                                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m - 1]}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Todos os meses</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center font-medium">
                                    ~{totalPerYear} ensaios
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      * Estimativa baseada em 4 ensaios por mês. O total real pode variar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <Link to="/congregations">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="gradient-primary text-primary-foreground hover:opacity-90 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Congregação'
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
