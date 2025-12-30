
// Enums (Mapped to String/Int in DB)
export enum RolUsuario {
  ADMINISTRADOR = 1,
  JEFE_AREA = 2,
  COLABORADOR = 3
}

export enum EstadoTarea {
  PENDIENTE = 'Pendiente',
  EN_PROGRESO = 'En Progreso',
  POR_APROBAR = 'Por Aprobar',
  COMPLETADA = 'Completada'
}

export enum EstadoValidacion {
  PENDIENTE = 'Pendiente',
  APROBADO = 'Aprobado',
  RECHAZADO = 'Rechazado'
}

// ==========================================
// TABLE INTERFACES (Direct Mapping to DB)
// ==========================================

export interface Rol {
    id_rol: number;
    nombre: string;
    descripcion: string;
}

export interface Area {
    id_area: number;
    nombre: string;
    descripcion: string;
    estado?: boolean; // Added for Soft Delete logic in UI
}

export interface Usuario {
    id_usuario: number;
    nombre: string;
    apellido: string;
    correo: string;
    contrasena_hash: string; // Renamed from password
    estado: boolean; // Renamed from activo
    fecha_creacion?: string;
    id_rol: number;
    id_area: number;
    // UI Helpers (Joined fields)
    rol_nombre?: string;
    area_nombre?: string;
    cargo?: string; // Not in DB, kept for UI if needed or mapped to descripcion
}

export interface Proyecto {
    id_proyecto: number;
    codigo: string;
    nombre: string;
    cliente: string;
    ubicacion: string;
    fecha_inicio: string;
    fecha_fin?: string;
    presupuesto: number;
    estado: string;
    fecha_creacion?: string;
    // UI Helpers
    progreso?: number; // Calculated via fn_avance_proyecto
    areas_nombres?: string[]; // Derived from proyecto_area
}

export interface ProyectoArea {
    id: number;
    id_proyecto: number;
    id_area: number;
}

export interface HitoProyecto {
    id_hito: number;
    id_proyecto: number;
    nombre: string;
    descripcion: string;
    fecha: string;
    fecha_creacion?: string;
}

export interface VersionProyecto {
    id_version: number;
    id_proyecto: number;
    numero_version: number;
    descripcion: string;
    archivo_ruta: string;
    fecha?: string;
}

export interface PlanificacionSemanal {
    id_planificacion: number;
    id_proyecto: number;
    semana: number;
    anio: number;
    fecha_creacion?: string;
    notas?: string;
    // UI Helper
    proyecto_nombre?: string;
}

export interface Tarea {
    id_tarea: number;
    id_planificacion: number;
    id_colaborador: number;
    titulo: string;
    descripcion: string;
    fecha_programada: string;
    horas_estimadas: number;
    horas_reales: number;
    estado: string; // 'Pendiente', 'En Progreso', etc.
    tipo: string; // 'Programada', 'No Prevista'
    fecha_creacion?: string;
    // UI Helpers
    colaborador_nombre?: string;
    colaborador_area?: string;
    proyecto_nombre?: string;
    es_emergencia?: boolean; // Mapped logic based on 'tipo'
    id_tarea_dependiente?: number; // Helper for dependency
}

export interface DependenciaTarea {
    id: number;
    id_tarea_principal: number;
    id_tarea_dependiente: number;
}

export interface AvanceTarea {
    id_avance: number;
    id_tarea: number;
    id_usuario: number;
    horas_registradas: number;
    estado_validacion: string; // 'Pendiente', 'Aprobado', 'Rechazado'
    motivo_rechazo?: string;
    fecha: string;
    // UI Helpers
    usuario_nombre?: string;
    tarea_titulo?: string;
}

export interface Auditoria {
    id_auditoria: number;
    id_usuario: number;
    entidad: string;
    id_entidad: number;
    accion: string;
    detalle: string;
    fecha: string;
    // UI Helper
    usuario_nombre?: string;
}

export interface Notificacion {
    id_notificacion: number;
    id_usuario: number;
    tipo: string;
    mensaje: string;
    fecha_envio: string;
    leido: boolean;
}

// Stats Interfaces
export interface UserStats {
    totalTareas: number;
    completadas: number;
    pendientes: number;
    horasTotales: number;
    horasEstimadasTotal: number;
    eficiencia: number;
}
