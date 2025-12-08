import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas preferências e conta</p>
        </div>

        {/* Profile Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Perfil</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="gradient-primary text-primary-foreground hover:opacity-90">
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <h2 className="text-lg font-semibold text-foreground mb-4">Segurança</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Autenticação</p>
                  <p className="text-sm text-muted-foreground">Email e senha</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Usuários do Sistema</h2>
            <Button variant="outline" size="sm">
              Convidar Usuário
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie os usuários que têm acesso ao sistema administrativo.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
