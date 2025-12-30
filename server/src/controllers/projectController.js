const pool = require('../db');

const getProjects = async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             fn_avance_proyecto(p.id_proyecto) as progreso,
             COALESCE(array_agg(a.nombre) FILTER (WHERE a.nombre IS NOT NULL), '{}') as areas_nombres
      FROM proyecto p
      LEFT JOIN proyecto_area pa ON p.id_proyecto = pa.id_proyecto
      LEFT JOIN area a ON pa.id_area = a.id_area
      GROUP BY p.id_proyecto
      ORDER BY p.id_proyecto
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
};

const createProject = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { codigo, nombre, cliente, ubicacion, fecha_inicio, fecha_fin, presupuesto, areas_nombres } = req.body;

    // Insert Project
    const projectResult = await client.query(
      `INSERT INTO proyecto (codigo, nombre, cliente, ubicacion, fecha_inicio, fecha_fin, presupuesto, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Planificado')
       RETURNING *`,
      [codigo, nombre, cliente, ubicacion, fecha_inicio, fecha_fin, presupuesto]
    );
    const newProject = projectResult.rows[0];

    // Insert Areas
    if (areas_nombres && areas_nombres.length > 0) {
      for (const areaName of areas_nombres) {
        const areaRes = await client.query('SELECT id_area FROM area WHERE nombre = $1', [areaName]);
        if (areaRes.rows.length > 0) {
          await client.query(
            'INSERT INTO proyecto_area (id_proyecto, id_area) VALUES ($1, $2)',
            [newProject.id_proyecto, areaRes.rows[0].id_area]
          );
        }
      }
    }

    // Create Default Planificacion Semanal
    const currentYear = new Date().getFullYear();
    await client.query(
      'INSERT INTO planificacion_semanal (id_proyecto, semana, anio) VALUES ($1, 1, $2)',
      [newProject.id_proyecto, currentYear]
    );

    await client.query('COMMIT');
    res.json(newProject);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al crear proyecto' });
  } finally {
    client.release();
  }
};

const getMilestones = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM hito_proyecto WHERE id_proyecto = $1', [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener hitos' });
  }
};

const getVersions = async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM version_proyecto WHERE id_proyecto = $1', [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener versiones' });
  }
};

module.exports = { getProjects, createProject, getMilestones, getVersions };
