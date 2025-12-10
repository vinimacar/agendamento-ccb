import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Users, Calendar, Edit, Loader2, Music } from 'lucide-react';
import { congregationService, CongregationData } from '@/services/congregationService';
import { useToast } from '@/hooks/use-toast';

export default function CongregationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [congregation, setCongregation] = useState<CongregationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCongregation = async () => {
      if (!id) return;
      try {
        const data = await congregationService.getById(id);
        if (data) {
          setCongregation(data);
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
        setLoading(false);
      }
    };

    loadCongregation();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!congregation) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/congregations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{congregation.name}</h1>
              <p className="text-muted-foreground mt-1">Detalhes da congregação</p>
            </div>
          </div>
          <Link to={`/congregations/${id}/edit`}>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>

        {/* Endereço */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-foreground">
              {congregation.street}, {congregation.number}
            </p>
            <p className="text-foreground">
              {congregation.neighborhood}
            </p>
            <p className="text-foreground">
              {congregation.city} - {congregation.state}
            </p>
            <div className="pt-2">
              <Badge variant="outline">{congregation.admin}</Badge>
              <Badge variant="outline" className="ml-2">{congregation.regional}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Anciãos e Cooperadores */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Ministério
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {congregation.elders && congregation.elders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {congregation.elders.length === 1 ? 'Ancião' : 'Anciães'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.elders.map((elder, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 px-3 py-1 transition-colors duration-200">
                      {elder.name} {elder.isLocal && '(Local)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {congregation.officeCooperators && congregation.officeCooperators.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Cooperadores do Ofício</h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.officeCooperators.map((coop, i) => (
                    <Badge key={i} variant="secondary">
                      {coop.name} {coop.isLocal && '(Local)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {congregation.youthCooperators && congregation.youthCooperators.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Cooperadores de Jovens</h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.youthCooperators.map((coop, i) => (
                    <Badge key={i} variant="outline">
                      {coop.name} {coop.isLocal && '(Local)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {congregation.deacons && congregation.deacons.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Diáconos</h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.deacons.map((deacon, i) => (
                    <Badge key={i} variant="outline">
                      {deacon.name} {deacon.isLocal && '(Local)'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {congregation.regionalSupervisor && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Encarregado Regional</h3>
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                  {congregation.regionalSupervisor.name}
                </Badge>
              </div>
            )}

            {congregation.localSupervisor && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Encarregado Local</h3>
                <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                  {congregation.localSupervisor}
                </Badge>
              </div>
            )}

            {congregation.examiner && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Examinador</h3>
                <Badge variant="secondary">
                  {congregation.examiner.name}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cultos e RJM */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Dias de Culto e RJM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {congregation.worshipDays && congregation.worshipDays.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Dias de Culto Oficial</h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.worshipDays.map((day, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary hover:bg-primary/20">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {congregation.rjmDays && congregation.rjmDays.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Dias de RJM</h3>
                <div className="flex flex-wrap gap-2">
                  {congregation.rjmDays.map((day, i) => (
                    <Badge key={i} variant="secondary">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ensaios */}
        {congregation.rehearsals && congregation.rehearsals.length > 0 && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Music className="h-5 w-5 text-primary" />
                Ensaios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {congregation.rehearsals.map((rehearsal, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{rehearsal.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {rehearsal.day} às {rehearsal.time}
                      </p>
                    </div>
                    {rehearsal.repeats && (
                      <Badge variant="outline" className="text-xs">
                        Semanal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
