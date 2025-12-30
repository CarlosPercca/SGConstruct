import React, { useEffect, useState } from 'react';
import { Auditoria } from '../types';
import { MockService } from '../services/api';
import { ShieldCheck, User, Calendar, FileText, Filter } from 'lucide-react';

export const Audit: React.FC = () => {
    const [logs, setLogs] = useState<Auditoria[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<Auditoria[]>([]);
    
    // Filters
    const [filterUser, setFilterUser] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [filterAction, setFilterAction] = useState('');

    const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
    const [uniqueEntities, setUniqueEntities] = useState<string[]>([]);
    const [uniqueActions, setUniqueActions] = useState<string[]>([]);

    useEffect(() => {
        MockService.getLogs().then(data => {
            setLogs(data);
            setFilteredLogs(data);
            
            // Extract unique values for filters
            setUniqueUsers(Array.from(new Set(data.map(l => l.usuario_nombre || 'Sistema'))));
            setUniqueEntities(Array.from(new Set(data.map(l => l.entidad))));
            setUniqueActions(Array.from(new Set(data.map(l => l.accion))));
        });
    }, []);

    useEffect(() => {
        let result = logs;
        if (filterUser) result = result.filter(l => (l.usuario_nombre || 'Sistema') === filterUser);
        if (filterEntity) result = result.filter(l => l.entidad === filterEntity);
        if (filterAction) result = result.filter(l => l.accion === filterAction);
        setFilteredLogs(result);
    }, [filterUser, filterEntity, filterAction, logs]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoría y Registros</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Historial completo de actividades detallado por usuario, entidad y acción.</p>
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium mr-2">
                    <Filter size={20} className="mr-2 text-red-600 dark:text-red-400"/> Filtros:
                </div>
                
                <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Usuario</label>
                    <select className="w-full border dark:border-slate-600 rounded-md p-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                        <option value="">Todos</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                
                <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Entidad</label>
                    <select className="w-full border dark:border-slate-600 rounded-md p-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
                        <option value="">Todas</option>
                        {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                
                <div className="flex-1 w-full md:w-auto">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Acción</label>
                    <select className="w-full border dark:border-slate-600 rounded-md p-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
                        <option value="">Todas</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <button 
                    onClick={() => { setFilterUser(''); setFilterEntity(''); setFilterAction(''); }}
                    className="px-4 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                >
                    Limpiar
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-xs uppercase text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Entidad</th>
                                <th className="px-6 py-4">Detalle</th>
                                <th className="px-6 py-4">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredLogs.map((log) => (
                                <tr key={log.id_auditoria} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                            <User className="w-4 h-4 mr-2 text-gray-400" />
                                            {log.usuario_nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {log.accion}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                            {log.entidad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-start max-w-md">
                                            <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                                            {log.detalle}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            {new Date(log.fecha).toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredLogs.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">No se encontraron registros con los filtros actuales.</div>
                )}
            </div>
        </div>
    );
};