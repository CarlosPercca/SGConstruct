import React, { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Usuario, Proyecto, RolUsuario, UserStats, Auditoria } from '../types';
import { MockService } from '../services/api';
import { TrendingUp, Clock, AlertCircle, CheckCircle, Briefcase, Search, Users, Activity, FileText } from 'lucide-react';

interface DashboardProps {
  user: Usuario;
}

const COLORS = ['#b91c1c', '#ea580c', '#fbbf24', '#4b5563'];
const STATUS_COLORS = ['#fbbf24', '#3b82f6', '#10b981']; // Pendiente, Progreso, Completada

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<Auditoria[]>([]);
  
  // Chart Data
  const [taskStatusData, setTaskStatusData] = useState<any[]>([]);

  // For Admin/Jefe Drill-down
  const [usersToInspect, setUsersToInspect] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Area Stats (For Jefe de Area view)
  const [areaStats, setAreaStats] = useState({
      colaboradores: 0,
      totalTareasArea: 0,
      pendientesArea: 0,
      eficienciaPromedio: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
      // If a specific user is selected by Admin/Jefe, load their stats
      if (selectedUserId) {
          MockService.getUserStats(selectedUserId).then(setUserStats);
      } else if (user.id_rol === RolUsuario.COLABORADOR) {
          // If logged in as collaborator, load own stats
          MockService.getUserStats(user.id_usuario).then(setUserStats);
      } else {
          setUserStats(null); // Reset to show general dashboard
      }
  }, [selectedUserId, user]);

  const loadData = async () => {
    MockService.getProjects().then(setProjects);
    
    // Fetch recent activity
    MockService.getLogs().then(logs => {
        setRecentLogs(logs.slice(0, 5));
    });
    
    // If Admin or Jefe, load users list and task aggregation
    if (user.id_rol !== RolUsuario.COLABORADOR) {
        // getTasks will filter by Area if user is Jefe
        const tasks = await MockService.getTasks(user.id_usuario, user.id_rol);
        
        // Prepare Pie Chart Data
        const pending = tasks.filter(t => t.estado === 'Pendiente').length;
        const progress = tasks.filter(t => t.estado === 'En Progreso').length;
        const completed = tasks.filter(t => t.estado === 'Completada').length;

        setTaskStatusData([
            { name: 'Pendientes', value: pending },
            { name: 'En Progreso', value: progress },
            { name: 'Completadas', value: completed },
        ]);

        const usersList = await MockService.getUsers(user.id_usuario);
        const collaborators = usersList.filter(u => u.id_rol === RolUsuario.COLABORADOR);
        setUsersToInspect(collaborators);

        // If Jefe de Area, calculate Area Specific Stats
        if (user.id_rol === RolUsuario.JEFE_AREA) {
            const totalTasks = tasks.length;
            const efficiency = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

            setAreaStats({
                colaboradores: collaborators.length,
                totalTareasArea: totalTasks,
                pendientesArea: pending,
                eficienciaPromedio: efficiency
            });
        }
    }
  };

  const isCollaboratorView = user.id_rol === RolUsuario.COLABORADOR || selectedUserId !== null;
  const isJefeArea = user.id_rol === RolUsuario.JEFE_AREA;
  
  // General Stats Logic
  let dashboardStats = [];
  
  if (isJefeArea && !isCollaboratorView) {
      // Stats for Jefe de Area (Team Performance)
      dashboardStats = [
        { label: 'Colaboradores', value: areaStats.colaboradores, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Tareas del Área', value: areaStats.totalTareasArea, icon: Briefcase, color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-slate-700' },
        { label: 'Pendientes Equipo', value: areaStats.pendientesArea, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { label: 'Eficiencia Equipo', value: `${areaStats.eficienciaPromedio}%`, icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
      ];
  } else {
      // Stats for Admin (Global)
      dashboardStats = [
        { label: 'Proyectos Activos', value: projects.length, icon: TrendingUp, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
        { label: 'Total Tareas', value: taskStatusData.reduce((a,b) => a + b.value, 0), icon: Briefcase, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Pendientes', value: taskStatusData.find(d => d.name === 'Pendientes')?.value || 0, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
        { label: 'Completadas', value: taskStatusData.find(d => d.name === 'Completadas')?.value || 0, icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
      ];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-200 dark:border-slate-700 pb-4 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isCollaboratorView 
                    ? `Resumen de Rendimiento` 
                    : (isJefeArea ? 'Supervisión de Área' : 'Dashboard General')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isCollaboratorView
                    ? 'Métricas individuales de eficiencia y cumplimiento.' 
                    : (isJefeArea ? 'Resumen del desempeño de los colaboradores de tu área.' : 'Vista panorámica de proyectos y áreas.')}
            </p>
        </div>
        
        {/* User Selector for Admin/Jefe */}
        {user.id_rol !== RolUsuario.COLABORADOR && (
            <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline">Inspeccionar Colaborador:</span>
                <div className="relative">
                    <select 
                        className="appearance-none bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:border-red-500"
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">-- {isJefeArea ? 'Resumen del Equipo' : 'Vista General'} --</option>
                        {usersToInspect.map(u => (
                            <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} {u.apellido}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                        <Search size={16} />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* COLLABORATOR VIEW (Or Admin/Jefe Inspecting Collaborator) */}
      {isCollaboratorView && userStats ? (
          <div className="space-y-6">
              {/* Personal KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Eficiencia Personal</p>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{userStats.eficiencia}%</h3>
                          </div>
                          <div className={`p-2 rounded-lg ${userStats.eficiencia >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              <TrendingUp className="h-6 w-6" />
                          </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${userStats.eficiencia}%` }}></div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Horas Trabajadas</p>
                              <div className="flex items-baseline mt-2">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.horasTotales}h</h3>
                                <span className="text-sm text-gray-400 ml-2">de {userStats.horasEstimadasTotal}h est.</span>
                              </div>
                          </div>
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                              <Clock className="h-6 w-6" />
                          </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Total acumulado en proyectos activos.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                       <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tareas Pendientes</p>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{userStats.pendientes}</h3>
                          </div>
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                              <Briefcase className="h-6 w-6" />
                          </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-4 font-medium">Requieren atención inmediata.</p>
                  </div>
              </div>

              {/* My Projects Section - Simplified for Mobile */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">Proyectos Asignados</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map(project => (
                              <div key={project.id_proyecto} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 hover:border-red-300 dark:hover:border-red-500 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-gray-900 dark:text-white">{project.nombre}</h4>
                                      <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{project.codigo}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.ubicacion} • {project.estado}</p>
                                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5 mb-2">
                                      <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${project.progreso}%` }}></div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                                      <span>Inicio: {project.fecha_inicio}</span>
                                      <span>Progreso: {project.progreso}%</span>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
              </div>
          </div>
      ) : (
        /* ADMIN / JEFE GENERAL VIEW */
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardStats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    </div>
                </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Progress Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Avance de Proyectos</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projects as any[]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="codigo" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="progreso" fill="#b91c1c" radius={[4, 4, 0, 0]} name="Progreso %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task Status Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Estado de Tareas</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="text-gray-600 dark:text-gray-300">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Budget Distribution */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Presupuesto por Proyecto</h3>
                    <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projects as any[]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="presupuesto"
                                    nameKey="nombre"
                                >
                                    {projects.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Actividad Reciente</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">Últimos 5 registros</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {recentLogs.length > 0 ? (
                            recentLogs.map(log => (
                                <div key={log.id_auditoria} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors border-l-2 border-transparent hover:border-red-500">
                                    <div className="mt-1">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
                                            <Activity size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200">
                                            <span className="font-bold">{log.usuario_nombre}</span> realizó <span className="font-medium text-blue-700 dark:text-blue-400">{log.accion}</span> en <span className="italic">{log.entidad}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.detalle}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 flex items-center">
                                            <Clock size={10} className="mr-1"/> {new Date(log.fecha).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10">No hay actividad reciente.</div>
                        )}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};