import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { darpeSectorService } from '@/services/darpeSectorService';
import { darpeMemberService } from '@/services/darpeMemberService';
import { darpeInstitutionService } from '@/services/darpeInstitutionService';
import type { DarpeSector, DarpeMember, DarpeInstitution, EventSchedule } from '@/types';
import { Heart, Users, Building2, Plus, Trash2, Loader2, Tag, UserPlus, X } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

const MINISTRY_ROLES = [
  'Ancião',
  'Cooperador do Ofício',
  'Cooperador de Jovens e Menores',
  'Diácono',
  'Examinador(a)',
  'Encarregado Regional',
  'Encarregado Local',
  'Irmão(ã)',
];

export default function DarpeManagement() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();

  // Estados para setores
  const [sectors, setSectors] = useState<DarpeSector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [sectorName, setSectorName] = useState('');
  const [sectorDescription, setSectorDescription] = useState('');
  const [savingSector, setSavingSector] = useState(false);

  // Estados para membros
  const [members, setMembers] = useState<DarpeMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberCongregationId, setMemberCongregationId] = useState('');
  const [memberCity, setMemberCity] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberContact, setMemberContact] = useState('');
  const [memberSectors, setMemberSectors] = useState<string[]>([]);
  const [savingMember, setSavingMember] = useState(false);

  // Estados para instituições
  const [institutions, setInstitutions] = useState<DarpeInstitution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [institutionCity, setInstitutionCity] = useState('');
  const [institutionContact, setInstitutionContact] = useState('');
  const [institutionSchedules, setInstitutionSchedules] = useState<EventSchedule[]>([]);
  const [institutionResponsibles, setInstitutionResponsibles] = useState<string[]>([]);
  const [savingInstitution, setSavingInstitution] = useState(false);

  // Estados para novo horário de atendimento
  const [newScheduleDay, setNewScheduleDay] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [newScheduleHasSpecialRule, setNewScheduleHasSpecialRule] = useState(false);
  const [newScheduleWeekOfMonth, setNewScheduleWeekOfMonth] = useState<string[]>([]);

  // Estados para deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'sector' | 'member' | 'institution' } | null>(null);

  // Carregar dados
  const loadSectors = useCallback(async () => {
    setLoadingSectors(true);
    try {
      const data = await darpeSectorService.getAll();
      setSectors(data);
    } catch (error) {
      console.error('Error loading sectors:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os setores.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSectors(false);
    }
  }, [toast]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await darpeMemberService.getAll();
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

  const loadInstitutions = useCallback(async () => {
    setLoadingInstitutions(true);
    try {
      const data = await darpeInstitutionService.getAll();
      setInstitutions(data);
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as instituições.',
        variant: 'destructive',
      });
    } finally {
      setLoadingInstitutions(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSectors();
    loadMembers();
    loadInstitutions();
  }, [loadSectors, loadMembers, loadInstitutions]);

  // Atualizar cidade quando congregação é selecionada
  useEffect(() => {
    if (memberCongregationId) {
      const congregation = congregations.find(c => c.id === memberCongregationId);
      if (congregation) {
        setMemberCity(congregation.city);
      }
    }
  }, [memberCongregationId, congregations]);

  // Handlers para setores
  const handleAddSector = async () => {
    if (!sectorName) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o nome do setor.',
        variant: 'destructive',
      });
      return;
    }

    setSavingSector(true);
    try {
      await darpeSectorService.create({
        name: sectorName,
        description: sectorDescription,
      });

      toast({
        title: 'Setor cadastrado!',
        description: `${sectorName} foi cadastrado com sucesso.`,
      });

      setSectorName('');
      setSectorDescription('');
      loadSectors();
    } catch (error) {
      console.error('Error adding sector:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar o setor.',
        variant: 'destructive',
      });
    } finally {
      setSavingSector(false);
    }
  };

  // Handlers para membros
  const handleAddMember = async () => {
    if (!memberName || !memberCongregationId || !memberRole || !memberContact) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = congregations.find(c => c.id === memberCongregationId);
    if (!congregation) return;

    setSavingMember(true);
    try {
      await darpeMemberService.create({
        name: memberName,
        congregationId: memberCongregationId,
        congregationName: congregation.name,
        city: memberCity,
        role: memberRole,
        contact: memberContact,
        sectors: memberSectors,
      });

      toast({
        title: 'Membro cadastrado!',
        description: `${memberName} foi cadastrado com sucesso.`,
      });

      setMemberName('');
      setMemberCongregationId('');
      setMemberCity('');
      setMemberRole('');
      setMemberContact('');
      setMemberSectors([]);
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

  // Handlers para instituições
  const handleAddSchedule = () => {
    if (!newScheduleDay || !newScheduleTime) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o dia e horário do atendimento.',
        variant: 'destructive',
      });
      return;
    }

    const newSchedule: EventSchedule = {
      day: newScheduleDay,
      time: newScheduleTime,
      type: 'culto',
      hasSpecialRule: newScheduleHasSpecialRule,
      weekOfMonth: newScheduleHasSpecialRule ? newScheduleWeekOfMonth : undefined,
    };

    setInstitutionSchedules([...institutionSchedules, newSchedule]);
    setNewScheduleDay('');
    setNewScheduleTime('');
    setNewScheduleHasSpecialRule(false);
    setNewScheduleWeekOfMonth([]);
  };

  const removeSchedule = (index: number) => {
    setInstitutionSchedules(institutionSchedules.filter((_, i) => i !== index));
  };

  const toggleWeekOfMonth = (week: string) => {
    if (newScheduleWeekOfMonth.includes(week)) {
      setNewScheduleWeekOfMonth(newScheduleWeekOfMonth.filter(w => w !== week));
    } else {
      setNewScheduleWeekOfMonth([...newScheduleWeekOfMonth, week]);
    }
  };

  const handleAddInstitution = async () => {
    if (!institutionName || !institutionAddress || !institutionCity || !institutionContact) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setSavingInstitution(true);
    try {
      await darpeInstitutionService.create({
        name: institutionName,
        address: institutionAddress,
        city: institutionCity,
        contact: institutionContact,
        schedules: institutionSchedules,
        responsibleMembers: institutionResponsibles,
      });

      toast({
        title: 'Instituição cadastrada!',
        description: `${institutionName} foi cadastrada com sucesso.`,
      });

      setInstitutionName('');
      setInstitutionAddress('');
      setInstitutionCity('');
      setInstitutionContact('');
      setInstitutionSchedules([]);
      setInstitutionResponsibles([]);
      loadInstitutions();
    } catch (error) {
      console.error('Error adding institution:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Não foi possível cadastrar a instituição.',
        variant: 'destructive',
      });
    } finally {
      setSavingInstitution(false);
    }
  };

  const confirmDelete = (id: string, name: string, type: 'sector' | 'member' | 'institution') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'sector') {
        await darpeSectorService.delete(itemToDelete.id);
        loadSectors();
      } else if (itemToDelete.type === 'member') {
        await darpeMemberService.delete(itemToDelete.id);
        loadMembers();
      } else {
        await darpeInstitutionService.delete(itemToDelete.id);
        loadInstitutions();
      }

      toast({
        title: 'Item removido',
        description: `${itemToDelete.name} foi removido com sucesso.`,
      });
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

  const toggleMemberSector = (sectorId: string) => {
    if (memberSectors.includes(sectorId)) {
      setMemberSectors(memberSectors.filter(s => s !== sectorId));
    } else {
      setMemberSectors([...memberSectors, sectorId]);
    }
  };

  const toggleInstitutionResponsible = (memberId: string) => {
    if (institutionResponsibles.includes(memberId)) {
      setInstitutionResponsibles(institutionResponsibles.filter(m => m !== memberId));
    } else {
      setInstitutionResponsibles([...institutionResponsibles, memberId]);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">DARPE</h1>
          <p className="text-muted-foreground mt-1">
            Departamento de Assistência e Reintegração de Pessoas Evangélicas
          </p>
        </div>

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="members" className="gap-2">
              <UserPlus className="h-4 w-4 hidden sm:inline" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="sectors" className="gap-2">
              <Tag className="h-4 w-4 hidden sm:inline" />
              Setores
            </TabsTrigger>
            <TabsTrigger value="institutions" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Instituições
            </TabsTrigger>
          </TabsList>

          {/* Setores Tab */}
          <TabsContent value="sectors">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Cadastrar Setor
                  </CardTitle>
                  <CardDescription>Adicione setores de atuação do DARPE</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector-name">Nome do Setor *</Label>
                    <Input
                      id="sector-name"
                      placeholder="Ex: Visitas Hospitalares"
                      value={sectorName}
                      onChange={(e) => setSectorName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sector-description">Descrição</Label>
                    <Textarea
                      id="sector-description"
                      placeholder="Descreva as atividades deste setor"
                      value={sectorDescription}
                      onChange={(e) => setSectorDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleAddSector}
                    disabled={savingSector}
                    className="w-full"
                  >
                    {savingSector ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Cadastrar Setor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Setores Cadastrados
                  </CardTitle>
                  <CardDescription>Total: {sectors.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSectors ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sectors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum setor cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {sectors.map((sector) => (
                        <div
                          key={sector.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold">{sector.name}</h3>
                            {sector.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {sector.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(sector.id!, sector.name, 'sector')}
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

          {/* Membros Tab */}
          <TabsContent value="members">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Cadastrar Membro
                  </CardTitle>
                  <CardDescription>Adicione membros do DARPE</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Label htmlFor="member-congregation">Comum Congregação *</Label>
                    <Select value={memberCongregationId} onValueChange={setMemberCongregationId}>
                      <SelectTrigger id="member-congregation">
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
                    <Label htmlFor="member-city">Cidade *</Label>
                    <Input
                      id="member-city"
                      placeholder="Cidade"
                      value={memberCity}
                      onChange={(e) => setMemberCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-role">Cargo/Ministério *</Label>
                    <Select value={memberRole} onValueChange={setMemberRole}>
                      <SelectTrigger id="member-role">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MINISTRY_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member-contact">Contato *</Label>
                    <Input
                      id="member-contact"
                      placeholder="Telefone ou email"
                      value={memberContact}
                      onChange={(e) => setMemberContact(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Setores que Participa</Label>
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border">
                      {sectors.map((sector) => (
                        <div key={sector.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sector-${sector.id}`}
                            checked={memberSectors.includes(sector.id!)}
                            onCheckedChange={() => toggleMemberSector(sector.id!)}
                          />
                          <Label
                            htmlFor={`sector-${sector.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {sector.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddMember}
                    disabled={savingMember}
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Membros Cadastrados
                  </CardTitle>
                  <CardDescription>Total: {members.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum membro cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{member.name}</h3>
                              <Badge variant="outline">{member.role}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.congregationName} • {member.city}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              📞 {member.contact}
                            </p>
                            {member.sectors.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {member.sectors.map((sectorId) => {
                                  const sector = sectors.find(s => s.id === sectorId);
                                  return sector ? (
                                    <Badge key={sectorId} variant="secondary" className="text-xs">
                                      {sector.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
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

          {/* Instituições Tab */}
          <TabsContent value="institutions">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Cadastrar Instituição
                  </CardTitle>
                  <CardDescription>Adicione instituições atendidas pelo DARPE</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution-name">Nome da Instituição *</Label>
                    <Input
                      id="institution-name"
                      placeholder="Ex: Hospital Central"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution-address">Endereço *</Label>
                    <Input
                      id="institution-address"
                      placeholder="Endereço completo"
                      value={institutionAddress}
                      onChange={(e) => setInstitutionAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution-city">Cidade *</Label>
                    <Input
                      id="institution-city"
                      placeholder="Cidade"
                      value={institutionCity}
                      onChange={(e) => setInstitutionCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution-contact">Contato *</Label>
                    <Input
                      id="institution-contact"
                      placeholder="Telefone ou responsável"
                      value={institutionContact}
                      onChange={(e) => setInstitutionContact(e.target.value)}
                    />
                  </div>

                  {/* Dias de Atendimento */}
                  <div className="space-y-2">
                    <Label>Dias de Atendimento</Label>
                    <div className="p-3 rounded-lg border space-y-3">
                      {institutionSchedules.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                          <span className="text-sm">
                            {DAYS_OF_WEEK.find(d => d.id === schedule.day)?.label} - {schedule.time}
                            {schedule.hasSpecialRule && schedule.weekOfMonth && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({schedule.weekOfMonth.join('ª, ')}ª semana{schedule.weekOfMonth.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeSchedule(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="grid grid-cols-2 gap-2">
                        <Select value={newScheduleDay} onValueChange={setNewScheduleDay}>
                          <SelectTrigger>
                            <SelectValue placeholder="Dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.id} value={day.id}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={newScheduleTime}
                          onChange={(e) => setNewScheduleTime(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="schedule-special-rule"
                          checked={newScheduleHasSpecialRule}
                          onCheckedChange={(checked) => setNewScheduleHasSpecialRule(checked as boolean)}
                        />
                        <Label htmlFor="schedule-special-rule" className="text-sm">
                          Semana específica do mês
                        </Label>
                      </div>

                      {newScheduleHasSpecialRule && (
                        <div className="grid grid-cols-5 gap-2">
                          {['1', '2', '3', '4', '5'].map((week) => (
                            <div key={week} className="flex items-center space-x-1">
                              <Checkbox
                                id={`week-${week}`}
                                checked={newScheduleWeekOfMonth.includes(week)}
                                onCheckedChange={() => toggleWeekOfMonth(week)}
                              />
                              <Label htmlFor={`week-${week}`} className="text-sm">
                                {week}ª
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddSchedule}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Horário
                      </Button>
                    </div>
                  </div>

                  {/* Membros Responsáveis */}
                  <div className="space-y-2">
                    <Label>Membros Responsáveis</Label>
                    <div className="grid grid-cols-1 gap-2 p-3 rounded-lg border max-h-32 overflow-y-auto">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={institutionResponsibles.includes(member.id!)}
                            onCheckedChange={() => toggleInstitutionResponsible(member.id!)}
                          />
                          <Label
                            htmlFor={`member-${member.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {member.name} - {member.role}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddInstitution}
                    disabled={savingInstitution}
                    className="w-full"
                  >
                    {savingInstitution ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Cadastrar Instituição
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Instituições Cadastradas
                  </CardTitle>
                  <CardDescription>Total: {institutions.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInstitutions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : institutions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma instituição cadastrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {institutions.map((institution) => (
                        <div
                          key={institution.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/40"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold">{institution.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {institution.address}, {institution.city}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              📞 {institution.contact}
                            </p>
                            {institution.schedules.length > 0 && (
                              <div className="mt-2 text-xs">
                                <span className="font-medium">Atendimentos:</span>{' '}
                                {institution.schedules.map((s, i) => (
                                  <span key={i}>
                                    {DAYS_OF_WEEK.find(d => d.id === s.day)?.label} {s.time}
                                    {i < institution.schedules.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(institution.id!, institution.name, 'institution')}
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
