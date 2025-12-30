-- sistema_gestion_completo.sql
-- Creación de tablas, datos de prueba, funciones y triggers para PostgreSQL
-- Generated for: Sistema de Gestión Integrada de Tareas y Proyectos (S&G Edifica S.A.C.)

-- -------------------------
-- DROP existing objects (careful in production)
-- -------------------------
DROP TABLE IF EXISTS notificacion;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS avance_tarea;
DROP TABLE IF EXISTS archivo_tarea;
DROP TABLE IF EXISTS comentario_tarea;
DROP TABLE IF EXISTS dependencia_tarea;
DROP TABLE IF EXISTS tarea;
DROP TABLE IF EXISTS planificacion_semanal;
DROP TABLE IF EXISTS documento_proyecto;
DROP TABLE IF EXISTS version_proyecto;
DROP TABLE IF EXISTS hito_proyecto;
DROP TABLE IF EXISTS proyecto_area;
DROP TABLE IF EXISTS proyecto;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS area;
DROP TABLE IF EXISTS rol;

-- -------------------------
-- Roles
-- -------------------------
CREATE TABLE rol (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT
);

-- Areas
CREATE TABLE area (
  id_area SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado BOOLEAN DEFAULT TRUE
);

-- Usuarios
CREATE TABLE usuario (
  id_usuario   SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100),
  correo       VARCHAR(200) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  estado       BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT now(),
  id_rol       INT REFERENCES rol(id_rol) ON DELETE SET NULL,
  id_area      INT REFERENCES area(id_area) ON DELETE SET NULL
);
CREATE INDEX idx_usuario_rol ON usuario(id_rol);
CREATE INDEX idx_usuario_area ON usuario(id_area);

-- Proyectos
CREATE TABLE proyecto (
  id_proyecto SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  cliente VARCHAR(200),
  ubicacion VARCHAR(200),
  fecha_inicio DATE,
  fecha_fin DATE,
  presupuesto NUMERIC(14,2) DEFAULT 0,
  estado VARCHAR(50),
  fecha_creacion TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_proyecto_codigo ON proyecto(codigo);

-- Tabla puente proyecto-area
CREATE TABLE proyecto_area (
  id SERIAL PRIMARY KEY,
  id_proyecto INT NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  id_area INT NOT NULL REFERENCES area(id_area) ON DELETE CASCADE,
  UNIQUE(id_proyecto, id_area)
);
CREATE INDEX idx_proyecto_area_proyecto ON proyecto_area(id_proyecto);
CREATE INDEX idx_proyecto_area_area ON proyecto_area(id_area);

-- Hitos
CREATE TABLE hito_proyecto (
  id_hito SERIAL PRIMARY KEY,
  id_proyecto INT NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha DATE,
  fecha_creacion TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_hito_proyecto ON hito_proyecto(id_proyecto);

-- Versiones
CREATE TABLE version_proyecto (
  id_version SERIAL PRIMARY KEY,
  id_proyecto INT NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  numero_version INT NOT NULL,
  descripcion TEXT,
  archivo_ruta VARCHAR(500),
  fecha TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_version_proyecto ON version_proyecto(id_proyecto);

-- Documentos de proyecto
CREATE TABLE documento_proyecto (
  id_documento SERIAL PRIMARY KEY,
  id_proyecto INT NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  nombre VARCHAR(200),
  ruta VARCHAR(500),
  tipo VARCHAR(50),
  fecha_subida TIMESTAMP DEFAULT now(),
  id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL
);
CREATE INDEX idx_documento_proyecto ON documento_proyecto(id_proyecto);

-- Planificacion semanal
CREATE TABLE planificacion_semanal (
  id_planificacion SERIAL PRIMARY KEY,
  id_proyecto INT NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  semana INT NOT NULL,
  anio INT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT now(),
  notas TEXT
);
CREATE INDEX idx_planificacion_proyecto ON planificacion_semanal(id_proyecto);

-- Tareas
CREATE TABLE tarea (
  id_tarea SERIAL PRIMARY KEY,
  id_planificacion INT REFERENCES planificacion_semanal(id_planificacion) ON DELETE SET NULL,
  id_colaborador INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_programada DATE,
  horas_estimadas NUMERIC(6,2) DEFAULT 0,
  horas_reales NUMERIC(6,2) DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'Pendiente',
  tipo VARCHAR(50) DEFAULT 'Programada',
  fecha_creacion TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_tarea_planificacion ON tarea(id_planificacion);
CREATE INDEX idx_tarea_colaborador ON tarea(id_colaborador);

-- Dependencias (autoreferencia)
CREATE TABLE dependencia_tarea (
  id SERIAL PRIMARY KEY,
  id_tarea_principal INT NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  id_tarea_dependiente INT NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  UNIQUE(id_tarea_principal, id_tarea_dependiente)
);
CREATE INDEX idx_dep_principal ON dependencia_tarea(id_tarea_principal);
CREATE INDEX idx_dep_dependiente ON dependencia_tarea(id_tarea_dependiente);

-- Comentarios de tarea
CREATE TABLE comentario_tarea (
  id_comentario SERIAL PRIMARY KEY,
  id_tarea INT NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  contenido TEXT,
  fecha TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_comentario_tarea ON comentario_tarea(id_tarea);

-- Archivos de tarea (evidencias)
CREATE TABLE archivo_tarea (
  id_archivo SERIAL PRIMARY KEY,
  id_tarea INT NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  ruta VARCHAR(500),
  tipo VARCHAR(50),
  fecha TIMESTAMP DEFAULT now(),
  id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL
);
CREATE INDEX idx_archivo_tarea ON archivo_tarea(id_tarea);

-- Avances de tarea
CREATE TABLE avance_tarea (
  id_avance SERIAL PRIMARY KEY,
  id_tarea INT NOT NULL REFERENCES tarea(id_tarea) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  horas_registradas NUMERIC(6,2) DEFAULT 0,
  estado_validacion VARCHAR(20) DEFAULT 'Pendiente',
  motivo_rechazo TEXT,
  fecha TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_avance_tarea ON avance_tarea(id_tarea);

-- Auditoría
CREATE TABLE auditoria (
  id_auditoria SERIAL PRIMARY KEY,
  id_usuario INT REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  entidad VARCHAR(100),
  id_entidad INT,
  accion VARCHAR(100),
  detalle TEXT,
  fecha TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario);

-- Notificaciones
CREATE TABLE notificacion (
  id_notificacion SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  tipo VARCHAR(50),
  mensaje TEXT,
  fecha_envio TIMESTAMP DEFAULT now(),
  leido BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_notificacion_usuario ON notificacion(id_usuario);

-- -------------------------
-- Datos de prueba (Seeds)
-- -------------------------
INSERT INTO rol (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Jefe de Área', 'Gestiona proyectos y tareas'),
('Colaborador', 'Ejecuta tareas');


INSERT INTO area (nombre, descripcion) VALUES
('Ingeniería', 'Área de diseño y cálculos'),
('Construcción', 'Área de ejecución de obra'),
('Logística', 'Abastecimiento y control de materiales');


INSERT INTO usuario (nombre, apellido, correo, contrasena_hash, id_rol, id_area)
VALUES
('Carlos', 'Percca', 'carlos@empresa.com', 'hash123', 1, 1),
('Judith', 'Soto', 'judith@empresa.com', 'hash123', 2, 2),
('Shiomara', 'Perez', 'shiomara@empresa.com', 'hash123', 3, 2),
('Leydi', 'Torres', 'leydi@empresa.com', 'hash123', 3, 3);


INSERT INTO proyecto (codigo, nombre, cliente, ubicacion, fecha_inicio, estado)
VALUES
('PROY-001', 'Edificio Central', 'Constructora Perú', 'Arequipa', '2025-01-10', 'En ejecución'),
('PROY-002', 'Pavimentación Vial', 'Municipalidad', 'Tacna', '2025-02-01', 'Planificado');


INSERT INTO proyecto_area (id_proyecto, id_area) VALUES
(1, 1),
(1, 2),
(2, 3);


INSERT INTO hito_proyecto (id_proyecto, nombre, descripcion, fecha)
VALUES
(1, 'Entrega de planos', 'Planos estructurales completos', '2025-01-25'),
(1, 'Cimentación terminada', 'Finalización de la base', '2025-02-20');


INSERT INTO version_proyecto (id_proyecto, numero_version, descripcion)
VALUES
(1, 1, 'Versión inicial'),
(1, 2, 'Correcciones de ingeniería');


INSERT INTO documento_proyecto (id_proyecto, nombre, ruta, tipo, id_usuario)
VALUES
(1, 'Planos iniciales', '/docs/planos_v1.pdf', 'PDF', 1),
(1, 'Informe estructural', '/docs/informe.pdf', 'PDF', 2);


INSERT INTO planificacion_semanal (id_proyecto, semana, anio)
VALUES
(1, 3, 2025),
(1, 4, 2025);


INSERT INTO tarea (id_planificacion, id_colaborador, titulo, descripcion, fecha_programada, horas_estimadas)
VALUES
(1, 3, 'Excavación', 'Excavación de terreno', '2025-01-15', 10),
(1, 4, 'Armado de acero', 'Preparación de acero para columnas', '2025-01-16', 12),
(2, 3, 'Encofrado', 'Encofrado para primer nivel', '2025-01-22', 15);


INSERT INTO dependencia_tarea (id_tarea_principal, id_tarea_dependiente)
VALUES
(1, 2),
(2, 3);


INSERT INTO comentario_tarea (id_tarea, id_usuario, contenido)
VALUES
(1, 3, 'Excavación iniciada. Terreno firme.'),
(2, 4, 'Acero listo para armado.');


INSERT INTO archivo_tarea (id_tarea, ruta, tipo, id_usuario)
VALUES
(1, '/evidencias/excavacion1.jpg', 'imagen', 3),
(2, '/evidencias/acero1.jpg', 'imagen', 4);


INSERT INTO avance_tarea (id_tarea, id_usuario, horas_registradas, estado_validacion)
VALUES
(1, 3, 4, 'Pendiente'),
(2, 4, 6, 'Aprobado');


INSERT INTO auditoria (id_usuario, entidad, id_entidad, accion, detalle)
VALUES
(1, 'tarea', 1, 'CREAR', 'Tarea Excavación creada'),
(3, 'avance_tarea', 1, 'REGISTRAR', 'Registró avance de 4 horas');


INSERT INTO notificacion (id_usuario, tipo, mensaje)
VALUES
(3, 'Tarea asignada', 'Se le asignó la tarea Excavación'),
(4, 'Tarea asignada', 'Se le asignó la tarea Armado de Acero');


-- -------------------------
-- FUNCIONES y TRIGGERS
-- -------------------------

-- 1) Función genérica de auditoría que intentará obtener el id de la entidad desde NEW o OLD
CREATE OR REPLACE FUNCTION fn_auditar() RETURNS trigger AS $$
DECLARE
  v_id_entidad INT;
  v_usuario INT;
  v_accion TEXT;
  v_record JSONB;
BEGIN
  v_accion := TG_OP; -- INSERT, UPDATE, DELETE
  
  -- Usamos to_jsonb para evitar errores de "campo no existe" al acceder a columnas que no están en la tabla
  IF (TG_OP = 'DELETE') THEN
    v_record := to_jsonb(OLD);
  ELSE
    v_record := to_jsonb(NEW);
  END IF;

  -- Intentar obtener id_entidad buscando claves comunes
  v_id_entidad := COALESCE(
    (v_record->>'id')::int,
    (v_record->>'id_tarea')::int,
    (v_record->>'id_proyecto')::int,
    (v_record->>'id_documento')::int,
    (v_record->>'id_hito')::int,
    (v_record->>'id_version')::int,
    (v_record->>'id_planificacion')::int,
    (v_record->>'id_usuario')::int,
    (v_record->>'id_comentario')::int,
    (v_record->>'id_avance')::int
  );

  -- Intentar obtener usuario actor
  v_usuario := COALESCE(
    (v_record->>'id_usuario')::int,
    (v_record->>'id_colaborador')::int
  );

  INSERT INTO auditoria (id_usuario, entidad, id_entidad, accion, detalle, fecha)
  VALUES (v_usuario, TG_TABLE_NAME, v_id_entidad, v_accion, TG_ARGV[0], now());

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers de auditoría para tablas críticas
CREATE TRIGGER trg_aud_proyecto AFTER INSERT OR UPDATE OR DELETE ON proyecto
FOR EACH ROW EXECUTE PROCEDURE fn_auditar('Proyecto modificado');

CREATE TRIGGER trg_aud_tarea AFTER INSERT OR UPDATE OR DELETE ON tarea
FOR EACH ROW EXECUTE PROCEDURE fn_auditar('Tarea modificada');

CREATE TRIGGER trg_aud_avance AFTER INSERT OR UPDATE OR DELETE ON avance_tarea
FOR EACH ROW EXECUTE PROCEDURE fn_auditar('Avance de tarea modificado');

CREATE TRIGGER trg_aud_documento AFTER INSERT OR UPDATE OR DELETE ON documento_proyecto
FOR EACH ROW EXECUTE PROCEDURE fn_auditar('Documento modificado');

-- 2) Trigger que impide marcar una tarea como COMPLETADA si tiene dependencias pendientes
CREATE OR REPLACE FUNCTION fn_validar_dependencias() RETURNS trigger AS $$
DECLARE
  cnt INT;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.estado = 'Completada') THEN
      SELECT COUNT(*) INTO cnt
      FROM dependencia_tarea d
      JOIN tarea t ON d.id_tarea_principal = t.id_tarea
      WHERE d.id_tarea_dependiente = NEW.id_tarea
        AND t.estado <> 'Completada';
      IF cnt > 0 THEN
        RAISE EXCEPTION 'No se puede marcar tarea como Completada: existen % dependencias pendientes', cnt;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_dependencias BEFORE UPDATE ON tarea
FOR EACH ROW EXECUTE PROCEDURE fn_validar_dependencias();

-- 3) Trigger para actualizar horas_reales de la tarea luego de insert/update en avance_tarea
CREATE OR REPLACE FUNCTION fn_actualizar_horas_reales() RETURNS trigger AS $$
DECLARE
  suma NUMERIC(14,2);
BEGIN
  -- Calcular la suma de horas registradas aprobadas o pendientes (según política)
  SELECT COALESCE(SUM(horas_registradas),0) INTO suma FROM avance_tarea WHERE id_tarea = NEW.id_tarea;
  UPDATE tarea SET horas_reales = suma WHERE id_tarea = NEW.id_tarea;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_horas_after_avance AFTER INSERT OR UPDATE ON avance_tarea
FOR EACH ROW EXECUTE PROCEDURE fn_actualizar_horas_reales();

-- 4) Trigger para crear notificación al asignar tarea a un colaborador (on INSERT or when assignment changes)
CREATE OR REPLACE FUNCTION fn_notificar_asignacion() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.id_colaborador IS NOT NULL) THEN
      INSERT INTO notificacion (id_usuario, tipo, mensaje, fecha_envio)
      VALUES (NEW.id_colaborador, 'Tarea asignada', CONCAT('Se le asignó la tarea: ', NEW.titulo), now());
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.id_colaborador IS NOT NULL AND OLD.id_colaborador IS DISTINCT FROM NEW.id_colaborador) THEN
      INSERT INTO notificacion (id_usuario, tipo, mensaje, fecha_envio)
      VALUES (NEW.id_colaborador, 'Tarea reasignada', CONCAT('Se le reasignó la tarea: ', NEW.titulo), now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificar_asignacion AFTER INSERT OR UPDATE ON tarea
FOR EACH ROW EXECUTE PROCEDURE fn_notificar_asignacion();

-- 5) Función para calcular % de avance del proyecto (por horas)
CREATE OR REPLACE FUNCTION fn_avance_proyecto(p_id_proyecto INT) RETURNS NUMERIC AS $$
DECLARE
  total_estimadas NUMERIC;
  total_reales NUMERIC;
  porcentaje NUMERIC;
BEGIN
  SELECT COALESCE(SUM(t.horas_estimadas),0), COALESCE(SUM(t.horas_reales),0)
  INTO total_estimadas, total_reales
  FROM tarea t
  JOIN planificacion_semanal p ON t.id_planificacion = p.id_planificacion
  WHERE p.id_proyecto = p_id_proyecto;

  IF total_estimadas = 0 THEN
    porcentaje := CASE WHEN total_reales = 0 THEN 0 ELSE 100 END;
  ELSE
    porcentaje := (total_reales / total_estimadas) * 100;
  END IF;

  RETURN ROUND(porcentaje::numeric,2);
END;
$$ LANGUAGE plpgsql;

-- 6) Función para calcular % de avance de una planificación semanal
CREATE OR REPLACE FUNCTION fn_avance_planificacion(p_id_planificacion INT) RETURNS NUMERIC AS $$
DECLARE
  total_estimadas NUMERIC;
  total_reales NUMERIC;
  porcentaje NUMERIC;
BEGIN
  SELECT COALESCE(SUM(horas_estimadas),0), COALESCE(SUM(horas_reales),0)
  INTO total_estimadas, total_reales
  FROM tarea
  WHERE id_planificacion = p_id_planificacion;

  IF total_estimadas = 0 THEN
    porcentaje := CASE WHEN total_reales = 0 THEN 0 ELSE 100 END;
  ELSE
    porcentaje := (total_reales / total_estimadas) * 100;
  END IF;

  RETURN ROUND(porcentaje::numeric,2);
END;
$$ LANGUAGE plpgsql;

-- 7) Ejemplo de función que devuelve tareas críticas (pendientes y atrasadas)
CREATE OR REPLACE FUNCTION fn_tareas_pendientes_por_proyecto(p_id_proyecto INT) RETURNS TABLE (
  id_tarea INT,
  titulo TEXT,
  colaborador INT,
  estado TEXT,
  fecha_programada DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id_tarea, t.titulo, t.id_colaborador, t.estado, t.fecha_programada
  FROM tarea t
  JOIN planificacion_semanal p ON t.id_planificacion = p.id_planificacion
  WHERE p.id_proyecto = p_id_proyecto
    AND t.estado <> 'Completada'
  ORDER BY t.fecha_programada NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 8) Trigger para mantener auditoría de cambios en usuario (por ejemplo, creación/actualización)
CREATE TRIGGER trg_aud_usuario AFTER INSERT OR UPDATE OR DELETE ON usuario
FOR EACH ROW EXECUTE PROCEDURE fn_auditar('Usuario modificado');

-- -------------------------
-- FIN DEL SCRIPT
-- -------------------------
