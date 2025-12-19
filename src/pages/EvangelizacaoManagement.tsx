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
import { evangelizacaoMemberService } from '@/services/evangelizacaoMemberService';
import type { EvangelizacaoMember } from '@/types';
import { Users, Plus, Trash2, Loader2, Search } from 'lucide-react';

export default function EvangelizacaoManagement() {
  const { toast } = useToast();
  const { congregations, loading: loadingCongregations } = useCongregations();

  // Estados para membros
  const [members, setMembers] = useState<EvangelizacaoMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [filterCongregationId, setFilterCongregationId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberGender, setMemberGender] = useState<'male' | 'female'>('male');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberAge, setMemberAge] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  // Estados para deleção
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);

  // Carregar membros
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await evangelizacaoMemberService.getAll();
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

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async () => {
    if (!selectedCongregationId || !memberName || !memberPhone || !memberAge) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para cadastrar um membro.',
        variant: 'destructive',
      });
      return;
    }

    const congregation = congregations.find(c => c.id === selectedCongregationId);
    if (!congregation) return;

    setSavingMember(true);
    try {
      await evangelizacaoMemberService.create({
        name: memberName,
        gender: memberGender,
        phone: memberPhone,
        age: parseInt(memberAge),
        congregationId: selectedCongregationId,
        congregationName: congregation.name,
        city: congregation.city,
      });

      toast({
        title: 'Membro cadastrado!',
        description: `${memberName} foi cadastrado com sucesso.`,
      });

      // Limpar formulário
      setMemberName('');
      setMemberGender('male');
      setMemberPhone('');
      setMemberAge('');
      setSelectedCongregationId('');
      
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

  const confirmDelete = (member: EvangelizacaoMember) => {
    if (!member.id) return;
    setMemberToDelete({ id: member.id, name: member.name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      await evangelizacaoMemberService.delete(memberToDelete.id);
      
      toast({
        title: 'Membro removido',
        description: `${memberToDelete.name} foi removido com sucesso.`,
      });

      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    }
  };

  // Filtrar membros
  const filteredMembers = members.filter(member => {
    const matchesCongregation = !filterCongregationId || member.congregationId === filterCongregationId;
    const matchesSearch = !searchTerm || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.congregationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCongregation && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Evangelização
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar membros de evangelização
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </Badge>
        </div>

        {/* Card de Cadastro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Cadastrar Membro
            </CardTitle>
            <CardDescription>
              Adicione um novo membro de evangelização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="congregation">Congregação</Label>
                <Select value={selectedCongregationId} onValueChange={setSelectedCongregationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a congregação" />
                  </SelectTrigger>
                  <SelectContent>
                    {congregations.map((congregation) => (
                      <SelectItem key={congregation.id} value={congregation.id}>
                        {congregation.name} - {congregation.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Nome do membro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Sexo</Label>
                <Select value={memberGender} onValueChange={(value: 'male' | 'female') => setMemberGender(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={memberAge}
                  onChange={(e) => setMemberAge(e.target.value)}
                  placeholder="Idade"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="(34) 99999-9999"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleAddMember} disabled={savingMember || loadingCongregations}>
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
            </div>
          </CardContent>
        </Card>

        {/* Lista de Membros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros Cadastrados
              </span>
              <Badge variant="secondary">{filteredMembers.length} membros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Filtrar por Congregação</Label>
                <Select value={filterCongregationId} onValueChange={setFilterCongregationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as congregações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Todas as congregações</SelectItem>
                    {congregations.map((congregation) => (
                      <SelectItem key={congregation.id} value={congregation.id}>
                        {congregation.name} - {congregation.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, congregação ou cidade..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum membro cadastrado
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-left py-3 px-4 font-medium">Sexo</th>
                      <th className="text-left py-3 px-4 font-medium">Idade</th>
                      <th className="text-left py-3 px-4 font-medium">Telefone</th>
                      <th className="text-left py-3 px-4 font-medium">Congregação</th>
                      <th className="text-left py-3 px-4 font-medium">Cidade</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{member.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={member.gender === 'male' ? 'default' : 'secondary'}>
                            {member.gender === 'male' ? 'M' : 'F'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{member.age} anos</td>
                        <td className="py-3 px-4">{member.phone}</td>
                        <td className="py-3 px-4">{member.congregationName}</td>
                        <td className="py-3 px-4">{member.city}</td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(member)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {memberToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
