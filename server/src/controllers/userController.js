const pool = require('../db');

const getUsers = async (req, res) => {
  const { requesterId } = req.query;
  try {
    let query = `
      SELECT u.*, r.nombre as rol_nombre, a.nombre as area_nombre
      FROM usuario u
      LEFT JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN area a ON u.id_area = a.id_area
    `;
    
    const params = [];
    
    if (requesterId) {
      const requesterRes = await pool.query('SELECT id_rol, id_area FROM usuario WHERE id_usuario = $1', [requesterId]);
      if (requesterRes.rows.length > 0) {
        const requester = requesterRes.rows[0];
        if (requester.id_rol === 2) { // Jefe de Área
          query += ' WHERE u.id_area = $1';
          params.push(requester.id_area);
        }
      }
    }
    
    query += ' ORDER BY u.id_usuario';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

const createUser = async (req, res) => {
  const { nombre, apellido, correo, contrasena_hash, id_rol, id_area, estado } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO usuario (nombre, apellido, correo, contrasena_hash, id_rol, id_area, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre, apellido, correo, contrasena_hash, id_rol, id_area, estado]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ message: error.message || 'Error al crear usuario' });
  }
};

const updateUser = async (req, res) => {
  const { id_usuario, nombre, apellido, correo, id_rol, id_area, estado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE usuario 
       SET nombre = $1, apellido = $2, correo = $3, id_rol = $4, id_area = $5, estado = $6
       WHERE id_usuario = $7
       RETURNING *`,
      [nombre, apellido, correo, id_rol, id_area, estado, id_usuario]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ message: error.message || 'Error al actualizar usuario' });
  }
};

const getUserStats = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        COUNT(*)::int as "totalTareas",
        COUNT(*) FILTER (WHERE estado = 'Completada')::int as completadas,
        COUNT(*) FILTER (WHERE estado <> 'Completada')::int as pendientes,
        COALESCE(SUM(horas_reales), 0) as "horasTotales",
        COALESCE(SUM(horas_estimadas), 0) as "horasEstimadasTotal"
      FROM tarea
      WHERE id_colaborador = $1
    `;
    const result = await pool.query(query, [id]);
    const stats = result.rows[0];
    
    const eficiencia = stats.totalTareas > 0 
      ? Math.round((stats.completadas / stats.totalTareas) * 100) 
      : 0;

    res.json({ ...stats, eficiencia });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

module.exports = { getUsers, createUser, updateUser, getUserStats };
