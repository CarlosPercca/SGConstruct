import React, { useEffect, useState } from 'react';
import { AvanceTarea, EstadoValidacion, Usuario, RolUsuario } from '../types';
import { MockService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, BarChart3 } from 'lucide-react';

interface ValidationsProps {
    user: Usuario;
}

export const Validations: React.FC<ValidationsProps> = ({ user }) => {
    const { showToast } = useToast();
    const [avances, setAvances] = useState<AvanceTarea[]>([]);
    const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, rechazados: 0, totalHoras: 0 });
    
    // Rejection Modal State
    const [rejectModal, setRejectModal] = useState({ open: false, id: 0 });
    const [rejectReason, setRejectReason] = useState('');

    // Permission Logic: Only Area Manager can act. Admin can only view stats.
    const canManage = user.id_rol === RolUsuario.JEFE_AREA;

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = () => {
        // TODO: BACKEND INTEGRATION
        // Si es ADMIN: SELECT * FROM avance_tarea (View All)
        // Si es JEFE: SELECT at.* FROM avance_tarea at JOIN tarea t ON ... JOIN usuario u ON ... WHERE u.id_area = $jefe_area_id
        MockService.getValidations().then(data => {
            // Sort pending first
            const sorted = data.sort((a, b) => 
                (a.estado_validacion === EstadoValidacion.PENDIENTE ? -1 : 1) - (b.estado_validacion === EstadoValidacion.PENDIENTE ? -1 : 1)
            );
            setAvances(sorted);

            // Calculate Totals for Admin/Manager view
            const newStats = data.reduce((acc, curr) => ({
                pendientes: acc.pendientes + (curr.estado_validacion === EstadoValidacion.PENDIENTE ? 1 : 0),
                aprobados: acc.aprobados + (curr.estado_validacion === EstadoValidacion.APROBADO ? 1 : 0),
                rechazados: acc.rechazados + (curr.estado_validacion === EstadoValidacion.RECHAZADO ? 1 : 0),
                totalHoras: acc.totalHoras + curr.horas_registradas
            }), { pendientes: 0, aprobados: 0, rechazados: 0, totalHoras: 0 });
            setStats(newStats);
        });
    };

    const handleApprove = (id: number) => {
        if (!canManage) return;
        MockService.validateAvance(id, EstadoValidacion.APROBADO)
            .then(() => {
                loadData();
            })
            .catch(err => showToast('Error al aprobar: ' + err.message, 'error'));
    };

    const openRejectModal = (id: number) => {
        if (!canManage) return;
        setRejectModal({ open: true, id });
        setRejectReason('');
    };

    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) {
            showToast("Debe ingresar un motivo para el rechazo.", 'error');
            return;
        }
        MockService.validateAvance(rejectModal.id, EstadoValidacion.RECHAZADO, rejectReason).then(() => {
            setRejectModal({ open: false, id: 0 });
            loadData();
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Validación de Horas</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.id_rol === RolUsuario.ADMINISTRADOR 
                        ? 'Vista general de horas reportadas (Solo Lectura).' 
                        : 'Supervisión y aprobación de horas reportadas por los colaboradores.'}
                </p>
            </div>

            {/* Stats Cards (Visible for Admin & Jefe) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg mr-4">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendientes}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg mr-4">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aprobados</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.aprobados}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg mr-4">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rechazados</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rechazados}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center">
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg mr-4">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Horas Totales</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalHoras}h</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Colaborador</th>
                            <th className="px-6 py-4">Tarea / Descripción</th>
                            <th className="px-6 py-4">Fecha Reporte</th>
                            <th className="px-6 py-4 text-center">Horas</th>
                            <th className="px-6 py-4">Estado</th>
                            {canManage && <th className="px-6 py-4 text-right">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {avances.map((avance) => (
                            <tr key={avance.id_avance} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {avance.usuario_nombre}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="font-medium">{avance.tarea_titulo}</div>
                                    {avance.motivo_rechazo && (
                                        <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center">
                                            <AlertCircle size={10} className="mr-1"/>
                                            Rechazo: {avance.motivo_rechazo}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(avance.fecha).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-gray-800 dark:text-white">
                                    {avance.horas_registradas} h
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${avance.estado_validacion === EstadoValidacion.APROBADO ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                          avance.estado_validacion === EstadoValidacion.RECHAZADO ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                        {avance.estado_validacion === EstadoValidacion.PENDIENTE && <Clock className="w-3 h-3 mr-1"/>}
                                        {avance.estado_validacion}
                                    </span>
                                </td>
                                {canManage && (
                                    <td className="px-6 py-4 text-right">
                                        {avance.estado_validacion === EstadoValidacion.PENDIENTE ? (
                                            <div className="flex justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleApprove(avance.id_avance)}
                                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-slate-600 rounded" title="Aprobar"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                                <button 
                                                    onClick={() => openRejectModal(avance.id_avance)}
                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 rounded" title="Rechazar"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">Procesado</span>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {avances.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay validaciones pendientes.</div>
                )}
            </div>

            {/* Rejection Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 relative">
                        <div className="flex items-center gap-2 mb-4 text-red-700 dark:text-red-400">
                            <MessageSquare className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Motivo del Rechazo</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Por favor indique por qué se rechaza este reporte de horas para notificar al colaborador.
                        </p>
                        {/* High contrast for visibility: dark bg for darkmode, light for lightmode */}
                        <textarea 
                            className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-3 text-sm focus:ring-red-500 focus:border-red-500 mb-4 h-24 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="Ej: Las horas no coinciden con el avance físico..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setRejectModal({ open: false, id: 0 })}
                                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleRejectConfirm}
                                className="px-3 py-2 text-sm bg-red-700 text-white hover:bg-red-800 rounded"
                            >
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};