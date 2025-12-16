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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCongregations } from '@/hooks/useCongregations';
import { rjmMemberService } from '@/services/rjmMemberService';
import { recitativeService } from '@/services/recitativeService';
import type { RJMMember, RecitativeData } from '@/types';
import { Users, Plus, Trash2, Loader2, Calendar, UserPlus, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RJMManagement() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();

  // Filtrar apenas congregações com RJM
  const rjmCongregations = congregations.filter(c => c.hasRJM);

  // Estados para membros
  const [members, setMembers] = useState<RJMMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [filterCongregationId, setFilterCongregationId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState<'male' | 'female'>('male');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberResponsible, setMemberResponsible] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  // Estados para recitativos
  const [recitatives, setRecitatives] = useState<RecitativeData[]>([]);
  const [loadingRecitatives, setLoadingRecitatives] = useState(false);
  const [recitativeCongregationId, setRecitativeCongregationId] = useState('');
  const [filterRecitativeCongregationId, setFilterRecitativeCongregationId] = useState('');
  const [recitativeDate, setRecitativeDate] = useState<Date | null>(null);
  const [maleCount, setMaleCount] = useState('');
  const [femaleCount, setFemaleCount] = useState('');
  const [savingRecitative, setSavingRecitative] = useState(false);

  // Estados para deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'member' | 'recitative' } | null>(null);

  // Carregar membros
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await rjmMemberService.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os membros.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  }, [toast]);

  // Carregar recitativos
  const loadRecitatives = useCallback(async () => {
    setLoadingRecitatives(true);
    try {
      const data = await recitativeService.getAll();
      setRecitatives(data);
    } catch (error) {
      console.error('Error loading recitatives:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os recitativos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecitatives(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMembers();
    loadRecitatives();
  }, [loadMembers, loadRecitatives]);

  const handleAddMember = async () => {
    if (!selectedCongregationId || !memberName || !memberPhone || !memberResponsible || !memberAge) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para cadastrar um membro.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = rjmCongregations.find(c => c.id === selectedCongregationId);
    if (!congregation) return;

    setSavingMember(true);
    try {
      await rjmMemberService.create({
        name: memberName,
        gender: memberGender,
        phone: memberPhone,
        responsible: memberResponsible,
        age: parseInt(memberAge),
        congregationId: selectedCongregationId,
        congregationName: congregation.name,
      });

      toast({
        title: 'Membro cadastrado!',
        description: `${memberName} foi cadastrado com sucesso.`,
      });

      // Limpar formulário
      setMemberName('');
      setMemberGender('male');
      setMemberPhone('');
      setMemberResponsible('');
      setMemberAge('');
      
      loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o membro.',
        variant: 'destructive',
      });
    } finally {
      setSavingMember(false);
    }
  };

  const handleAddRecitative = async () => {
    if (!recitativeCongregationId || !recitativeDate || !maleCount || !femaleCount) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para lançar os recitativos.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = rjmCongregations.find(c => c.id === recitativeCongregationId);
    if (!congregation) return;

    setSavingRecitative(true);
    try {
      await recitativeService.create({
        congregationId: recitativeCongregationId,
        congregationName: congregation.name,
        date: recitativeDate,
        maleCount: parseInt(maleCount),
        femaleCount: parseInt(femaleCount),
      });

      toast({
        title: 'Recitativos lançados!',
        description: 'Os dados foram salvos com sucesso.',
      });

      // Limpar formulário
      setRecitativeDate(null);
      setMaleCount('');
      setFemaleCount('');
      
      loadRecitatives();
    } catch (error) {
      console.error('Error adding recitative:', error);
      toast({
        title: 'Erro ao lançar',
        description: 'Não foi possível lançar os recitativos.',
        variant: 'destructive',
      });
    } finally {
      setSavingRecitative(false);
    }
  };

  const confirmDelete = (id: string, name: string, type: 'member' | 'recitative') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'member') {
        await rjmMemberService.delete(itemToDelete.id);
        loadMembers();
        toast({
          title: 'Membro removido',
          description: `${itemToDelete.name} foi removido com sucesso.`,
        });
      } else {
        await recitativeService.delete(itemToDelete.id);
        loadRecitatives();
        toast({
          title: 'Recitativo removido',
          description: 'Os dados foram removidos com sucesso.',
        });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Filtrar membros por congregação selecionada no filtro de listagem
  const filteredMembers = filterCongregationId 
    ? members.filter(m => m.congregationId === filterCongregationId)
    : members;

  // Filtrar recitativos por congregação selecionada no filtro de listagem
  const filteredRecitatives = filterRecitativeCongregationId
    ? recitatives.filter(r => r.congregationId === filterRecitativeCongregationId)
    : recitatives;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reunião de Jovens e Menores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie membros e recitativos das RJMs
          </p>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="members" className="gap-2">
              <UserPlus className="h-4 w-4 hidden sm:inline" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="recitatives" className="gap-2">
              <BookOpen className="h-4 w-4 hidden sm:inline" />
              Recitativos
            </TabsTrigger>
          </TabsList>

          {/* Membros Tab */}
          <TabsContent value="members">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de cadastro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Cadastrar Membro
                  </CardTitle>
                  <CardDescription>Adicione novos membros da RJM</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-congregation">Congregação *</Label>
                    <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                      <SelectTrigger id="member-congregation">
                        <SelectValue placeholder="Selecione uma congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        {rjmCongregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-name">Nome *</Label>
                    <Input
                      id="member-name"
                      placeholder="Nome completo"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-gender">Gênero *</Label>
                    <Select value={memberGender} onValueChange={(v) => setMemberGender(v as 'male' | 'female')}>
                      <SelectTrigger id="member-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Irmão</SelectItem>
                        <SelectItem value="female">Irmã</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-phone">Telefone *</Label>
                    <Input
                      id="member-phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-responsible">Responsável *</Label>
                    <Input
                      id="member-responsible"
                      placeholder="Nome do responsável"
                      value={memberResponsible}
                      onChange={(e) => setMemberResponsible(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-age">Idade *</Label>
                    <Input
                      id="member-age"
                      type="number"
                      min="0"
                      placeholder="Idade"
                      value={memberAge}
                      onChange={(e) => setMemberAge(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleAddMember}
                    disabled={savingMember || !selectedCongregationId}
                    className="w-full"
                  >
                    {savingMember ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Cadastrar Membro
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de membros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros Cadastrados
                  </CardTitle>
                  <CardDescription>
                    Total: {filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''}
                  </CardDescription>
                  
                  {/* Filtro por Congregação */}
                  <div className="pt-4">
                    <Select value={filterCongregationId} onValueChange={setFilterCongregationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Todas as congregações</SelectItem>
                        {rjmCongregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum membro cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{member.name}</h3>
                              <Badge variant={member.gender === 'male' ? 'default' : 'secondary'}>
                                {member.gender === 'male' ? 'Irmão' : 'Irmã'}
                              </Badge>
                              <Badge variant="outline">{member.age} anos</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              📞 {member.phone} • Responsável: {member.responsible}
                            </p>
                            {!selectedCongregationId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {member.congregationName}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(member.id!, member.name, 'member')}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recitativos Tab */}
          <TabsContent value="recitatives">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de lançamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Lançar Recitativos
                  </CardTitle>
                  <CardDescription>Registre a quantidade de recitativos por reunião</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recitative-congregation">Congregação *</Label>
                    <Select value={recitativeCongregationId} onValueChange={setRecitativeCongregationId}>
                      <SelectTrigger id="recitative-congregation">
                        <SelectValue placeholder="Selecione uma congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        {rjmCongregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recitative-date">Data da Reunião *</Label>
                    <Input
                      id="recitative-date"
                      type="date"
                      value={recitativeDate ? format(recitativeDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setRecitativeDate(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="male-count">Recitativos de Irmãos *</Label>
                      <Input
                        id="male-count"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={maleCount}
                        onChange={(e) => setMaleCount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="female-count">Recitativos de Irmãs *</Label>
                      <Input
                        id="female-count"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={femaleCount}
                        onChange={(e) => setFemaleCount(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddRecitative}
                    disabled={savingRecitative || !recitativeCongregationId}
                    className="w-full"
                  >
                    {savingRecitative ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Lançar Recitativos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de recitativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recitativos Lançados
                  </CardTitle>
                  <CardDescription>
                    Total: {filteredRecitatives.length} lançamento{filteredRecitatives.length !== 1 ? 's' : ''}
                  </CardDescription>
                  
                  {/* Filtro por Congregação */}
                  <div className="pt-4">
                    <Select value={filterRecitativeCongregationId} onValueChange={setFilterRecitativeCongregationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por congregação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Todas as congregações</SelectItem>
                        {rjmCongregations.map((cong) => (
                          <SelectItem key={cong.id} value={cong.id!}>
                            {cong.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingRecitatives ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredRecitatives.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum recitativo lançado</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredRecitatives.map((recitative) => (
                        <div
                          key={recitative.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {format(recitative.date, 'dd/MM/yyyy', { locale: ptBR })}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              👨 Irmãos: {recitative.maleCount} • 👩 Irmãs: {recitative.femaleCount}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total: {recitative.maleCount + recitative.femaleCount} recitativos
                            </p>
                            {!recitativeCongregationId && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {recitative.congregationName}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(
                              recitative.id!,
                              format(recitative.date, 'dd/MM/yyyy', { locale: ptBR }),
                              'recitative'
                            )}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold">{itemToDelete?.name}</span>?
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
