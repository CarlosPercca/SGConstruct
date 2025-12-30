import React, { useEffect, useState } from 'react';
import { Proyecto, Area, HitoProyecto, VersionProyecto, Auditoria } from '../types';
import { MockService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, MapPin, Calendar, DollarSign, X, Eye, Building, Flag, History } from 'lucide-react';

export const Projects: React.FC = () => {
    const { showToast } = useToast();
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
    
    // Details Sub-data
    const [milestones, setMilestones] = useState<HitoProyecto[]>([]);
    const [versions, setVersions] = useState<VersionProyecto[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'hitos' | 'versiones'>('info');

    // Initial state for new project
    const [newProject, setNewProject] = useState<Partial<Proyecto> & { areas_nombres: string[] }>({
        nombre: '', codigo: '', cliente: '', ubicacion: '', presupuesto: 0, 
        fecha_inicio: '', fecha_fin: '', estado: 'Planificado', areas_nombres: []
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        MockService.getProjects().then(setProjects);
        MockService.getAreas().then(setAreas);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProject.nombre && newProject.codigo) {
            MockService.createProject(newProject)
                .then(() => {
                    loadData();
                    setShowModal(false);
                    setNewProject({ 
                        nombre: '', codigo: '', cliente: '', ubicacion: '', presupuesto: 0, 
                        fecha_inicio: '', fecha_fin: '', estado: 'Planificado', areas_nombres: [] 
                    });
                })
                .catch((err) => {
                    console.error('Error creating project:', err);
                    showToast('Error al crear proyecto: ' + err.message, 'error');
                });
        } else {
            showToast('Por favor complete los campos obligatorios (Nombre y Código).', 'error');
        }
    };

    const toggleArea = (areaName: string) => {
        const currentAreas = newProject.areas_nombres || [];
        if (currentAreas.includes(areaName)) {
            setNewProject({ ...newProject, areas_nombres: currentAreas.filter(a => a !== areaName) });
        } else {
            setNewProject({ ...newProject, areas_nombres: [...currentAreas, areaName] });
        }
    };

    const handleViewDetails = (project: Proyecto) => {
        setSelectedProject(project);
        setActiveTab('info');
        setShowDetailModal(true);
        // Load additional info
        MockService.getMilestones(project.id_proyecto).then(setMilestones);
        MockService.getVersions(project.id_proyecto).then(setVersions);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Proyectos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Administra los proyectos, asigna áreas y revisa el progreso.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id_proyecto} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="inline-block px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md mb-2">
                                        {project.codigo}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">{project.nombre}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{project.cliente}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    project.estado === 'En ejecución' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300'
                                }`}>
                                    {project.estado}
                                </span>
                            </div>

                            <div className="space-y-3 mt-4">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <MapPin className="h-4 w-4 mr-3 text-red-400" />
                                    {project.ubicacion}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <Calendar className="h-4 w-4 mr-3 text-red-400" />
                                    {new Date(project.fecha_inicio).toLocaleDateString()} - {project.fecha_fin ? new Date(project.fecha_fin).toLocaleDateString() : '...'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <DollarSign className="h-4 w-4 mr-3 text-red-400" />
                                    S/. {project.presupuesto.toLocaleString()}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {project.areas_nombres?.map(area => (
                                        <span key={area} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">Progreso Físico</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{project.progreso}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                                    <div 
                                        className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${project.progreso}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <button 
                                onClick={() => handleViewDetails(project)}
                                className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Project Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-red-700 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg">Registrar Nuevo Proyecto</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-red-800 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
                                    <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" placeholder="PROY-XXX" 
                                        value={newProject.codigo} onChange={e => setNewProject({...newProject, codigo: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presupuesto</label>
                                    <input required type="number" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" placeholder="0.00" 
                                        value={newProject.presupuesto} onChange={e => setNewProject({...newProject, presupuesto: Number(e.target.value)})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Proyecto</label>
                                <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                    value={newProject.nombre} onChange={e => setNewProject({...newProject, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                                <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                    value={newProject.cliente} onChange={e => setNewProject({...newProject, cliente: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                                <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                    value={newProject.ubicacion} onChange={e => setNewProject({...newProject, ubicacion: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asignar Áreas</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-700 p-3 rounded-md border border-gray-200 dark:border-slate-600">
                                    {areas.map(area => (
                                        <label key={area.id_area} className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={newProject.areas_nombres?.includes(area.nombre) || false}
                                                onChange={() => toggleArea(area.nombre)}
                                                className="rounded text-red-700 focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-200">{area.nombre}</span>
                                        </label>
                                    ))}
                                    {areas.length === 0 && <p className="text-sm text-gray-400 col-span-2">No hay áreas disponibles.</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                                    <input required type="date" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                        value={newProject.fecha_inicio} onChange={e => setNewProject({...newProject, fecha_inicio: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin Estimado</label>
                                    <input type="date" className="w-full border dark:border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white bg-white dark:bg-slate-700" 
                                        value={newProject.fecha_fin || ''} onChange={e => setNewProject({...newProject, fecha_fin: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-2 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 rounded-md">Guardar Proyecto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Details Modal with Tabs */}
            {showDetailModal && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">{selectedProject.nombre}</h2>
                                <p className="text-slate-400 text-sm">{selectedProject.codigo} - {selectedProject.estado}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="hover:bg-slate-700 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <div className="flex border-b border-gray-200 dark:border-slate-700 shrink-0">
                            <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'info' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Información</button>
                            <button onClick={() => setActiveTab('hitos')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'hitos' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Hitos</button>
                            <button onClick={() => setActiveTab('versiones')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'versiones' ? 'border-b-2 border-red-600 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Control Versiones</button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {activeTab === 'info' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Información General</h4>
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Cliente:</span> {selectedProject.cliente}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Ubicación:</span> {selectedProject.ubicacion}</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">Inicio:</span> {new Date(selectedProject.fecha_inicio).toLocaleDateString()}</p>
                                                <p className="text-sm text-red-700 dark:text-red-400 font-semibold"><span className="font-medium text-gray-700 dark:text-gray-300">Presupuesto:</span> S/. {selectedProject.presupuesto.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Áreas Asignadas</h4>
                                            {selectedProject.areas_nombres && selectedProject.areas_nombres.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedProject.areas_nombres.map((area, idx) => (
                                                        <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-100 dark:border-slate-600">
                                                            <Building className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" />
                                                            {area}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">No hay áreas asignadas.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-slate-700 pt-6">
                                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Estado de Ejecución</h4>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Físico (Basado en Horas)</span>
                                            <span className="text-lg font-bold text-red-700 dark:text-red-400">{selectedProject.progreso}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3">
                                            <div className="bg-red-600 h-3 rounded-full" style={{ width: `${selectedProject.progreso}%` }}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {activeTab === 'hitos' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-800 dark:text-white">Cronograma de Hitos</h3>
                                    </div>
                                    {milestones.length > 0 ? (
                                        milestones.map(hito => (
                                            <div key={hito.id_hito} className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
                                                <Flag className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white">{hito.nombre}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-300">{hito.descripcion}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hito.fecha}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay hitos registrados.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'versiones' && (
                                <div className="space-y-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-800 dark:text-white">Historial de Versiones</h3>
                                    </div>
                                    {versions.length > 0 ? (
                                        versions.map(v => (
                                            <div key={v.id_version} className="flex gap-3 p-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
                                                <History className="w-4 h-4 text-gray-400 mt-1" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Versión {v.numero_version}</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{v.descripcion}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">{v.fecha}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No hay versiones registradas.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};