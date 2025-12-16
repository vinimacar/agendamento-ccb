import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { musicalTeamService } from '@/services/musicalTeamService';
import { musicalRehearsalService } from '@/services/musicalRehearsalService';
import type { Musician, MusicalTeamMember, MusicalRehearsal } from '@/types';
import { Music, Plus, Trash2, Loader2, Search, Users2, Calendar, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  // Equipe Musical
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<MusicalTeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Calendário de Ensaios
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [rehearsals, setRehearsals] = useState<MusicalRehearsal[]>([]);
  const [loadingRehearsals, setLoadingRehearsals] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

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

  // Carregar equipe musical
  const loadTeam = async () => {
    setLoadingTeam(true);
    try {
      const data = await musicalTeamService.getAll();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error loading team:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar a equipe.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTeam(false);
    }
  };

  // Carregar ensaios
  const loadRehearsals = async () => {
    setLoadingRehearsals(true);
    try {
      let data: MusicalRehearsal[];
      if (selectedMonth !== null) {
        data = await musicalRehearsalService.getByMonth(selectedYear, selectedMonth);
      } else {
        data = await musicalRehearsalService.getByYear(selectedYear);
      }
      setRehearsals(data);
    } catch (error) {
      console.error('Error loading rehearsals:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os ensaios.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRehearsals(false);
    }
  };

  // Abrir dialog de equipe
  const openTeamDialog = () => {
    setTeamDialogOpen(true);
    loadTeam();
  };

  // Abrir dialog de calendário
  const openCalendarDialog = () => {
    setCalendarDialogOpen(true);
    loadRehearsals();
  };

  // Imprimir calendário
  const handlePrintCalendar = () => {
    const periodText = selectedMonth !== null 
      ? format(new Date(selectedYear, selectedMonth - 1), "MMMM 'de' yyyy", { locale: ptBR })
      : `Ano de ${selectedYear}`;

    const printContent = `
      <html>
        <head>
          <title>Calendário de Ensaios - ${periodText}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            h2 { text-align: center; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4A90E2; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .type-badge { 
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .type-local { background-color: #E3F2FD; color: #1976D2; }
            .type-regional { background-color: #F3E5F5; color: #7B1FA2; }
            .type-gem { background-color: #FFF3E0; color: #F57C00; }
            .type-geral { background-color: #E8F5E9; color: #388E3C; }
          </style>
        </head>
        <body>
          <h1>Calendário de Ensaios</h1>
          <h2>${periodText}</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dia da Semana</th>
                <th>Horário</th>
                <th>Tipo</th>
                <th>Local</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${rehearsals.length === 0 ? '<tr><td colspan="6" style="text-align: center;">Nenhum ensaio agendado</td></tr>' : ''}
              ${rehearsals.map(rehearsal => `
                <tr>
                  <td>${format(rehearsal.date, 'dd/MM/yyyy', { locale: ptBR })}</td>
                  <td>${format(rehearsal.date, 'EEEE', { locale: ptBR })}</td>
                  <td>${rehearsal.time}</td>
                  <td>
                    <span class="type-badge type-${rehearsal.type.toLowerCase()}">
                      ${rehearsal.type}
                    </span>
                  </td>
                  <td>${rehearsal.congregationName || '-'}</td>
                  <td>${rehearsal.description || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Musical</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie músicos e organistas da região
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openTeamDialog}>
              <Users2 className="h-4 w-4 mr-2" />
              Equipe
            </Button>
            <Button variant="outline" onClick={openCalendarDialog}>
              <Calendar className="h-4 w-4 mr-2" />
              Calendário
            </Button>
          </div>
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

      {/* Equipe Musical Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Equipe Musical
            </DialogTitle>
            <DialogDescription>
              Encarregados Regionais, Locais e Examinadoras
            </DialogDescription>
          </DialogHeader>
          
          {loadingTeam ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Encarregados Regionais */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Badge variant="default">Encarregados Regionais</Badge>
                </h3>
                <div className="space-y-2">
                  {teamMembers.filter(m => m.role === 'regional-supervisor').length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum encarregado regional cadastrado</p>
                  ) : (
                    teamMembers.filter(m => m.role === 'regional-supervisor').map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-secondary/20 border">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.city}</p>
                        <p className="text-xs text-muted-foreground">📞 {member.phone}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Encarregados Locais */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Encarregados Locais</Badge>
                </h3>
                <div className="space-y-2">
                  {teamMembers.filter(m => m.role === 'local-supervisor').length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum encarregado local cadastrado</p>
                  ) : (
                    teamMembers.filter(m => m.role === 'local-supervisor').map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-secondary/20 border">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.congregationName} • {member.city}
                        </p>
                        <p className="text-xs text-muted-foreground">📞 {member.phone}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Examinadoras */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Badge variant="outline">Examinadoras</Badge>
                </h3>
                <div className="space-y-2">
                  {teamMembers.filter(m => m.role === 'examiner').length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma examinadora cadastrada</p>
                  ) : (
                    teamMembers.filter(m => m.role === 'examiner').map((member) => (
                      <div key={member.id} className="p-3 rounded-lg bg-secondary/20 border">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.congregationName} • {member.city}
                        </p>
                        <p className="text-xs text-muted-foreground">📞 {member.phone}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendário de Ensaios Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Ensaios
            </DialogTitle>
            <DialogDescription>
              Visualize e imprima o calendário de ensaios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filtros de período */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(v) => {
                    setSelectedYear(parseInt(v));
                    loadRehearsals();
                  }}
                >
                  <SelectTrigger id="year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Mês (opcional)</Label>
                <Select 
                  value={selectedMonth?.toString() || ''} 
                  onValueChange={(v) => {
                    setSelectedMonth(v ? parseInt(v) : null);
                    loadRehearsals();
                  }}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Ano completo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ano completo</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {format(new Date(2024, month - 1), 'MMMM', { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handlePrintCalendar} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Calendário
            </Button>

            {/* Lista de ensaios */}
            {loadingRehearsals ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rehearsals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhum ensaio agendado para este período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rehearsals.map((rehearsal) => (
                  <div
                    key={rehearsal.id}
                    className="p-3 rounded-lg bg-secondary/20 border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {format(rehearsal.date, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <Badge variant={
                            rehearsal.type === 'Local' ? 'default' :
                            rehearsal.type === 'Regional' ? 'secondary' :
                            rehearsal.type === 'GEM' ? 'outline' : 'destructive'
                          }>
                            {rehearsal.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(rehearsal.date, 'EEEE', { locale: ptBR })} às {rehearsal.time}
                        </p>
                        {rehearsal.congregationName && (
                          <p className="text-sm text-muted-foreground">
                            📍 {rehearsal.congregationName}
                          </p>
                        )}
                        {rehearsal.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {rehearsal.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
