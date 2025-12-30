import React, { useEffect, useState } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { MockService } from '../services/api';

export const Reports: React.FC = () => {
    const [data, setData] = useState<{ monthlyHours: any[], progressCurve: any[] }>({ monthlyHours: [], progressCurve: [] });

    useEffect(() => {
        MockService.getReports().then(setData);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes y Métricas</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Análisis de rendimiento y cumplimiento de cronogramas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Curva S: Avance Semanal (%)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.progressCurve}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Area type="monotone" dataKey="avance" stroke="#b91c1c" fill="#fecaca" name="Avance %" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Horas Hombre Mensuales</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.monthlyHours}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                                <Line type="monotone" dataKey="horas" stroke="#4b5563" strokeWidth={2} name="Horas" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-xl border border-red-100 dark:border-red-900">
                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2">Exportar Reportes</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">Descarga los reportes detallados en formato PDF o Excel.</p>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded shadow-sm hover:bg-red-50 dark:hover:bg-slate-700 font-medium">
                        Reporte de Tareas.pdf
                    </button>
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded shadow-sm hover:bg-red-50 dark:hover:bg-slate-700 font-medium">
                        Control de Horas.xlsx
                    </button>
                </div>
            </div>
        </div>
    );
};