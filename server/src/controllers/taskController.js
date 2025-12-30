const pool = require('../db');

const getTasks = async (req, res) => {
  const { userId, roleId } = req.query;
  try {
    let query = `
      SELECT t.*, 
             u.nombre || ' ' || u.apellido as colaborador_nombre,
             a.nombre as colaborador_area,
             pr.nombre as proyecto_nombre,
             (t.tipo = 'No Prevista') as es_emergencia,
             dt.id_tarea_principal as id_tarea_dependiente
      FROM tarea t
      LEFT JOIN usuario u ON t.id_colaborador = u.id_usuario
      LEFT JOIN area a ON u.id_area = a.id_area
      LEFT JOIN planificacion_semanal ps ON t.id_planificacion = ps.id_planificacion
      LEFT JOIN proyecto pr ON ps.id_proyecto = pr.id_proyecto
      LEFT JOIN dependencia_tarea dt ON t.id_tarea = dt.id_tarea_dependiente
    `;

    const params = [];
    if (roleId == 3 && userId) { // Colaborador
      query += ' WHERE t.id_colaborador = $1';
      params.push(userId);
    }

    query += ' ORDER BY t.id_tarea';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tareas' });
  }
};

const getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tarea WHERE id_tarea = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tarea' });
  }
};

const createTask = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { projectId, id_colaborador, titulo, descripcion, fecha_programada, horas_estimadas, es_emergencia, id_tarea_dependiente } = req.body;

    // Find or Create Planificacion
    let planId;
    if (projectId) {
      const planRes = await client.query('SELECT id_planificacion FROM planificacion_semanal WHERE id_proyecto = $1 LIMIT 1', [projectId]);
      if (planRes.rows.length > 0) {
        planId = planRes.rows[0].id_planificacion;
      } else {
        const newPlan = await client.query(
          'INSERT INTO planificacion_semanal (id_proyecto, semana, anio) VALUES ($1, 1, $2) RETURNING id_planificacion',
          [projectId, new Date().getFullYear()]
        );
        planId = newPlan.rows[0].id_planificacion;
      }
    }

    const tipo = es_emergencia ? 'No Prevista' : 'Programada';
    
    const taskRes = await client.query(
      `INSERT INTO tarea (id_planificacion, id_colaborador, titulo, descripcion, fecha_programada, horas_estimadas, tipo, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendiente')
       RETURNING *`,
      [planId, id_colaborador, titulo, descripcion, fecha_programada, horas_estimadas, tipo]
    );
    const newTask = taskRes.rows[0];

    if (es_emergencia && id_tarea_dependiente) {
      await client.query(
        'INSERT INTO dependencia_tarea (id_tarea_principal, id_tarea_dependiente) VALUES ($1, $2)',
        [id_tarea_dependiente, newTask.id_tarea]
      );
    }

    await client.query('COMMIT');
    res.json(newTask);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al crear tarea' });
  } finally {
    client.release();
  }
};

const updateTask = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id_tarea, titulo, descripcion, fecha_programada, horas_estimadas, id_tarea_dependiente } = req.body;

    const taskRes = await client.query(
      `UPDATE tarea 
       SET titulo = $1, descripcion = $2, fecha_programada = $3, horas_estimadas = $4
       WHERE id_tarea = $5
       RETURNING *`,
      [titulo, descripcion, fecha_programada, horas_estimadas, id_tarea]
    );

    if (id_tarea_dependiente) {
      // Remove old dependency
      await client.query('DELETE FROM dependencia_tarea WHERE id_tarea_dependiente = $1', [id_tarea]);
      // Add new dependency
      await client.query(
        'INSERT INTO dependencia_tarea (id_tarea_principal, id_tarea_dependiente) VALUES ($1, $2)',
        [id_tarea_dependiente, id_tarea]
      );
    }

    await client.query('COMMIT');
    res.json(taskRes.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar tarea' });
  } finally {
    client.release();
  }
};

const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE tarea SET estado = $1 WHERE id_tarea = $2 RETURNING *',
      [estado, id]
    );
    const task = result.rows[0];

    // Notifications Logic
    if (task) {
      // 1. Notify Manager when task is "Por Aprobar"
      if (estado === 'Por Aprobar') {
        // Find Jefe de Area of the collaborator
        const managerRes = await client.query(`
          SELECT u.id_usuario 
          FROM usuario u 
          JOIN usuario colab ON u.id_area = colab.id_area 
          WHERE colab.id_usuario = $1 AND u.id_rol = 2
        `, [task.id_colaborador]);
        
        if (managerRes.rows.length > 0) {
          const managerId = managerRes.rows[0].id_usuario;
          await client.query(
            `INSERT INTO notificacion (id_usuario, tipo, mensaje, fecha_envio)
             VALUES ($1, 'Solicitud Aprobación', $2, now())`,
            [managerId, `El colaborador ha solicitado finalizar la tarea: ${task.titulo}`]
          );
        }
      }

      // 2. Notify Collaborator when task is "Completada" (Approved) or "En Progreso" (Rejected from Por Aprobar)
      if (estado === 'Completada' || (estado === 'En Progreso')) {
         // We need to check if it was rejected (moved back to progress) or just started. 
         // For simplicity, we notify on completion. For rejection, the UI usually handles the context, 
         // but let's add a generic notification if it was approved.
         if (estado === 'Completada') {
            await client.query(
              `INSERT INTO notificacion (id_usuario, tipo, mensaje, fecha_envio)
               VALUES ($1, 'Tarea Aprobada', $2, now())`,
              [task.id_colaborador, `Su tarea "${task.titulo}" ha sido aprobada y finalizada.`]
            );
         }
      }
    }

    await client.query('COMMIT');
    res.json(task);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus };
