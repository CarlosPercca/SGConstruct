const pool = require('../db');

const getAreas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM area ORDER BY id_area');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener áreas' });
  }
};

const createArea = async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO area (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear área' });
  }
};

const toggleAreaStatus = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if 'estado' column exists, if not we might need to alter table or handle it.
    // Assuming the user will add the column as requested.
    const check = await pool.query('SELECT estado FROM area WHERE id_area = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ message: 'Área no encontrada' });
    
    const newStatus = !check.rows[0].estado;
    const result = await pool.query(
      'UPDATE area SET estado = $1 WHERE id_area = $2 RETURNING *',
      [newStatus, id]
    );
    
    // Audit handled by trigger if configured, or manually here if not
    // The provided SQL script doesn't have trigger for area, so we add manual audit if needed, 
    // but let's stick to the requested scope.
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar estado de área' });
  }
};

const deleteArea = async (req, res) => {
  const { id } = req.params;
  try {
    // Validations
    const userCheck = await pool.query('SELECT 1 FROM usuario WHERE id_area = $1 AND estado = true', [id]);
    if (userCheck.rows.length > 0) return res.status(400).json({ message: 'No se puede eliminar: Tiene usuarios activos asignados.' });

    const projectCheck = await pool.query('SELECT 1 FROM proyecto_area WHERE id_area = $1', [id]);
    if (projectCheck.rows.length > 0) return res.status(400).json({ message: 'No se puede eliminar: Está asignada a proyectos.' });

    const areaCheck = await pool.query('SELECT estado FROM area WHERE id_area = $1', [id]);
    if (areaCheck.rows.length > 0 && areaCheck.rows[0].estado) {
        return res.status(400).json({ message: 'Primero debe deshabilitar el área.' });
    }

    await pool.query('DELETE FROM area WHERE id_area = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar área' });
  }
};

module.exports = { getAreas, createArea, toggleAreaStatus, deleteArea };
