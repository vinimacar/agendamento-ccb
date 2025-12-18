import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Book, Calendar, Users, ChevronRight, Shield, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

  const features = [
    {
      icon: Users,
      title: 'Gestão de Congregações',
      description: 'Cadastre e gerencie todas as congregações com informações completas de ministérios e lideranças.',
    },
    {
      icon: Calendar,
      title: 'Agendamento de Eventos',
      description: 'Organize cultos, batismos, santas-ceias, ordenações e todos os eventos da congregação.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios Completos',
      description: 'Visualize relatórios por ministério, congregação, cidade e dias de culto.',
    },
    {
      icon: Clock,
      title: 'Ensaios e RJM',
      description: 'Controle de ensaios locais, regionais e GEM com regras de repetição.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg">
              <Book className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">agendaccb</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/schedule">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Agendamento
              </Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
              <Shield className="h-4 w-4" />
              Sistema de Gestão para Congregações
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Organize sua congregação com{' '}
              <span className="text-gradient">simplicidade</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Gerencie congregações, eventos, ministérios e muito mais em uma plataforma moderna e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/schedule">
                <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 gap-2 w-full sm:w-auto">
                  Ver Agendamentos
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-primary/30 hover:bg-primary/5">
                  <Shield className="h-4 w-4" />
                  Administração Ituiutaba
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Recursos Completos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar sua congregação em um só lugar.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="gradient-primary rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Pronto para começar?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
                Acesse a área de agendamentos ou faça login para gerenciar sua congregação.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/schedule">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Ver Agendamentos
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">agendaccb</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} agendaccb. Sistema de Gestão para Congregações.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
