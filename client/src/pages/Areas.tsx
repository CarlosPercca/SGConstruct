import React, { useEffect, useState } from 'react';
import { Area } from '../types';
import { MockService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Layers, AlertCircle, X, Power } from 'lucide-react';

export const Areas: React.FC = () => {
    const { showToast } = useToast();
    const [areas, setAreas] = useState<Area[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newArea, setNewArea] = useState({ nombre: '', descripcion: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = () => {
        MockService.getAreas().then(setAreas);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newArea.nombre) {
            MockService.createArea(newArea.nombre, newArea.descripcion)
                .then(() => {
                    loadAreas();
                    setShowModal(false);
                    setNewArea({ nombre: '', descripcion: '' });
                })
                .catch(err => {
                    console.error('Error creating area:', err);
                    showToast('Error al crear área: ' + err.message, 'error');
                });
        } else {
            showToast('El nombre del área es obligatorio.', 'error');
        }
    };

    const handleToggleStatus = (id: number) => {
        setError('');
        MockService.toggleAreaStatus(id)
            .then(() => loadAreas())
            .catch(err => setError(err));
    };

    const handleDelete = (id: number) => {
        if (!confirm('¿Está seguro de eliminar permanentemente esta área? Esta acción no se puede deshacer.')) return;
        
        setError('');
        MockService.deleteArea(id)
            .then(() => loadAreas())
            .catch(err => {
                setError(err);
            });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Áreas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Departamentos y unidades operativas de la organización.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Área
                </button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X size={16}/></button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area) => (
                    <div key={area.id_area} className={`p-6 rounded-xl shadow-sm border transition-all relative ${area.estado ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:shadow-md' : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-80'}`}>
                         <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-lg mr-4 ${area.estado ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${area.estado ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{area.nombre}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${area.estado ? 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-500 bg-gray-200 dark:bg-slate-700 dark:text-gray-400'}`}>
                                        {area.estado ? 'Activa' : 'Deshabilitada'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex space-x-1">
                                <button 
                                    onClick={() => handleToggleStatus(area.id_area)}
                                    className={`p-2 rounded-full transition-colors ${area.estado ? 'text-green-600 hover:bg-green-50 dark:hover:bg-slate-700' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                                    title={area.estado ? "Deshabilitar Área" : "Habilitar Área"}
                                >
                                    <Power size={18} />
                                </button>
                                
                                {!area.estado && (
                                    <button 
                                        onClick={() => handleDelete(area.id_area)}
                                        className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                                        title="Eliminar Área Permanentemente"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{area.descripcion || 'Sin descripción disponible.'}</p>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nueva Área Operativa</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-slate-700 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Área</label>
                                <input required type="text" className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-red-500 focus:border-red-500" 
                                    placeholder="Ej. Finanzas"
                                    value={newArea.nombre} onChange={e => setNewArea({...newArea, nombre: e.target.value})} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea required className="w-full border dark:border-slate-600 rounded-md p-2 text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-red-500 focus:border-red-500" 
                                    rows={3}
                                    placeholder="Breve descripción de funciones..."
                                    value={newArea.descripcion} onChange={e => setNewArea({...newArea, descripcion: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 rounded shadow-sm">Crear Área</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};