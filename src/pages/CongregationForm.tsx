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
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Calendar, 
  Music, 
  Plus, 
  X,
  Building,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { congregationService } from '@/services/congregationService';

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
  day: string;
  time: string;
  repeats: boolean;
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

  // Rehearsal form
  const [newRehearsalType, setNewRehearsalType] = useState<typeof REHEARSAL_TYPES[number]>('Local');
  const [newRehearsalDay, setNewRehearsalDay] = useState('');
  const [newRehearsalTime, setNewRehearsalTime] = useState('');
  const [newRehearsalRepeats, setNewRehearsalRepeats] = useState(false);

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
    if (newRehearsalDay && newRehearsalTime) {
      setRehearsals([
        ...rehearsals,
        {
          type: newRehearsalType,
          day: newRehearsalDay,
          time: newRehearsalTime,
          repeats: newRehearsalRepeats,
        },
      ]);
      setNewRehearsalDay('');
      setNewRehearsalTime('');
      setNewRehearsalRepeats(false);
    }
  };

  const removeRehearsal = (index: number) => {
    setRehearsals(rehearsals.filter((_, i) => i !== index));
  };

  const toggleDay = (dayId: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(dayId)) {
      setList(list.filter((d) => d !== dayId));
    } else {
      setList([...list, dayId]);
    }
  };

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
              <Calendar className="h-4 w-4 hidden sm:inline" />
              Cultos
            </TabsTrigger>
            <TabsTrigger value="rehearsals" className="gap-2">
              <Music className="h-4 w-4 hidden sm:inline" />
              Ensaios
            </TabsTrigger>
          </TabsList>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Anciões Locais ou Responsáveis</CardTitle>
                  <CardDescription>Adicione os anciões da congregação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {elders.map((elder, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {elder.name}
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
                    <Input
                      placeholder="Nome do ancião"
                      value={newElderName}
                      onChange={(e) => setNewElderName(e.target.value)}
                      className="flex-1"
                    />
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
              <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Diáconos</CardTitle>
                  <CardDescription>Adicione os diáconos da congregação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {deacons.map((deacon, index) => (
                      <Badge key={index} variant="secondary" className="gap-1 pr-1">
                        {deacon.name}
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
                    <Input
                      placeholder="Nome do diácono"
                      value={newDeaconName}
                      onChange={(e) => setNewDeaconName(e.target.value)}
                      className="flex-1"
                    />
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
              <Card>
                <CardHeader>
                  <CardTitle>Dias de Culto</CardTitle>
                  <CardDescription>Selecione os dias de culto da congregação</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          worshipDays.includes(day.id)
                            ? 'bg-primary/10 border-primary'
                            : 'bg-muted/50 border-border hover:bg-muted'
                        }`}
                        onClick={() => toggleDay(day.id, worshipDays, setWorshipDays)}
                      >
                        <Checkbox
                          checked={worshipDays.includes(day.id)}
                          onCheckedChange={() => toggleDay(day.id, worshipDays, setWorshipDays)}
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dias de RJM</CardTitle>
                  <CardDescription>Selecione os dias de RJM (Reunião de Jovens e Menores)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          rjmDays.includes(day.id)
                            ? 'bg-accent/20 border-accent'
                            : 'bg-muted/50 border-border hover:bg-muted'
                        }`}
                        onClick={() => toggleDay(day.id, rjmDays, setRjmDays)}
                      >
                        <Checkbox
                          checked={rjmDays.includes(day.id)}
                          onCheckedChange={() => toggleDay(day.id, rjmDays, setRjmDays)}
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rehearsals Tab */}
          <TabsContent value="rehearsals">
            <Card>
              <CardHeader>
                <CardTitle>Ensaios</CardTitle>
                <CardDescription>Cadastre os ensaios da congregação (Local, Regional, GEM ou Geral)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rehearsals List */}
                {rehearsals.length > 0 && (
                  <div className="space-y-3">
                    {rehearsals.map((rehearsal, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <Badge variant={rehearsal.type === 'Local' ? 'default' : 'secondary'}>
                            {rehearsal.type}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">
                              {DAYS_OF_WEEK.find((d) => d.id === rehearsal.day)?.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {rehearsal.time}
                              {rehearsal.repeats && ' • Repete durante o ano'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeRehearsal(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Rehearsal Form */}
                <div className="p-4 rounded-lg border border-dashed border-border space-y-4">
                  <p className="text-sm font-medium text-foreground">Adicionar Ensaio</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
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
                      <Label>Dia</Label>
                      <Select value={newRehearsalDay} onValueChange={setNewRehearsalDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={newRehearsalTime}
                        onChange={(e) => setNewRehearsalTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="invisible">Ações</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Checkbox
                          id="repeats"
                          checked={newRehearsalRepeats}
                          onCheckedChange={(checked) => setNewRehearsalRepeats(checked as boolean)}
                        />
                        <Label htmlFor="repeats" className="text-sm">
                          Repete
                        </Label>
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={addRehearsal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ensaio
                  </Button>
                </div>
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
