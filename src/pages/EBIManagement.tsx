import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Users, Calendar, BookOpen, CheckSquare } from 'lucide-react';
import { useCongregations } from '@/hooks/useCongregations';
import { ebiWorkGroupService } from '@/services/ebiWorkGroupService';
import { ebiMemberService } from '@/services/ebiMemberService';
import { ebiActivityService } from '@/services/ebiActivityService';
import { ebiChildService } from '@/services/ebiChildService';
import { ebiAttendanceService } from '@/services/ebiAttendanceService';
import { useToast } from '@/hooks/use-toast';
import type { EBIWorkGroup, EBIMember, EBIActivity, EBIChild, EBIAttendance } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EBIManagement() {
  const { toast } = useToast();
  const { congregations, loading: congregationsLoading } = useCongregations();
  const [selectedCongregation, setSelectedCongregation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('work-groups');

  // Work Groups
  const [workGroups, setWorkGroups] = useState<EBIWorkGroup[]>([]);
  const [workGroupDialog, setWorkGroupDialog] = useState(false);
  const [editingWorkGroup, setEditingWorkGroup] = useState<EBIWorkGroup | null>(null);

  // Members
  const [members, setMembers] = useState<EBIMember[]>([]);
  const [memberDialog, setMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<EBIMember | null>(null);

  // Activities
  const [activities, setActivities] = useState<EBIActivity[]>([]);
  const [activityDialog, setActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<EBIActivity | null>(null);

  // Children
  const [children, setChildren] = useState<EBIChild[]>([]);
  const [childDialog, setChildDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<EBIChild | null>(null);

  // Attendance
  const [attendances, setAttendances] = useState<EBIAttendance[]>([]);
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<EBIAttendance | null>(null);

  const loadWorkGroups = async () => {
    try {
      const data = await ebiWorkGroupService.getAll();
      setWorkGroups(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar grupos de trabalho', variant: 'destructive' });
    }
  };

  const loadMembers = async () => {
    try {
      const data = await ebiMemberService.getByCongregation(selectedCongregation);
      setMembers(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar membros', variant: 'destructive' });
    }
  };

  const loadActivities = async () => {
    try {
      const data = await ebiActivityService.getByCongregation(selectedCongregation);
      setActivities(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar atividades', variant: 'destructive' });
    }
  };

  const loadChildren = async () => {
    try {
      const data = await ebiChildService.getByCongregation(selectedCongregation);
      setChildren(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar crianças', variant: 'destructive' });
    }
  };

  const loadAttendances = async () => {
    try {
      const data = await ebiAttendanceService.getByCongregation(selectedCongregation);
      setAttendances(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar frequências', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadWorkGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCongregation) {
      loadMembers();
      loadActivities();
      loadChildren();
      loadAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCongregation]);

  const handleWorkGroupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const data = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        ageRange: formData.get('ageRange') as string,
      };

      if (editingWorkGroup) {
        await ebiWorkGroupService.update(editingWorkGroup.id, data);
        toast({ title: 'Grupo de trabalho atualizado com sucesso' });
      } else {
        await ebiWorkGroupService.create(data);
        toast({ title: 'Grupo de trabalho criado com sucesso' });
      }

      setWorkGroupDialog(false);
      setEditingWorkGroup(null);
      loadWorkGroups();
    } catch (error) {
      toast({ title: 'Erro ao salvar grupo de trabalho', variant: 'destructive' });
    }
  };

  const handleMemberSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const selectedCongregationData = congregations.find(c => c.id === selectedCongregation);
      
      const data = {
        name: formData.get('name') as string,
        congregationId: selectedCongregation,
        congregationName: selectedCongregationData?.name || '',
        workGroups: [formData.get('workGroupId') as string],
        role: formData.get('role') as string,
        contact: formData.get('contact') as string,
      };

      if (editingMember) {
        await ebiMemberService.update(editingMember.id, data);
        toast({ title: 'Membro atualizado com sucesso' });
      } else {
        await ebiMemberService.create(data);
        toast({ title: 'Membro cadastrado com sucesso' });
      }

      setMemberDialog(false);
      setEditingMember(null);
      loadMembers();
    } catch (error) {
      toast({ title: 'Erro ao salvar membro', variant: 'destructive' });
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const selectedCongregationData = congregations.find(c => c.id === selectedCongregation);
      const selectedWorkGroup = workGroups.find(g => g.id === formData.get('workGroupId') as string);
      
      const data = {
        congregationId: selectedCongregation,
        congregationName: selectedCongregationData?.name || '',
        workGroupId: formData.get('workGroupId') as string,
        workGroupName: selectedWorkGroup?.name || '',
        theme: formData.get('theme') as string,
        objective: formData.get('objective') as string,
        date: new Date(formData.get('date') as string),
      };

      if (editingActivity) {
        await ebiActivityService.update(editingActivity.id, data);
        toast({ title: 'Atividade atualizada com sucesso' });
      } else {
        await ebiActivityService.create(data);
        toast({ title: 'Atividade cadastrada com sucesso' });
      }

      setActivityDialog(false);
      setEditingActivity(null);
      loadActivities();
    } catch (error) {
      toast({ title: 'Erro ao salvar atividade', variant: 'destructive' });
    }
  };

  const handleChildSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const selectedCongregationData = congregations.find(c => c.id === selectedCongregation);
      const selectedWorkGroup = workGroups.find(g => g.id === formData.get('workGroupId') as string);
      
      const data = {
        name: formData.get('name') as string,
        congregationId: selectedCongregation,
        congregationName: selectedCongregationData?.name || '',
        workGroupId: formData.get('workGroupId') as string,
        workGroupName: selectedWorkGroup?.name || '',
        age: parseInt(formData.get('age') as string),
        responsibleName: formData.get('responsibleName') as string,
        responsibleContact: formData.get('responsibleContact') as string,
      };

      if (editingChild) {
        await ebiChildService.update(editingChild.id, data);
        toast({ title: 'Criança atualizada com sucesso' });
      } else {
        await ebiChildService.create(data);
        toast({ title: 'Criança cadastrada com sucesso' });
      }

      setChildDialog(false);
      setEditingChild(null);
      loadChildren();
    } catch (error) {
      toast({ title: 'Erro ao salvar criança', variant: 'destructive' });
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const selectedCongregationData = congregations.find(c => c.id === selectedCongregation);
      const selectedWorkGroup = workGroups.find(g => g.id === formData.get('workGroupId') as string);
      const presentCount = parseInt(formData.get('presentCount') as string);
      const absentCount = parseInt(formData.get('absentCount') as string);
      
      const data = {
        congregationId: selectedCongregation,
        congregationName: selectedCongregationData?.name || '',
        activityId: formData.get('activityId') as string || '',
        workGroupId: formData.get('workGroupId') as string,
        workGroupName: selectedWorkGroup?.name || '',
        date: new Date(formData.get('date') as string),
        childrenPresent: [],
        totalPresent: presentCount,
        totalAbsent: absentCount,
      };

      if (editingAttendance) {
        await ebiAttendanceService.update(editingAttendance.id, data);
        toast({ title: 'Frequência atualizada com sucesso' });
      } else {
        await ebiAttendanceService.create(data);
        toast({ title: 'Frequência lançada com sucesso' });
      }

      setAttendanceDialog(false);
      setEditingAttendance(null);
      loadAttendances();
    } catch (error) {
      toast({ title: 'Erro ao salvar frequência', variant: 'destructive' });
    }
  };

  const deleteWorkGroup = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo de trabalho?')) {
      try {
        await ebiWorkGroupService.delete(id);
        toast({ title: 'Grupo de trabalho excluído com sucesso' });
        loadWorkGroups();
      } catch (error) {
        toast({ title: 'Erro ao excluir grupo de trabalho', variant: 'destructive' });
      }
    }
  };

  const deleteMember = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      try {
        await ebiMemberService.delete(id);
        toast({ title: 'Membro excluído com sucesso' });
        loadMembers();
      } catch (error) {
        toast({ title: 'Erro ao excluir membro', variant: 'destructive' });
      }
    }
  };

  const deleteActivity = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
      try {
        await ebiActivityService.delete(id);
        toast({ title: 'Atividade excluída com sucesso' });
        loadActivities();
      } catch (error) {
        toast({ title: 'Erro ao excluir atividade', variant: 'destructive' });
      }
    }
  };

  const deleteChild = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta criança?')) {
      try {
        await ebiChildService.delete(id);
        toast({ title: 'Criança excluída com sucesso' });
        loadChildren();
      } catch (error) {
        toast({ title: 'Erro ao excluir criança', variant: 'destructive' });
      }
    }
  };

  const deleteAttendance = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta frequência?')) {
      try {
        await ebiAttendanceService.delete(id);
        toast({ title: 'Frequência excluída com sucesso' });
        loadAttendances();
      } catch (error) {
        toast({ title: 'Erro ao excluir frequência', variant: 'destructive' });
      }
    }
  };

  const ebiCongregations = congregations.filter(c => c.hasEBI);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">EBI - Espaço Bíblico Infantil</h1>
        <p className="text-muted-foreground">Gerenciamento do EBI</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {congregationsLoading ? (
          <p>Carregando congregações...</p>
        ) : (
          ebiCongregations.map((congregation) => (
            <Button
              key={congregation.id}
              variant={selectedCongregation === congregation.id ? 'default' : 'outline'}
              onClick={() => setSelectedCongregation(congregation.id)}
              className="h-20"
            >
              {congregation.name}
            </Button>
          ))
        )}
      </div>

      {selectedCongregation && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="work-groups">
              <Users className="w-4 h-4 mr-2" />
              Grupos de Trabalho
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="activities">
              <BookOpen className="w-4 h-4 mr-2" />
              Atividades
            </TabsTrigger>
            <TabsTrigger value="children">
              <Users className="w-4 h-4 mr-2" />
              Crianças
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CheckSquare className="w-4 h-4 mr-2" />
              Frequência
            </TabsTrigger>
          </TabsList>

          {/* Work Groups Tab */}
          <TabsContent value="work-groups">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Grupos de Trabalho</CardTitle>
                    <CardDescription>Gerenciar grupos de trabalho do EBI</CardDescription>
                  </div>
                  <Dialog open={workGroupDialog} onOpenChange={setWorkGroupDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingWorkGroup(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Grupo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingWorkGroup ? 'Editar Grupo de Trabalho' : 'Novo Grupo de Trabalho'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleWorkGroupSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nome do Grupo</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingWorkGroup?.name}
                            required
                            placeholder="Ex: Berçário, Maternal, Jardim..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={editingWorkGroup?.description}
                            placeholder="Descrição do grupo de trabalho"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ageRange">Faixa Etária</Label>
                          <Input
                            id="ageRange"
                            name="ageRange"
                            defaultValue={editingWorkGroup?.ageRange}
                            required
                            placeholder="Ex: 0-2 anos, 3-5 anos..."
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingWorkGroup ? 'Atualizar' : 'Criar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Faixa Etária</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.ageRange}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingWorkGroup(group);
                                setWorkGroupDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWorkGroup(group.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Membros do EBI</CardTitle>
                    <CardDescription>Gerenciar colaboradores do EBI</CardDescription>
                  </div>
                  <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingMember(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Membro
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingMember ? 'Editar Membro' : 'Novo Membro'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleMemberSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingMember?.name}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="workGroupId">Grupo de Trabalho</Label>
                          <Select
                            name="workGroupId"
                            defaultValue={editingMember?.workGroups[0]}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {workGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="role">Função</Label>
                          <Input
                            id="role"
                            name="role"
                            defaultValue={editingMember?.role}
                            required
                            placeholder="Ex: Coordenador, Auxiliar..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact">Telefone</Label>
                          <Input
                            id="contact"
                            name="contact"
                            defaultValue={editingMember?.contact}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingMember ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo de Trabalho</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          {workGroups.find(g => g.id === member.workGroups[0])?.name || '-'}
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.contact}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingMember(member);
                                setMemberDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Atividades</CardTitle>
                    <CardDescription>Cadastrar atividades com tema e objetivo</CardDescription>
                  </div>
                  <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingActivity(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Atividade
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleActivitySubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="workGroupId">Grupo de Trabalho</Label>
                          <Select
                            name="workGroupId"
                            defaultValue={editingActivity?.workGroupId}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {workGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="date">Data</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={editingActivity?.date ? format(editingActivity.date, 'yyyy-MM-dd') : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="theme">Tema</Label>
                          <Input
                            id="theme"
                            name="theme"
                            defaultValue={editingActivity?.theme}
                            required
                            placeholder="Tema da atividade"
                          />
                        </div>
                        <div>
                          <Label htmlFor="objective">Objetivo</Label>
                          <Textarea
                            id="objective"
                            name="objective"
                            defaultValue={editingActivity?.objective}
                            required
                            placeholder="Objetivo da atividade"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingActivity ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Tema</TableHead>
                      <TableHead>Objetivo</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {format(activity.date, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {workGroups.find(g => g.id === activity.workGroupId)?.name || '-'}
                        </TableCell>
                        <TableCell className="font-medium">{activity.theme}</TableCell>
                        <TableCell>{activity.objective}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingActivity(activity);
                                setActivityDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteActivity(activity.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Children Tab */}
          <TabsContent value="children">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Crianças</CardTitle>
                    <CardDescription>Cadastro de crianças do EBI</CardDescription>
                  </div>
                  <Dialog open={childDialog} onOpenChange={setChildDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingChild(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Criança
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingChild ? 'Editar Criança' : 'Nova Criança'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleChildSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Nome da Criança</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingChild?.name}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="workGroupId">Grupo de Trabalho</Label>
                          <Select
                            name="workGroupId"
                            defaultValue={editingChild?.workGroupId}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {workGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="age">Idade</Label>
                          <Input
                            id="age"
                            name="age"
                            type="number"
                            defaultValue={editingChild?.age}
                            required
                            min="0"
                            max="18"
                          />
                        </div>
                        <div>
                          <Label htmlFor="responsibleName">Nome do Responsável</Label>
                          <Input
                            id="responsibleName"
                            name="responsibleName"
                            defaultValue={editingChild?.responsibleName}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="responsibleContact">Telefone do Responsável</Label>
                          <Input
                            id="responsibleContact"
                            name="responsibleContact"
                            defaultValue={editingChild?.responsibleContact}
                            required
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingChild ? 'Atualizar' : 'Cadastrar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell className="font-medium">{child.name}</TableCell>
                        <TableCell>
                          {workGroups.find(g => g.id === child.workGroupId)?.name || '-'}
                        </TableCell>
                        <TableCell>{child.age} anos</TableCell>
                        <TableCell>{child.responsibleName}</TableCell>
                        <TableCell>{child.responsibleContact}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingChild(child);
                                setChildDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteChild(child.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Frequência</CardTitle>
                    <CardDescription>Lançar frequência das crianças</CardDescription>
                  </div>
                  <Dialog open={attendanceDialog} onOpenChange={setAttendanceDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingAttendance(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Lançar Frequência
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingAttendance ? 'Editar Frequência' : 'Lançar Frequência'}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="workGroupId">Grupo de Trabalho</Label>
                          <Select
                            name="workGroupId"
                            defaultValue={editingAttendance?.workGroupId}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {workGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="date">Data</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={editingAttendance?.date ? format(editingAttendance.date, 'yyyy-MM-dd') : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="presentCount">Presentes</Label>
                          <Input
                            id="presentCount"
                            name="presentCount"
                            type="number"
                            defaultValue={editingAttendance?.totalPresent || 0}
                            required
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="absentCount">Ausentes</Label>
                          <Input
                            id="absentCount"
                            name="absentCount"
                            type="number"
                            defaultValue={editingAttendance?.totalAbsent || 0}
                            required
                            min="0"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingAttendance ? 'Atualizar' : 'Lançar'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Presentes</TableHead>
                      <TableHead>Ausentes</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>
                          {format(attendance.date, 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {workGroups.find(g => g.id === attendance.workGroupId)?.name || '-'}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {attendance.totalPresent}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {attendance.totalAbsent}
                        </TableCell>
                        <TableCell className="font-medium">
                          {attendance.totalPresent + attendance.totalAbsent}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingAttendance(attendance);
                                setAttendanceDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAttendance(attendance.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedCongregation && !congregationsLoading && (
        <Card>
          <CardContent className="pt-8 text-center text-muted-foreground">
            Selecione uma congregação para gerenciar o EBI
          </CardContent>
        </Card>
      )}
    </div>
  );
}
