import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MapPin, Users, MoreVertical, Edit, Trash2, Loader2, Calendar, Music, Building2, ChevronRight } from 'lucide-react';
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCongregations.map((congregation) => (
            <div
              key={congregation.id}
              className="group bg-card rounded-2xl shadow-md border border-border/40 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-border/40">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate">{congregation.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {congregation.city}/{congregation.state}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/congregations/${congregation.id}/edit`} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive cursor-pointer"
                        onClick={() => setDeleteId(congregation.id!)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {congregation.neighborhood && (
                  <p className="text-sm text-muted-foreground">{congregation.neighborhood}</p>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {congregation.admin && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Administração</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{congregation.admin}</p>
                    </div>
                  </div>
                )}

                {congregation.elders && congregation.elders.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {congregation.elders.length === 1 ? 'Ancião Local' : 'Anciães Locais'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {congregation.elders.slice(0, 3).map((elder, i) => (
                        <Badge 
                          key={i}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {elder.name}
                        </Badge>
                      ))}
                      {congregation.elders.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{congregation.elders.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Schedule info */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {congregation.schedules && congregation.schedules.filter(s => s.type === 'culto').length > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Cultos</p>
                        <p className="text-sm font-semibold text-foreground">
                          {congregation.schedules.filter(s => s.type === 'culto').length}
                        </p>
                      </div>
                    </div>
                  )}
                  {congregation.rehearsals && congregation.rehearsals.length > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-secondary/5">
                      <Music className="h-4 w-4 text-secondary-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ensaios</p>
                        <p className="text-sm font-semibold text-foreground">
                          {congregation.rehearsals.length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Link to={`/congregations/${congregation.id}/edit`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                  >
                    <span>Editar Congregação</span>
                    <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
