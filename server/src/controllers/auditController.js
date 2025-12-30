const pool = require('../db');

const getLogs = async (req, res) => {
  try {
    const query = `
      SELECT a.*, 
             COALESCE(u.nombre || ' ' || u.apellido, 'Sistema') as usuario_nombre
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.fecha DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener auditoría' });
  }
};

module.exports = { getLogs };
