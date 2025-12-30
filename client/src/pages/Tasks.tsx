import React, { useEffect, useState } from 'react';
import { Tarea, Usuario, RolUsuario, EstadoTarea, Proyecto } from '../types';
import { MockService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MoreHorizontal, Plus, X, AlertTriangle, Briefcase, Clock, Filter, Link as LinkIcon, CheckCircle, Layers, Calendar, Edit2, Lock } from 'lucide-react';

interface TasksProps {
    user: Usuario;
}

export const Tasks: React.FC<TasksProps> = ({ user }) => {
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Tarea[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [viewMode, setViewMode] = useState<'project' | 'area' | 'weekly'>('project'); 
    
    // Auxiliary Data
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [collaborators, setCollaborators] = useState<Usuario[]>([]);
    const [projectTasks, setProjectTasks] = useState<Tarea[]>([]);

    // Modals
    const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
    const [hoursInput, setHoursInput] = useState<number>(0);
    const [showHoursModal, setShowHoursModal] = useState(false);
    
    // Create/Edit Task State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [taskForm, setTaskForm] = useState({
        id_tarea: 0,
        titulo: '',
        descripcion: '',
        fecha_programada: new Date().toISOString().split('T')[0],
        horas_estimadas: 0,
        projectId: 0,
        id_colaborador: 0,
        es_emergencia: false,
        id_tarea_dependiente: undefined as number | undefined
    });

    const isCollaborator = user.id_rol === RolUsuario.COLABORADOR;
    const isManager = user.id_rol === RolUsuario.JEFE_AREA || user.id_rol === RolUsuario.ADMINISTRADOR;

    useEffect(() => {
        loadTasks();
        loadAuxData();
    }, [user]);

    useEffect(() => {
        if (taskForm.projectId) {
            const pTasks = tasks.filter(t => t.id_planificacion === taskForm.projectId);
            setProjectTasks(pTasks);
        } else {
            setProjectTasks([]);
        }
    }, [taskForm.projectId, tasks]);

    const loadTasks = () => {
        MockService.getTasks(user.id_usuario, user.id_rol).then(setTasks);
    };

    const loadAuxData = async () => {
        const p = await MockService.getProjects();
        setProjects(p);
        const u = await MockService.getUsers();
        setCollaborators(u.filter(user => user.id_rol === RolUsuario.COLABORADOR));
    };

    const handleStatusChange = (taskId: number, newStatus: EstadoTarea) => {
        MockService.updateTaskStatus(taskId, newStatus).then(() => {
            loadTasks();
            if (newStatus === EstadoTarea.POR_APROBAR) {
                showToast('Tarea enviada a revisión. El Jefe de Área debe aprobar la finalización.', 'success');
            }
        }).catch(err => showToast('Error al cambiar estado: ' + err.message, 'error'));
    };

    const handleRegisterHours = () => {
        if (!selectedTask || hoursInput <= 0) return;

        MockService.registerHours({
            id_tarea: selectedTask.id_tarea,
            id_usuario: user.id_usuario,
            horas_registradas: hoursInput
        }).then(() => {
            loadTasks();
            setShowHoursModal(false);
            setHoursInput(0);
            showToast('Avance registrado correctamente. Pendiente de validación por Jefe de Área.', 'success');
        });
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setTaskForm({
            id_tarea: 0,
            titulo: '',
            descripcion: '',
            fecha_programada: new Date().toISOString().split('T')[0],
            horas_estimadas: 0,
            projectId: 0,
            id_colaborador: isCollaborator ? user.id_usuario : 0,
            es_emergencia: isCollaborator,
            id_tarea_dependiente: undefined
        });
        setShowCreateModal(true);
    };

    const openEditModal = (task: Tarea) => {
        setIsEditing(true);
        setTaskForm({
            id_tarea: task.id_tarea,
            titulo: task.titulo,
            descripcion: task.descripcion,
            fecha_programada: task.fecha_programada,
            horas_estimadas: task.horas_estimadas,
            projectId: task.id_planificacion,
            id_colaborador: task.id_colaborador,
            es_emergencia: task.es_emergencia || false,
            id_tarea_dependiente: task.id_tarea_dependiente
        });
        setShowCreateModal(true);
    };

    const handleSaveTask = (e: React.FormEvent) => {
        e.preventDefault();
        
        const taskData = {
            ...taskForm,
            id_colaborador: isCollaborator ? user.id_usuario : taskForm.id_colaborador,
            es_emergencia: isCollaborator ? true : taskForm.es_emergencia
        };

        if (isEditing) {
             MockService.getTaskById(taskForm.id_tarea).then(existing => {
                if(existing) {
                    const updated = { ...existing, ...taskData, id_planificacion: taskData.projectId };
                    MockService.updateTask(updated)
                        .then(() => {
                            loadTasks();
                            setShowCreateModal(false);
                        })
                        .catch(err => showToast('Error al actualizar tarea: ' + err.message, 'error'));
                }
             }).catch(err => showToast('Error al obtener tarea: ' + err.message, 'error'));
        } else {
            if (!taskData.projectId) {
                showToast('Debe seleccionar un proyecto.', 'error');
                return;
            }
            if (!taskData.id_colaborador) {
                showToast('Debe asignar un colaborador.', 'error');
                return;
            }

            if (taskData.titulo) {
                MockService.createTask(taskData)
                    .then(() => {
                        loadTasks();
                        setShowCreateModal(false);
                    })
                    .catch(err => showToast('Error al crear tarea: ' + err.message, 'error'));
            } else {
                showToast('El título es obligatorio.', 'error');
            }
        }
    };

    const filteredTasks = tasks.filter(t => showHistory ? true : t.estado !== EstadoTarea.COMPLETADA);

    // Grouping Logic
    const getWeekBucket = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        
        const taskDate = new Date(dateStr);
        if (taskDate < startOfWeek) return 'Atrasadas / Semanas Anteriores';
        if (taskDate > endOfWeek) return 'Próximas Semanas';
        return 'Semana Actual';
    };

    const groupedTasks = filteredTasks.reduce((acc, task) => {
        let key = '';
        if (viewMode === 'project') key = task.proyecto_nombre || 'General / Sin Proyecto';
        else if (viewMode === 'area') key = task.colaborador_area || 'Sin Área';
        else if (viewMode === 'weekly') key = getWeekBucket(task.fecha_programada);

        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(task);
        return acc;
    }, {} as Record<string, Tarea[]>);

    // Sort keys for weekly view
    let sortedKeys = Object.keys(groupedTasks);
    if(viewMode === 'weekly') {
        const order = ['Atrasadas / Semanas Anteriores', 'Semana Actual', 'Próximas Semanas'];
        sortedKeys = sortedKeys.sort((a,b) => order.indexOf(a) - order.indexOf(b));
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isCollaborator ? 'Mis Tareas Asignadas' : 'Planificación de Tareas'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isCollaborator 
                            ? 'Gestiona tus actividades pendientes. Dale a "Iniciar" para comenzar.' 
                            : 'Asigna tareas, define tiempos y visualiza la carga por áreas o proyectos.'}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex">
                        <button onClick={() => setViewMode('project')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${viewMode === 'project' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Briefcase size={14} className="mr-1"/> <span className="hidden sm:inline">Proyecto</span>
                        </button>
                        <button onClick={() => setViewMode('area')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${viewMode === 'area' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Layers size={14} className="mr-1"/> <span className="hidden sm:inline">Área</span>
                        </button>
                        <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center ${viewMode === 'weekly' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'text-gray-500 dark:text-gray-400'}`}>
                            <Calendar size={14} className="mr-1"/> <span className="hidden sm:inline">Semanal</span>
                        </button>
                    </div>

                    <label className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                        <input type="checkbox" checked={showHistory} onChange={e => setShowHistory(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center"><CheckCircle size={16} className="mr-1 text-gray-400"/> Historial</span>
                    </label>

                    <button 
                        onClick={openCreateModal}
                        className={`flex items-center px-4 py-2 text-white rounded-lg shadow-sm transition-colors ${isCollaborator ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-700 hover:bg-red-800'}`}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {isCollaborator ? 'Registrar No Previsto' : 'Nueva Tarea'}
                    </button>
                </div>
            </div>

            {sortedKeys.length > 0 ? (
                sortedKeys.map((groupName) => (
                    <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold text-lg">
                                {viewMode === 'project' && <Briefcase className="w-5 h-5 mr-2 text-red-700 dark:text-red-400" />}
                                {viewMode === 'area' && <Layers className="w-5 h-5 mr-2 text-blue-700 dark:text-blue-400" />}
                                {viewMode === 'weekly' && <Calendar className="w-5 h-5 mr-2 text-emerald-700 dark:text-emerald-400" />}
                                {groupName}
                            </div>
                            <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full">
                                {groupedTasks[groupName].length} Tareas
                            </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 text-xs text-gray-400 uppercase">
                                        <th className="px-6 py-3 font-medium">Tarea</th>
                                        <th className="px-6 py-3 font-medium">Asignado</th>
                                        {viewMode !== 'project' && <th className="px-6 py-3 font-medium">Proyecto</th>}
                                        <th className="px-6 py-3 font-medium">Horas</th>
                                        <th className="px-6 py-3 font-medium">Vencimiento</th>
                                        <th className="px-6 py-3 font-medium">Estado</th>
                                        <th className="px-6 py-3 font-medium">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                    {groupedTasks[groupName].map((task) => (
                                        <tr key={task.id_tarea} className={`hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${task.es_emergencia ? 'bg-orange-50/40 dark:bg-orange-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start">
                                                    {task.es_emergencia && <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-2 mt-1" />}
                                                    <div>
                                                        <div className={`font-medium ${task.es_emergencia ? 'text-orange-800 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'} ${task.estado === EstadoTarea.COMPLETADA ? 'line-through decoration-slate-400' : ''}`}>
                                                            {task.titulo}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.descripcion}</div>
                                                        {task.id_tarea_dependiente && (
                                                            <div className="flex items-center text-[10px] text-blue-600 dark:text-blue-300 mt-1 bg-blue-50 dark:bg-blue-900/30 w-fit px-1 rounded">
                                                                <LinkIcon size={10} className="mr-1"/> Dep: #{task.id_tarea_dependiente}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{task.colaborador_nombre}</span>
                                                    <span className="text-xs text-gray-400">{task.colaborador_area}</span>
                                                </div>
                                            </td>
                                            {viewMode !== 'project' && <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{task.proyecto_nombre}</td>}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-sm mb-1">
                                                    <span className="font-bold text-gray-900 dark:text-gray-200 mr-1">{task.horas_reales}h</span>
                                                    <span className="text-gray-500 text-xs">/ {task.horas_estimadas}h</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full">
                                                    <div className={`h-1.5 rounded-full ${task.horas_reales > task.horas_estimadas ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (task.horas_reales / (task.horas_estimadas || 1)) * 100)}%` }} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{task.fecha_programada}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${task.estado === EstadoTarea.COMPLETADA ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                                      task.estado === EstadoTarea.EN_PROGRESO ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                                                      task.estado === EstadoTarea.POR_APROBAR ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                                                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                                    {task.estado}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {/* Manager Edit Button - HIDDEN IF IN PROGRESS OR COMPLETED */}
                                                    {isManager && task.estado === EstadoTarea.PENDIENTE && (
                                                        <button onClick={() => openEditModal(task)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 rounded" title="Editar Tarea">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                    
                                                    {/* Show lock icon if in progress/completed for manager */}
                                                    {isManager && task.estado !== EstadoTarea.PENDIENTE && (
                                                        <span title="Edición bloqueada (En Progreso/Completada)" className="text-gray-300 dark:text-gray-600">
                                                            <Lock size={16} />
                                                        </span>
                                                    )}

                                                    {/* Manager Actions for Approval */}
                                                    {isManager && task.estado === EstadoTarea.POR_APROBAR && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(task.id_tarea, EstadoTarea.COMPLETADA)} className="text-white bg-green-600 hover:bg-green-700 text-xs font-medium px-3 py-1 rounded shadow-sm mr-2" title="Aprobar Finalización">
                                                                Aprobar
                                                            </button>
                                                            <button onClick={() => handleStatusChange(task.id_tarea, EstadoTarea.EN_PROGRESO)} className="text-white bg-red-600 hover:bg-red-700 text-xs font-medium px-3 py-1 rounded shadow-sm" title="Rechazar (Devolver a Progreso)">
                                                                Rechazar
                                                            </button>
                                                        </>
                                                    )}

                                                    {isCollaborator && task.estado !== EstadoTarea.COMPLETADA && task.estado !== EstadoTarea.POR_APROBAR && (
                                                        <>
                                                            {task.estado === EstadoTarea.PENDIENTE && (
                                                                <button onClick={() => handleStatusChange(task.id_tarea, EstadoTarea.EN_PROGRESO)} className="text-white bg-blue-600 hover:bg-blue-700 text-xs font-medium px-3 py-1 rounded shadow-sm">
                                                                    Iniciar
                                                                </button>
                                                            )}
                                                            {task.estado === EstadoTarea.EN_PROGRESO && (
                                                                <>
                                                                    <button onClick={() => { setSelectedTask(task); setShowHoursModal(true); }} className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-slate-700" title="Reportar Horas">
                                                                        <Clock className="w-3 h-3"/>
                                                                    </button>
                                                                    <button onClick={() => handleStatusChange(task.id_tarea, EstadoTarea.POR_APROBAR)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-slate-700" title="Solicitar Finalización">
                                                                        <CheckCircle className="w-3 h-3"/>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {isCollaborator && task.estado === EstadoTarea.POR_APROBAR && (
                                                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                            En Revisión
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No hay tareas visibles para esta vista.</p>
                </div>
            )}

            {/* Modal Create / Edit */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                         <div className={`px-6 py-4 flex justify-between items-center text-white shrink-0 ${isCollaborator ? 'bg-orange-600' : 'bg-red-700'}`}>
                            <h3 className="font-bold text-lg flex items-center">
                                {isEditing ? 'Editar Tarea' : (isCollaborator ? 'Registrar No Previsto' : 'Nueva Tarea Planificada')}
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSaveTask} className="p-6 space-y-4 overflow-y-auto">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Tarea</label>
                                <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                    value={taskForm.titulo} onChange={e => setTaskForm({...taskForm, titulo: e.target.value})} placeholder="Ej: Vaciado de concreto"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700" rows={2}
                                    value={taskForm.descripcion} onChange={e => setTaskForm({...taskForm, descripcion: e.target.value})} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto</label>
                                    <select required className="w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: Number(e.target.value)})}>
                                        <option value={0}>Seleccionar Proyecto</option>
                                        {projects.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.nombre}</option>)}
                                    </select>
                                </div>
                                {taskForm.projectId !== 0 && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center"><LinkIcon size={14} className="mr-1"/> Dependencia</label>
                                        <select className="w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={taskForm.id_tarea_dependiente || ''} onChange={e => setTaskForm({...taskForm, id_tarea_dependiente: e.target.value ? Number(e.target.value) : undefined})}>
                                            <option value="">Ninguna</option>
                                            {projectTasks.filter(t => t.id_tarea !== taskForm.id_tarea).map(t => <option key={t.id_tarea} value={t.id_tarea}>#{t.id_tarea} - {t.titulo}</option>)}
                                        </select>
                                    </div>
                                )}
                                {isManager && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asignar a</label>
                                        <select required className="w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                            value={taskForm.id_colaborador} onChange={e => setTaskForm({...taskForm, id_colaborador: Number(e.target.value)})}>
                                            <option value={0}>Seleccionar Colaborador</option>
                                            {collaborators.map(c => <option key={c.id_usuario} value={c.id_usuario}>{c.nombre} {c.apellido} - {c.area_nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Programada</label>
                                    <input required type="date" className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                        value={taskForm.fecha_programada} onChange={e => setTaskForm({...taskForm, fecha_programada: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas Est.</label>
                                    <input required type="number" min="1" className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                        value={taskForm.horas_estimadas} onChange={e => setTaskForm({...taskForm, horas_estimadas: Number(e.target.value)})} />
                                </div>
                            </div>
                             {isManager && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-900 flex items-start space-x-3">
                                    <div className="flex items-center h-5">
                                        <input id="emergency" type="checkbox" className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                                            checked={taskForm.es_emergencia} onChange={e => setTaskForm({...taskForm, es_emergencia: e.target.checked})} />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="emergency" className="font-medium text-red-800 dark:text-red-300 text-sm">Emergencia / No Prevista</label>
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">Cancelar</button>
                                <button type="submit" className={`px-4 py-2 text-white rounded-md ${isCollaborator ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-700 hover:bg-red-800'}`}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
             {showHoursModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Registrar Horas Reales</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas Ejecutadas</label>
                            <input type="number" min="0.5" step="0.5" className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700"
                                value={hoursInput} onChange={(e) => setHoursInput(parseFloat(e.target.value))} autoFocus />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setShowHoursModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">Cancelar</button>
                            <button onClick={handleRegisterHours} className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800">Registrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};