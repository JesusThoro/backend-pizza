const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
const DB = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // Asegúrate de que la contraseña sea la correcta para tu base de datos
    database: 'basededatos',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware para verificar el token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, 'tu_clave_secreta', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Ruta para obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const [rows] = await DB.query('SELECT * FROM clientes');
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Ruta para registrar un nuevo usuario
app.post('/register_user', async (req, res) => {
    const { nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id } = req.body;
    try {
        await DB.query('INSERT INTO clientes (nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id) VALUES (?, ?, ?, ?, ?, ?)', [nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id]);
        res.json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        console.error('Error en la consulta SQL:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener los datos del perfil del usuario
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const query = 'SELECT nombre_completo, email, telefono, direccion, especificaciones_direccion FROM clientes WHERE id = ?';

    try {
        const [results] = await DB.query(query, [userId]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (err) {
        console.error('Error al obtener los datos del usuario:', err);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para obtener un usuario por ID
app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const [results] = await DB.query('SELECT * FROM clientes WHERE id = ?', [userId]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (err) {
        console.error('Error al obtener los datos del usuario:', err);
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
    const { fullName, number } = req.body;
    try {
        const [rows] = await DB.query('SELECT id, nombre_completo, telefono, rol_id FROM clientes WHERE nombre_completo = ? AND telefono = ?', [fullName, number]);
        if (rows.length > 0) {
            const user = rows[0];
            const token = jwt.sign({ id: user.id, rol_id: user.rol_id }, 'tu_clave_secreta', { expiresIn: '1h' });

            res.json({
                message: 'Inicio de sesión exitoso',
                token,
                user: {
                    id: user.id,
                    nombre_completo: user.nombre_completo,
                    telefono: user.telefono,
                    rol_id: user.rol_id,
                },
            });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    } catch (err) {
        console.error('Error en la consulta SQL:', err);
        res.status(500).send(err);
    }
});

// Ruta para obtener todos los pedidos
app.get('/pedidos', (req, res) => {
  try {
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener los pedidos de un cliente específico
app.get('/pedidos/:cliente_id', (req, res) => {
  try {
    const { cliente_id } = req.params;
    const pedidosCliente = pedidos.filter(pedido => pedido.cliente_id == cliente_id);
    res.json(pedidosCliente);
  } catch (error) {
    console.error('Error al obtener los pedidos del cliente:', error);
    res.status(500).send('Error en el servidor');
  }
});


app.post('/register_order', async (req, res) => {
    const { cliente_id, producto_id, tamano, cantidad, precio } = req.body;
    try {
        const result = await DB.query(
            'INSERT INTO pedidos (cliente_id, producto_id, tamano, cantidad, precio) VALUES (?, ?, ?, ?, ?)',
            [cliente_id, producto_id, tamano, cantidad, precio]
        );
        res.status(201).json({ message: 'Pedido registrado exitosamente', orderId: result.insertId });
    } catch (err) {
        console.error('Error al registrar el pedido:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para eliminar detalles de pedido relacionados con un pedido
app.delete('/detalles/pedido/:pedidoId', async (req, res) => {
    const { pedidoId } = req.params;
    try {
        await DB.query("DELETE FROM pedido_pizza_detalle WHERE pedido_pizza_id = ?", [pedidoId]);
        res.json({ message: 'Detalles de pedido eliminados exitosamente' });
    } catch (err) {
        console.error('Error al eliminar detalles de pedido:', err);
        res.status(500).send(err);
    }
});

// Ruta para eliminar pedidos relacionados con un cliente
app.delete('/pedidos/cliente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [pedidos] = await DB.query("SELECT id FROM pedido_pizza WHERE cliente_id = ?", [id]);

        for (const pedido of pedidos) {
            await DB.query("DELETE FROM pedido_pizza_detalle WHERE pedido_pizza_id = ?", [pedido.id]);
        }

        await DB.query("DELETE FROM pedido_pizza WHERE cliente_id = ?", [id]);

        res.json({ message: 'Pedidos y sus detalles eliminados exitosamente' });
    } catch (err) {
        console.error('Error al eliminar pedidos y detalles:', err);
        res.status(500).send(err);
    }
});

// Ruta para eliminar un cliente
app.delete('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await axios.delete(`http://localhost:3001/pedidos/cliente/${id}`);
        await DB.query("DELETE FROM clientes WHERE id = ?", [id]);

        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar cliente:', err);
        res.status(500).send(err);
    }
});

// Ruta para actualizar un cliente
app.put('/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id } = req.body;

    const query = 'UPDATE clientes SET nombre_completo = ?, telefono = ?, email = ?, direccion = ?, especificaciones_direccion = ?, rol_id = ? WHERE id = ?';

    try {
        const [result] = await DB.query(query, [nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id, id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Usuario actualizado correctamente' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error en el servidor', error });
    }
});

// Configura la carpeta uploads como estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configura multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta para guardar las imágenes
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ruta para agregar un nuevo producto
app.post('/productos', upload.single('imagen'), async (req, res) => {
    const { nombre, descripcion, tamano, precio, tipo } = req.body;
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let query;
    let params;

    if (tipo === 'Pizza') {
        query = 'INSERT INTO pizzas (nombre, descripcion, tamano, precio, imagen_url) VALUES (?, ?, ?, ?, ?)';
        params = [nombre, descripcion, tamano, precio, imagenUrl];
    } else if (tipo === 'Refresco') {
        query = 'INSERT INTO refrescos (nombre, descripcion, tamano, precio, imagen_url) VALUES (?, ?, ?, ?, ?)';
        params = [nombre, descripcion, tamano, precio, imagenUrl];
    } else if (tipo === 'Antojito') {
        query = 'INSERT INTO antojitos (nombre, descripcion, precio, imagen_url) VALUES (?, ?, ?, ?)';
        params = [nombre, descripcion, precio, imagenUrl];
    }

    try {
        const [result] = await DB.query(query, params);
        res.status(201).json({ message: 'Producto agregado exitosamente', productoId: result.insertId });
    } catch (err) {
        console.error('Error al agregar el producto:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
