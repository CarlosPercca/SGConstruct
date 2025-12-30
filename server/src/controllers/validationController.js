const pool = require('../db');

const registerHours = async (req, res) => {
  const { id_tarea, id_usuario, horas_registradas } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO avance_tarea (id_tarea, id_usuario, horas_registradas, estado_validacion, fecha)
       VALUES ($1, $2, $3, 'Pendiente', now())
       RETURNING *`,
      [id_tarea, id_usuario, horas_registradas]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar horas' });
  }
};

const getValidations = async (req, res) => {
  try {
    const query = `
      SELECT a.*, 
             u.nombre || ' ' || u.apellido as usuario_nombre,
             t.titulo as tarea_titulo
      FROM avance_tarea a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      LEFT JOIN tarea t ON a.id_tarea = t.id_tarea
      ORDER BY a.fecha DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener validaciones' });
  }
};

const validateAvance = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE avance_tarea 
       SET estado_validacion = $1, motivo_rechazo = $2
       WHERE id_avance = $3
       RETURNING *`,
      [status, reason, id]
    );
    const avance = result.rows[0];

    // Notify Collaborator
    if (avance) {
      const taskRes = await client.query('SELECT titulo FROM tarea WHERE id_tarea = $1', [avance.id_tarea]);
      const taskTitle = taskRes.rows[0]?.titulo || 'Tarea desconocida';
      
      const msg = status === 'Aprobado' 
        ? `Sus horas reportadas para "${taskTitle}" han sido aprobadas.`
        : `Sus horas reportadas para "${taskTitle}" han sido RECHAZADAS. Motivo: ${reason}`;

      await client.query(
        `INSERT INTO notificacion (id_usuario, tipo, mensaje, fecha_envio)
         VALUES ($1, $2, $3, now())`,
        [avance.id_usuario, 'Validación de Horas', msg]
      );
    }

    await client.query('COMMIT');
    res.json(avance);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al validar avance' });
  } finally {
    client.release();
  }
};

module.exports = { registerHours, getValidations, validateAvance };
