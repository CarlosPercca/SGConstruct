import React, { useEffect, useState } from 'react';
import { Usuario, RolUsuario, UserStats, Area } from '../types';
import { MockService } from '../services/api';
import { UserPlus, Mail, Shield, Briefcase, Edit, TrendingUp, X, Power, Lock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface UsersProps {
    currentUser: Usuario;
}

export const Users: React.FC<UsersProps> = ({ currentUser }) => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<Usuario[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    
    // Modal Management
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState<Partial<Usuario>>({
        nombre: '', apellido: '', correo: '', id_rol: RolUsuario.COLABORADOR, cargo: '', id_area: 0, estado: true, contrasena_hash: ''
    });

    // Stats Modal
    const [showStats, setShowStats] = useState(false);
    const [selectedUserStats, setSelectedUserStats] = useState<UserStats | null>(null);
    const [selectedUserName, setSelectedUserName] = useState('');

    const isAdmin = currentUser.id_rol === RolUsuario.ADMINISTRADOR;

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = () => {
        // Fetch users based on requester ID (Jefe gets area users, Admin gets all)
        MockService.getUsers(currentUser.id_usuario).then(setUsers);
        MockService.getAreas().then(setAreas);
    };

    const resetForm = () => {
        setFormData({
            nombre: '', apellido: '', correo: '', id_rol: RolUsuario.COLABORADOR, cargo: '', id_area: areas.length > 0 ? areas[0].id_area : 0, estado: true, contrasena_hash: ''
        });
        setIsEditing(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (user: Usuario) => {
        setFormData({ ...user, contrasena_hash: '' });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEditing && !formData.contrasena_hash) {
            showToast('La contraseña es obligatoria para nuevos usuarios.', 'warning');
            return;
        }

        if (formData.id_area === 0) {
            showToast('Debe seleccionar un área válida.', 'warning');
            return;
        }

        const action = (isEditing && formData.id_usuario) 
            ? MockService.updateUser(formData as Usuario)
            : MockService.createUser(formData as Usuario);

        action
            .then(() => {
                loadData();
                setShowModal(false);
                resetForm();
                showToast(isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 'success');
            })
            .catch((err) => {
                console.error('Error saving user:', err);
                showToast('Error al guardar usuario: ' + err.message, 'error');
            });
    };

    const handleToggleStatus = (user: Usuario) => {
        if (confirm(`¿Está seguro de que desea ${user.estado ? 'dar de baja' : 'activar'} a ${user.nombre}?`)) {
            const updatedUser = { ...user, estado: !user.estado };
            MockService.updateUser(updatedUser).then(() => {
                loadData();
                showToast(`Usuario ${updatedUser.estado ? 'activado' : 'desactivado'} correctamente`, 'success');
            });
        }
    };

    const handleViewStats = (user: Usuario) => {
        MockService.getUserStats(user.id_usuario).then(stats => {
            setSelectedUserStats(stats);
            setSelectedUserName(`${user.nombre} ${user.apellido}`);
            setShowStats(true);
        });
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Administración total de accesos y roles.' : 'Visualización y supervisión del equipo.'}
                    </p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={handleOpenCreate}
                        className="flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuevo Usuario
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <div 
                        key={u.id_usuario} 
                        className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border transition-all relative ${u.estado ? 'border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-500' : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 opacity-75'}`}
                    >
                        {!u.estado && (
                            <div className="absolute top-4 right-4 bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-bold">
                                INACTIVO
                            </div>
                        )}
                        <div className="flex items-center space-x-4 mb-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${u.estado ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'}`}>
                                {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{u.nombre} {u.apellido}</h3>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{u.rol_nombre}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                {u.correo}
                            </div>
                            <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                {u.area_nombre}
                            </div>
                            <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                Nivel: {u.id_rol === 1 ? 'Admin' : u.id_rol === 2 ? 'Gestión' : 'Operativo'}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <button 
                                onClick={() => handleViewStats(u)}
                                className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-md"
                            >
                                <TrendingUp size={16} className="mr-1" /> Dashboard Supervisión
                            </button>
                            
                            {isAdmin && (
                                <div className="flex space-x-1">
                                    <button 
                                        onClick={() => handleOpenEdit(u)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors" title="Editar / Asignar Rol"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleStatus(u)}
                                        className={`p-2 rounded transition-colors ${u.estado ? 'text-red-600 hover:bg-red-50 dark:hover:bg-slate-700' : 'text-green-600 hover:bg-green-50 dark:hover:bg-slate-700'}`}
                                        title={u.estado ? "Dar de baja" : "Activar usuario"}
                                    >
                                        <Power size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create / Edit User Modal */}
            {showModal && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg">{isEditing ? 'Editar Usuario / Roles' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-slate-700 p-1 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input required type="text" className="text-gray-900 dark:text-white w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700" 
                                        value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                                    <input required type="text" className="text-gray-900 dark:text-white w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700" 
                                        value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Corporativo</label>
                                <input required type="email" className="text-gray-900 dark:text-white w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700" 
                                    value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                    <Lock size={14} className="mr-1"/> Contraseña
                                </label>
                                <input 
                                    type="password" 
                                    className="text-gray-900 dark:text-white w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700" 
                                    placeholder={isEditing ? "Dejar en blanco para mantener actual" : "Asignar contraseña"}
                                    value={formData.contrasena_hash} 
                                    onChange={e => setFormData({...formData, contrasena_hash: e.target.value})} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área</label>
                                <select required className="text-gray-900 dark:text-white w-full border dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700"
                                    value={formData.id_area} onChange={e => setFormData({...formData, id_area: Number(e.target.value)})}
                                >
                                    <option value={0}>Seleccionar</option>
                                    {areas.map(a => (
                                        <option key={a.id_area} value={a.id_area}>{a.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-900">
                                <label className="block text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Asignación de Rol</label>
                                <select className="text-gray-900 dark:text-white w-full border border-blue-200 dark:border-blue-800 rounded-md p-2 bg-white dark:bg-slate-700"
                                    value={formData.id_rol} onChange={e => setFormData({...formData, id_rol: Number(e.target.value)})}
                                >
                                    <option value={3}>Colaborador (Acceso Básico)</option>
                                    <option value={2}>Jefe de Área (Gestión y Validación)</option>
                                    <option value={1}>Administrador (Control Total)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-red-700 text-white hover:bg-red-800 rounded shadow-sm">
                                    {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Stats Modal Logic Same as Before */}
             {showStats && selectedUserStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-red-700 p-6 text-white text-center">
                            <h3 className="text-xl font-bold">{selectedUserName}</h3>
                            <p className="text-red-100 text-sm">Resumen de Rendimiento (Supervisión)</p>
                        </div>
                        <div className="p-6">
                             <div className="flex justify-center mb-6">
                                <div className="relative h-24 w-24 flex items-center justify-center">
                                    <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-gray-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                        <path className="text-red-600" strokeDasharray={`${selectedUserStats.eficiencia}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-2xl font-bold text-gray-800 dark:text-white">{selectedUserStats.eficiencia}%</span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">Eficiencia</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg"><p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Total Tareas</p><p className="text-lg font-bold text-gray-800 dark:text-white">{selectedUserStats.totalTareas}</p></div>
                                <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg"><p className="text-xs text-gray-500 dark:text-gray-300 mb-1">Horas Ejec.</p><p className="text-lg font-bold text-gray-800 dark:text-white">{selectedUserStats.horasTotales}h</p></div>
                            </div>
                            <button onClick={() => setShowStats(false)} className="w-full mt-6 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-medium">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};