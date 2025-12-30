const pool = require('../db');

const getProjectStats = async (req, res) => {
  try {
    // Monthly Hours (Real hours registered in validations)
    const hoursQuery = `
      SELECT 
        TO_CHAR(fecha, 'Mon') as name,
        COALESCE(SUM(horas_registradas), 0) as horas
      FROM avance_tarea
      WHERE fecha >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(fecha, 'Mon'), DATE_TRUNC('month', fecha)
      ORDER BY DATE_TRUNC('month', fecha)
    `;
    const hoursRes = await pool.query(hoursQuery);

    // Progress Curve (Simulated based on tasks completed vs total over weeks)
    // This is a simplified view. Real S-Curve requires planned vs actual dates.
    const progressQuery = `
      SELECT 
        'Sem ' || CAST(EXTRACT(WEEK FROM fecha_programada) AS INTEGER) as name,
        CAST(
          COUNT(*) FILTER (WHERE estado = 'Completada') * 100.0 / NULLIF(COUNT(*), 0) 
        AS INTEGER) as avance
      FROM tarea
      WHERE fecha_programada >= NOW() - INTERVAL '8 weeks'
      GROUP BY EXTRACT(WEEK FROM fecha_programada)
      ORDER BY EXTRACT(WEEK FROM fecha_programada)
    `;
    const progressRes = await pool.query(progressQuery);

    res.json({
      monthlyHours: hoursRes.rows,
      progressCurve: progressRes.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
};

module.exports = { getProjectStats };
