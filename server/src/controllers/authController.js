const pool = require('../db');

const login = async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.*, r.nombre as rol_nombre, a.nombre as area_nombre 
       FROM usuario u 
       LEFT JOIN rol r ON u.id_rol = r.id_rol 
       LEFT JOIN area a ON u.id_area = a.id_area 
       WHERE u.correo = $1`,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // In a real app, compare hashed password using bcrypt
    // For this legacy/mock migration, we compare directly as per provided SQL data
    if (user.contrasena_hash !== contrasena) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    if (!user.estado) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Log login
    await pool.query(
      `INSERT INTO auditoria (id_usuario, entidad, id_entidad, accion, detalle, fecha)
       VALUES ($1, 'usuario', $1, 'LOGIN', 'Inicio de sesión', now())`,
      [user.id_usuario]
    );

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const recoverPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuario WHERE correo = $1', [email]);
    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Correo no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login, recoverPassword };
