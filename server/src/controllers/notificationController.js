const pool = require('../db');

const getNotifications = async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(
      'SELECT * FROM notificacion WHERE id_usuario = $1 ORDER BY fecha_envio DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notificacion SET leido = TRUE WHERE id_notificacion = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
};

module.exports = { getNotifications, markAsRead };
