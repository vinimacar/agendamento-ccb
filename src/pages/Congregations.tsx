import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Users, MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCongregations } from '@/hooks/useCongregations';
import { useToast } from '@/hooks/use-toast';

export default function Congregations() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { congregations, loading, error, deleteCongregation, refetch } = useCongregations();
  const { toast } = useToast();

  const filteredCongregations = congregations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.neighborhood.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      await deleteCongregation(deleteId);
      toast({
        title: 'Congregação excluída',
        description: 'A congregação foi removida com sucesso.',
      });
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a congregação.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando congregações...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch}>Tentar novamente</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Congregações</h1>
            <p className="text-muted-foreground mt-1">
              {congregations.length} congregação(ões) cadastrada(s)
            </p>
          </div>
          <Link to="/congregations/new">
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" />
              Nova Congregação
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCongregations.map((congregation) => (
            <div
              key={congregation.id}
              className="bg-card rounded-xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{congregation.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {congregation.neighborhood ? `${congregation.neighborhood}, ` : ''}
                      {congregation.city} - {congregation.state}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/congregations/${congregation.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeleteId(congregation.id!)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                {congregation.admin && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Administração:</span>
                    <span className="ml-2 text-foreground">{congregation.admin}</span>
                  </div>
                )}
                {congregation.elders && congregation.elders.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      {congregation.elders.length === 1 ? 'Ancião:' : 'Anciães:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {congregation.elders.map((elder, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                        >
                          {elder.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {congregation.worshipDays && congregation.worshipDays.length > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Dias de culto:</span>
                    <span className="ml-2 text-foreground">
                      {congregation.worshipDays.length} dia(s)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <Link to={`/congregations/${congregation.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Detalhes
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredCongregations.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma congregação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Tente ajustar sua busca' : 'Comece cadastrando a primeira congregação'}
            </p>
            <Link to="/congregations/new">
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Nova Congregação
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta congregação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
