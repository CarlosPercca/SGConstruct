import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ClipboardList,
  FileText,
  Bell,
  Check,
  Layers,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';
import { Usuario, Notificacion, RolUsuario } from '../types';
import { MockService } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
  user: Usuario;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: [1, 2, 3] },
    { label: 'Proyectos', path: '/projects', icon: FolderKanban, roles: [1, 2] },
    { label: 'Tareas', path: '/tasks', icon: CheckSquare, roles: [1, 2, 3] },
    { label: 'Validaciones', path: '/validations', icon: ClipboardList, roles: [1, 2] }, 
    { label: 'Reportes', path: '/reports', icon: FileText, roles: [1, 2] },
    { label: 'Usuarios', path: '/users', icon: Users, roles: [1, 2] },
    { label: 'Áreas', path: '/areas', icon: Layers, roles: [1] }, 
    { label: 'Auditoría', path: '/audit', icon: ShieldCheck, roles: [1] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.id_rol));

  useEffect(() => {
    // Apply dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Poll for notifications or load on mount
    MockService.getNotifications(user.id_usuario).then(setNotifications);
    const interval = setInterval(() => {
        MockService.getNotifications(user.id_usuario).then(setNotifications);
    }, 10000); 
    return () => clearInterval(interval);
  }, [user]);

  const toggleTheme = () => {
      setIsDarkMode(!isDarkMode);
  };

  const unreadCount = notifications.filter(n => !n.leido).length;

  const handleMarkRead = (id: number) => {
      MockService.markAsRead(id).then(() => {
          setNotifications(prev => prev.map(n => n.id_notificacion === id ? {...n, leido: true} : n));
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-200">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 text-white transform transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-red-800 dark:bg-red-900">
          <span className="text-xl font-bold text-white tracking-wide">
            S&G Edifica
          </span>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-8rem)]">
          <div className="mb-6 p-4 bg-slate-800 dark:bg-slate-900 rounded-lg border-l-4 border-red-600">
            <p className="text-sm text-slate-400">Bienvenido,</p>
            <p className="font-semibold text-white">{user.nombre} {user.apellido}</p>
            <span className="text-xs px-2 py-1 rounded-full bg-red-900 text-red-100 mt-2 inline-block">
              {user.rol_nombre}
            </span>
          </div>

          <nav className="space-y-1">
            {filteredNav.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700 bg-slate-900 dark:bg-slate-950">
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-red-900/50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 flex items-center px-4 justify-between z-10 transition-colors duration-200">
            <div className="flex items-center lg:hidden">
                 <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200"
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <span className="font-bold text-lg text-red-700 dark:text-red-500 ml-2">S&G Edifica</span>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center space-x-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200 transition-colors"
                    title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notification Bell */}
                <div className="relative mr-4">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-200 relative"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-600 rounded-full border border-white dark:border-slate-800"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Notificaciones</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} nuevas</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id_notificacion} className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 ${!notif.leido ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className={`text-sm ${!notif.leido ? 'font-semibold text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {notif.mensaje}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(notif.fecha_envio).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {!notif.leido && (
                                                    <button onClick={() => handleMarkRead(notif.id_notificacion)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Marcar como leída">
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-400 text-sm">No tienes notificaciones.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-slate-700 text-center text-xs text-gray-400 dark:text-gray-500">
            <p>© {new Date().getFullYear()} SGI-Construct. Todos los derechos reservados.</p>
            <p>Autor: Carlos Alfredo Percca Anchapuri | carlos.percca.13@gmail.com</p>
          </footer>
        </main>
      </div>
    </div>
  );
};