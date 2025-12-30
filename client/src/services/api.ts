import { 
    Usuario, Proyecto, Tarea, AvanceTarea, 
    Notificacion, Area, Auditoria, HitoProyecto, 
    VersionProyecto, UserStats 
} from '../types';

const API_URL = 'http://localhost:5000/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(error.message || 'Error en la petición');
    }
    return response.json();
};

export const ApiService = {
    // Auth
    login: async (correo: string, contrasena: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        return handleResponse(response);
    },

    recoverPassword: async (email: string) => {
        const response = await fetch(`${API_URL}/auth/recover-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return handleResponse(response);
    },

    // Areas
    getAreas: async (): Promise<Area[]> => {
        const response = await fetch(`${API_URL}/areas`);
        return handleResponse(response);
    },
    createArea: async (nombre: string, descripcion: string) => {
        const response = await fetch(`${API_URL}/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion })
        });
        return handleResponse(response);
    },
    toggleAreaStatus: async (id: number) => {
        const response = await fetch(`${API_URL}/areas/${id}/status`, {
            method: 'PUT'
        });
        return handleResponse(response);
    },
    deleteArea: async (id: number) => {
        const response = await fetch(`${API_URL}/areas/${id}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    },

    // Projects
    getProjects: async (): Promise<Proyecto[]> => {
        const response = await fetch(`${API_URL}/projects`);
        return handleResponse(response);
    },

    createProject: async (project: Partial<Proyecto> & { areas_nombres?: string[] }) => {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        return handleResponse(response);
    },

    getMilestones: async (projectId: number): Promise<HitoProyecto[]> => {
        const response = await fetch(`${API_URL}/projects/${projectId}/milestones`);
        return handleResponse(response);
    },
    getVersions: async (projectId: number): Promise<VersionProyecto[]> => {
        const response = await fetch(`${API_URL}/projects/${projectId}/versions`);
        return handleResponse(response);
    },

    // Tasks
    getTasks: async (userId?: number, roleId?: number): Promise<Tarea[]> => {
        let url = `${API_URL}/tasks`;
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId.toString());
        if (roleId) params.append('roleId', roleId.toString());
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url);
        return handleResponse(response);
    },

    getTaskById: async (id: number): Promise<Tarea | undefined> => {
        const response = await fetch(`${API_URL}/tasks/${id}`);
        return handleResponse(response);
    },

    createTask: async (taskData: Partial<Tarea> & { projectId?: number }) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        return handleResponse(response);
    },

    updateTask: async (task: Tarea) => {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return handleResponse(response);
    },

    updateTaskStatus: async (id: number, status: string) => {
        const response = await fetch(`${API_URL}/tasks/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: status })
        });
        return handleResponse(response);
    },

    // Avances & Validation
    registerHours: async (data: { id_tarea: number, id_usuario: number, horas_registradas: number }) => {
        const response = await fetch(`${API_URL}/validations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    getValidations: async (): Promise<AvanceTarea[]> => {
        const response = await fetch(`${API_URL}/validations`);
        return handleResponse(response);
    },

    validateAvance: async (id: number, status: string, reason?: string) => {
        const response = await fetch(`${API_URL}/validations/${id}/validate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reason })
        });
        return handleResponse(response);
    },

    // Users
    getUsers: async (requesterId?: number): Promise<Usuario[]> => {
        let url = `${API_URL}/users`;
        if (requesterId) url += `?requesterId=${requesterId}`;
        const response = await fetch(url);
        return handleResponse(response);
    },

    createUser: async (u: Usuario) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u)
        });
        return handleResponse(response);
    },

    updateUser: async (u: Usuario) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u)
        });
        return handleResponse(response);
    },

    getUserStats: async (id: number): Promise<UserStats> => {
        const response = await fetch(`${API_URL}/users/${id}/stats`);
        return handleResponse(response);
    },

    // Notifications
    getNotifications: async (userId: number): Promise<Notificacion[]> => {
        const response = await fetch(`${API_URL}/notifications?userId=${userId}`);
        return handleResponse(response);
    },

    markAsRead: async (id: number) => {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT'
        });
        return handleResponse(response);
    },

    // Audit
    getLogs: async (): Promise<Auditoria[]> => {
        const response = await fetch(`${API_URL}/audit`);
        return handleResponse(response);
    },

    // Reports
    getReports: async () => {
        const response = await fetch(`${API_URL}/reports/stats`);
        return handleResponse(response);
    }
};

// Alias for compatibility if needed, but better to update imports
export const MockService = ApiService;
