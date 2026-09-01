import React, { ReactNode, useState } from 'react';
import {
  GraduationCap, LogOut, Menu, X,
  LayoutDashboard, FileText, Bell, Users,
  Settings, BarChart2, ChevronRight, Wallet, Briefcase,
  CreditCard, FileSignature, Paperclip, MapPin, TrendingUp, FolderKanban
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback } from './ui/avatar';
import ttuLogo from '../../assets/TTU LOGO.jpg';

type DashboardTitle = string;

interface DashboardLayoutProps {
  children: ReactNode;
  title: DashboardTitle;
}

const navItems: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; href: string }[]> = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/student' },
    { label: 'Progress History', icon: TrendingUp, href: '/student/progress' },
    { label: 'Your Reports Uploaded', icon: FileText, href: '/student/your-reports-uploaded' },
    { label: 'Daily report log', icon: FolderKanban, href: '/student/daily-report-log' },
    { label: 'Notifications', icon: Bell, href: '/student' },
  ],
  supervisor: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/supervisor' },
    { label: 'Locations & Attendance', icon: MapPin, href: '/supervisor/locations' },
    { label: 'Students', icon: Users, href: '/supervisor' },
    { label: 'Reports', icon: FileText, href: '/supervisor' },
    { label: 'Analytics', icon: BarChart2, href: '/supervisor' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Locations', icon: MapPin, href: '/supervisor/locations' },
    { label: 'Users', icon: Users, href: '/admin' },
    { label: 'Reports', icon: FileText, href: '/admin' },
    { label: 'Analytics', icon: BarChart2, href: '/admin' },
    { label: 'Settings', icon: Settings, href: '/admin' },
  ],
};


const financeItems = [
  { label: 'Log Book Payment', icon: CreditCard, href: '/student/services/fee-payments' },
  { label: 'Daily report log', icon: FileText, href: '/student/uploaded-reports' },
];

const liaisonItems = [
  { label: 'Attachment Letter', icon: Paperclip, href: '/student/services/attachment-letter' },
  { label: 'Assumption Form', icon: FileSignature, href: '/student/services/assumption-form' },
];

const roleConfig: Record<string, { label: string; color: string }> = {
  student: { label: 'Student', color: 'bg-blue-100 text-blue-700' },
  supervisor: { label: 'Supervisor', color: 'bg-green-100 text-green-700' },
  admin: { label: 'Administrator', color: 'bg-violet-100 text-violet-700' },
};

export function DashboardLayout({ children, title }: DashboardLayoutProps): React.ReactElement {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [liaisonOpen, setLiaisonOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const getInitials = (name: string) =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const role = user?.role || 'student';
  const items = navItems[role] || navItems.student;
  const rc = roleConfig[role] || roleConfig.student;

  return (
    <div className="min-h-screen bg-background flex">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-60 flex flex-col
          bg-sidebar text-sidebar-foreground shadow-2xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-20 border-b border-sidebar-border shrink-0 gap-3">
          <div className="flex-1 h-14 bg-white rounded-lg flex items-center justify-center p-2 shadow-xs">
            <img src={ttuLogo} alt="TTU Logo" className="max-w-full h-full object-contain" />
          </div>
          <button
            title="Close sidebar"
            className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">

          {items.map((item) => {
            if (item.label === 'Notifications') return null;
            const Icon = item.icon;
            const active = item.label === 'Dashboard' && location.pathname === item.href;
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 text-left
                  ${active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-sidebar-accent'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </button>
            );
          })}

          {role === 'student' && (
            <div className="pt-2">
              <button
                onClick={() => setFinanceOpen(open => !open)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-sidebar-accent transition-all duration-150 text-left mt-1"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span className="flex-1">Finance</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${financeOpen ? 'rotate-90' : ''}`} />
              </button>
              {financeOpen && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {financeItems.map(item => {
                    const ItemIcon = item.icon;
                    const active = location.pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${active ? 'bg-primary text-white' : 'text-white/55 hover:text-white hover:bg-sidebar-accent'}`}
                      >
                        <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => setLiaisonOpen(open => !open)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-sidebar-accent transition-all duration-150 text-left mt-1"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="flex-1">Industrial Liaison</span>
                <ChevronRight className={`w-3 h-3 transition-transform ${liaisonOpen ? 'rotate-90' : ''}`} />
              </button>
              {liaisonOpen && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {liaisonItems.map(item => {
                    const ItemIcon = item.icon;
                    const active = location.pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${active ? 'bg-primary text-white' : 'text-white/55 hover:text-white hover:bg-sidebar-accent'}`}
                      >
                        <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {items.map((item) => {
            if (item.label !== 'Notifications') return null;
            const Icon = item.icon;
            const active = location.pathname === item.href;
            return (
              <button
                key={item.label}
                onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 text-left
                  ${active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-sidebar-accent'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent mb-1">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-primary text-white">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${rc.color}`}>
                {rc.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-sidebar-accent transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>



      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 bg-white dark:bg-card border-b border-border flex items-center px-3 sm:px-6 gap-3 shadow-xs">
          <button
            title="Open sidebar"
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <NotificationCenter />
          </div>
        </header>

        {/* Breadcrumb bar */}
        <div className="bg-background border-b border-border px-3 sm:px-6 py-2 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="shrink-0">TTU Portal</span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-foreground font-medium truncate">{title}</span>
        </div>

        {/* Content */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 page-enter overflow-y-auto overflow-x-hidden safe-bottom">
          {children}
        </main>

        <footer className="border-t border-border bg-white dark:bg-card py-2.5 px-4 sm:px-6 text-center text-xs text-muted-foreground">
          © 2026 Takoradi Technical University — Industrial Attachment Assessment Portal
        </footer>
      </div>
    </div>
  );
}





