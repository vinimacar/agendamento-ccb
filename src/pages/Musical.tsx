import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { useCongregations } from '@/hooks/useCongregations';
import { musicianService } from '@/services/musicianService';
import type { Musician } from '@/types';
import { Music, Plus, Trash2, Loader2, Search } from 'lucide-react';

const INSTRUMENTS = [
  'Clarinete',
  'Clarone',
  'Sax Soprano',
  'Sax Alto',
  'Sax Tenor',
  'Sax Barítono',
  'Trompete',
  'Flugelhorn',
  'Eufônio',
  'Trombone',
  'Trombonito',
  'Tuba',
  'Viola',
  'Violino',
  'Cello',
  'Órgão',
];

const STAGES = ['Ensaio', 'RJM', 'Culto Oficial', 'Oficialização'] as const;

export default function Musical() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();

  const [musicians, setMusicians] = useState<Musician[]>([]);
  const [loadingMusicians, setLoadingMusicians] = useState(false);
  const [savingMusician, setSavingMusician] = useState(false);

  // Formulário
  const [name, setName] = useState('');
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState('');
  const [stage, setStage] = useState<typeof STAGES[number]>('Ensaio');

  // Filtros
  const [filterInstrument, setFilterInstrument] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterCongregation, setFilterCongregation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [musicianToDelete, setMusicianToDelete] = useState<{ id: string; name: string } | null>(null);

  const loadMusicians = useCallback(async () => {
    setLoadingMusicians(true);
    try {
      const data = await musicianService.getAll();
      setMusicians(data);
    } catch (error) {
      console.error('Error loading musicians:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os músicos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMusicians(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMusicians();
  }, [loadMusicians]);

  // Atualizar cidade quando congregação é selecionada
  useEffect(() => {
    if (selectedCongregationId) {
      const congregation = congregations.find(c => c.id === selectedCongregationId);
      if (congregation) {
        setCity(congregation.city);
      }
    }
  }, [selectedCongregationId, congregations]);

  const handleAddMusician = async () => {
    if (!name || !selectedCongregationId || !city || !phone || !instrument || !stage) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para cadastrar um músico.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = congregations.find(c => c.id === selectedCongregationId);
    if (!congregation) return;

    setSavingMusician(true);
    try {
      await musicianService.create({
        name,
        congregationId: selectedCongregationId,
        congregationName: congregation.name,
        city,
        phone,
        instrument,
        stage,
      });

      toast({
        title: 'Músico cadastrado!',
        description: `${name} foi cadastrado com sucesso.`,
      });

      // Limpar formulário
      setName('');
      setSelectedCongregationId('');
      setCity('');
      setPhone('');
      setInstrument('');
      setStage('Ensaio');

      loadMusicians();
    } catch (error) {
      console.error('Error adding musician:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o músico.',
        variant: 'destructive',
      });
    } finally {
      setSavingMusician(false);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setMusicianToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!musicianToDelete) return;

    try {
      await musicianService.delete(musicianToDelete.id);
      loadMusicians();
      toast({
        title: 'Músico removido',
        description: `${musicianToDelete.name} foi removido com sucesso.`,
      });
    } catch (error) {
      console.error('Error deleting musician:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o músico.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMusicianToDelete(null);
    }
  };

  // Aplicar filtros
  const filteredMusicians = musicians.filter((musician) => {
    if (filterInstrument && musician.instrument !== filterInstrument) return false;
    if (filterStage && musician.stage !== filterStage) return false;
    if (filterCongregation && musician.congregationId !== filterCongregation) return false;
    if (searchTerm && !musician.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Agrupar por etapa
  const musiciansByStage = STAGES.reduce((acc, s) => {
    acc[s] = filteredMusicians.filter(m => m.stage === s);
    return acc;
  }, {} as Record<string, Musician[]>);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Ensaio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'RJM': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Culto Oficial': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Oficialização': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Musical</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie músicos e organistas da região
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário de cadastro */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Cadastrar Músico/Organista
              </CardTitle>
              <CardDescription>Adicione novos músicos da região</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="musician-name">Nome *</Label>
                <Input
                  id="musician-name"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-congregation">Comum Congregação *</Label>
                <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                  <SelectTrigger id="musician-congregation">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-city">Cidade *</Label>
                <Input
                  id="musician-city"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-phone">Telefone *</Label>
                <Input
                  id="musician-phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-instrument">Instrumento *</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger id="musician-instrument">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="musician-stage">Etapa *</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as typeof STAGES[number])}>
                  <SelectTrigger id="musician-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddMusician}
                disabled={savingMusician}
                className="w-full"
              >
                {savingMusician ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de músicos */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Músicos e Organistas
              </CardTitle>
              <CardDescription>
                Total: {filteredMusicians.length} músico{filteredMusicians.length !== 1 ? 's' : ''}
              </CardDescription>
              
              {/* Filtros */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={filterInstrument} onValueChange={setFilterInstrument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Instrumento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os instrumentos</SelectItem>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as etapas</SelectItem>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCongregation} onValueChange={setFilterCongregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as congregações</SelectItem>
                    {congregations.map((cong) => (
                      <SelectItem key={cong.id} value={cong.id!}>
                        {cong.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingMusicians ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMusicians.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhum músico encontrado</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {STAGES.map((stageName) => {
                    const stageMusicians = musiciansByStage[stageName];
                    if (stageMusicians.length === 0) return null;

                    return (
                      <div key={stageName} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Badge className={getStageColor(stageName)}>
                            {stageName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({stageMusicians.length})
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {stageMusicians.map((musician) => (
                            <div
                              key={musician.id}
                              className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{musician.name}</h3>
                                  <Badge variant="outline">{musician.instrument}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {musician.congregationName} • {musician.city}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  📞 {musician.phone}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete(musician.id!, musician.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold">{musicianToDelete?.name}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
