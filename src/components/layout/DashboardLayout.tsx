import { Book, Calendar, Users, BarChart3, Settings, Home, LogOut, Menu, X, CalendarCheck, UserPlus, Music, Heart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/congregations', icon: Users, label: 'Congregações' },
  { to: '/events', icon: Calendar, label: 'Eventos' },
  { to: '/reforco-agendamento', icon: CalendarCheck, label: 'Reforços' },
  { to: '/rjm', icon: UserPlus, label: 'RJM' },
  { to: '/musical', icon: Music, label: 'Musical' },
  { to: '/darpe', icon: Heart, label: 'DARPE' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 gradient-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Book className="h-6 w-6 text-primary-foreground" />
          <span className="font-bold text-lg text-primary-foreground">agendaccb</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen w-64 gradient-primary transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full px-4 py-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="p-2 bg-primary-foreground/10 rounded-lg">
              <Book className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-primary-foreground">agendaccb</h1>
              <p className="text-xs text-primary-foreground/70">Sistema de Gestão</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-primary-foreground/80 hover:bg-primary-foreground/10",
                  isActive && "bg-primary-foreground/15 text-primary-foreground font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-primary-foreground/10 pt-4 mt-4">
            <div className="px-3 mb-3">
              <p className="text-sm text-primary-foreground/70">Logado como</p>
              <p className="text-sm font-medium text-primary-foreground truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full justify-start gap-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
