const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
let pedidos = [];

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
        // Verificar si el número de teléfono ya está registrado
        const [rows] = await DB.query('SELECT * FROM clientes WHERE telefono = ?', [telefono]);

        if (rows.length > 0) {
            // Si el número de teléfono ya está registrado, enviar un error 409 (Conflicto)
            return res.status(409).json({ error: 'El número de teléfono ya está en uso' });
        }

        // Si el número no está en uso, registrar al nuevo usuario
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

app.get('/pedidos', async (req, res) => {
    try {
        const [result] = await DB.query(`
            SELECT pedidos.*, 
                   clientes.nombre_completo, 
                   clientes.direccion,  -- Asegúrate de incluir la dirección aquí
                   detalles_pedido.nombre AS nombre_producto, 
                   detalles_pedido.producto_tipo AS tipo_producto, 
                   detalles_pedido.tamano, 
                   detalles_pedido.cantidad, 
                   detalles_pedido.precio
            FROM pedidos 
            JOIN clientes ON pedidos.cliente_id = clientes.id
            JOIN detalles_pedido ON pedidos.id = detalles_pedido.pedido_id
        `);

        // Verifica si result contiene los datos esperados
        if (result && result.length > 0) {
            res.json(result); // Devuelve el array completo de resultados
        } else {
            res.status(404).send('No se encontraron datos');
        }
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        res.status(500).send('Error al obtener los pedidos');
    }
});

app.patch('/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    const { estado_pedido } = req.body;

    console.log('Actualizar estado del pedido:', { id, estado_pedido });

    if (!estado_pedido) {
        return res.status(400).json({ error: 'Falta el estado del pedido.' });
    }

    try {
        const [result] = await DB.query(`
            UPDATE pedidos 
            SET estado_pedido = ? 
            WHERE id = ?
        `, [estado_pedido, id]);

        console.log('Resultado de la actualización:', result);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Estado del pedido actualizado correctamente.' });
        } else {
            res.status(404).json({ error: 'Pedido no encontrado.' });
        }
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ error: 'Error al actualizar el estado del pedido.' });
    }
});

// Ruta para obtener el pedido por ID
app.get('/api/pedidos/:id', (req, res) => {
    const pedidoId = req.params.id;

    DB.query('SELECT id, estado_pedido FROM pedidos WHERE id = ?', [pedidoId], (err, results) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            return res.status(500).json({ error: 'Error al obtener el estado del pedido' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(results[0]);  // Devolver el primer (y único) resultado
    });
});






  
  

// Ruta para obtener los pedidos de un cliente específico
app.get('/pedidos/:cliente_id', async (req, res) => {
    try {
        const { cliente_id } = req.params;
        const [rows] = await DB.query('SELECT * FROM pedidos WHERE cliente_id = ?', [cliente_id]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los pedidos del cliente:', error);
        res.status(500).send('Error en el servidor');
    }
});

app.post('/register_order', async (req, res) => {
    const { userId, items, paymentMethod, transferReference } = req.body;

    console.log('Detalles del pedido recibidos en el servidor:', req.body);

    // Validar los datos del pedido
    if (!userId || !items || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
        return res.status(400).json({ error: 'Faltan datos del pedido o del usuario.' });
    }

    // Validar que cada item tenga los datos necesarios
    for (const item of items) {
        if (!item.productId || !item.productName || !item.productType || !item.quantity || !item.size || !item.totalPrice) {
            return res.status(400).json({ error: 'Faltan detalles en los items del pedido.' });
        }
    }

    const connection = await DB.getConnection();

    try {
        await connection.beginTransaction();

        // Insertar el pedido con el método de pago
        const pedidoQuery = 'INSERT INTO pedidos (cliente_id, fecha, metodo_pago) VALUES (?, NOW(), ?)';
        const [result] = await connection.query(pedidoQuery, [userId, paymentMethod, transferReference]);
        const pedidoId = result.insertId;

        // Insertar detalles del pedido
        const detallesPedidoQuery = `
          INSERT INTO detalles_pedido (pedido_id, producto_id, nombre, producto_tipo, tamano, cantidad, precio)
          VALUES ?
        `;

        const detallesValues = items.map(item => [
            pedidoId,
            item.productId,
            item.productName,
            item.productType,
            item.size,
            item.quantity,
            item.totalPrice
        ]);

        await connection.query(detallesPedidoQuery, [detallesValues]);

        // Confirmar la transacción
        await connection.commit();
        res.status(200).json({ message: 'Pedido registrado exitosamente.' });
    } catch (err) {
        // Revertir la transacción en caso de error
        await connection.rollback();
        console.error('Error al registrar el pedido:', err);
        res.status(500).json({ error: 'Error al registrar el pedido.' });
    } finally {
        // Liberar la conexión
        connection.release();
    }
});


// Ruta para eliminar detalles de pedido relacionados con un pedido
// Ruta para eliminar un pedido
app.patch('/pedidos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await DB.query('UPDATE pedidos SET ? WHERE id = ?', [updateData, id]);
      res.json(result);
    } catch (error) {
      console.error('Error al actualizar el pedido:', error);
      res.status(500).send('Error al actualizar el pedido');
    }
  });
  
  app.delete('/pedidos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await DB.query('DELETE FROM pedidos WHERE id = ?', [id]);
      res.json(result);
    } catch (error) {
      console.error('Error al eliminar el pedido:', error);
      res.status(500).send('Error al eliminar el pedido');
    }
  });


// Ruta para obtener el estado del pedido
app.get('/api/pedidos/:id', (req, res) => {
    const pedidoId = parseInt(req.params.id, 10);
    db.query('SELECT * FROM pedidos WHERE id = ?', [pedidoId], (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error en la consulta' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      res.json(results[0]);
    });
  });
  

  
  

// Ruta para eliminar pedidos relacionados con un cliente
app.delete('/pedidos/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [pedidos] = await DB.query("SELECT id FROM pedidos WHERE cliente_id = ?", [id]);

        for (const pedido of pedidos) {
            await DB.query("DELETE FROM detalles_pedido WHERE id = ?", [pedido.id]);
        }

        await DB.query("DELETE FROM pedidos WHERE cliente_id = ?", [id]);

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

// Rutas para productos de pizzas
app.get('/pizzas', async (req, res) => {
    try {
        const [rows] = await DB.query("SELECT * FROM pizzas");
        res.json(rows);
    } catch (err) {
        res.status(500).send('Error al obtener las pizzas');
    }
});

 
 // Configura la ruta para agregar una pizza
 app.post('/pizzas', upload.single('image'), async (req, res) => {
    const { nombre, descripcion, price_small, price_medium, price_large, cheese_crust_price } = req.body;
    const image = req.file ? req.file.path : null;
  
    if (!nombre || !descripcion || !price_small || !price_medium || !price_large || !cheese_crust_price) {
      return res.status(400).send('Todos los campos son requeridos');
    }
  
    try {
      await DB.query('INSERT INTO pizzas (nombre, descripcion, price_small, price_medium, price_large, cheese_crust_price, url_imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion, price_small, price_medium, price_large, cheese_crust_price, image]
      );
      res.status(201).send('Pizza agregada correctamente');
    } catch (error) {
      console.error('Error al agregar la pizza:', error);
      res.status(500).send('Error al agregar la pizza');
    }
  });
  
  


app.get('/pizzas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await DB.query("SELECT * FROM pizzas WHERE id = ?", [id]);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('Pizza no encontrada');
        }
    } catch (err) {
        res.status(500).send('Error al obtener la pizza');
    }
});

app.put('/pizzas/:id', upload.single('image'), async (req, res) => {
    const id = req.params.id;
    const { nombre, descripcion, price_small, price_medium, price_large, cheese_crust_price } = req.body;
    const image = req.file ? req.file.path : null;
  
    try {
      await DB.query('UPDATE pizzas SET nombre = ?, descripcion = ?, price_small = ?, price_medium = ?, price_large = ?, cheese_crust_price = ?, url_imagen = ? WHERE id = ?',
        [nombre, descripcion, price_small, price_medium, price_large, cheese_crust_price, image, id]
      );
      res.status(200).send('Pizza actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar la pizza:', error);
      res.status(500).send('Error al actualizar la pizza');
    }
  });

app.delete('/pizzas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await DB.query("DELETE FROM pizzas WHERE id = ?", [id]);
        if (result.affectedRows > 0) {
            res.json({ message: 'Pizza eliminada exitosamente' });
        } else {
            res.status(404).send('Pizza no encontrada');
        }
    } catch (err) {
        res.status(500).send('Error al eliminar la pizza');
    }
});

// Rutas para refrescos
app.get('/refrescos', async (req, res) => {
    try {
        const [rows] = await DB.query('SELECT * FROM refrescos');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener los refrescos:', err);
        res.status(500).send('Error al obtener los refrescos');
    }
});

app.post('/refrescos', upload.single('image'), async (req, res) => {
    const { nombre, descripcion, tamano, precio } = req.body;
    const url_imagen = req.file ? req.file.path : null;
  
    console.log('Datos recibidos:', { nombre, descripcion, tamano, precio, url_imagen });
  
    if (!nombre || !descripcion || !precio) {
      return res.status(400).send('Nombre, descripción y precio son campos requeridos');
    }
  
    try {
      await DB.query(
        'INSERT INTO refrescos (nombre, descripcion, tamano, precio, url_imagen) VALUES (?, ?, ?, ?, ?)',
        [nombre, descripcion, tamano || null, precio, url_imagen]
      );
      res.status(201).send('Refresco agregado correctamente');
    } catch (error) {
      console.error('Error al agregar refresco:', error);
      res.status(500).send('Error al agregar refresco');
    }
  });
  
  
  

// Ruta para editar refrescos
app.put('/refrescos/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, tamano } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const query = `UPDATE refrescos SET nombre = ?, descripcion = ?, precio = ?, tamano = ?${image ? ', url_imagen = ?' : ''} WHERE id = ?`;
        const params = [nombre, descripcion, precio, tamano];
        if (image) params.push(image);
        params.push(id);

        await DB.query(query, params);
        res.status(200).send('Refresco actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar el refresco:', error);
        res.status(500).send('Error al actualizar el refresco');
    }
});

app.delete('/refrescos/:id', async (req, res) => {
    try {
        const [result] = await DB.query('DELETE FROM refrescos WHERE id = ?', [req.params.id]);

        if (result.affectedRows > 0) {
            res.send('Refresco eliminado');
        } else {
            res.status(404).send('Refresco no encontrado');
        }
    } catch (err) {
        console.error('Error al eliminar refresco:', err);
        res.status(500).send('Error en el servidor al eliminar refresco');
    }
});

// Rutas para antojitos
app.get('/antojitos', async (req, res) => {
    try {
        const [rows] = await DB.query('SELECT * FROM antojitos');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los antojitos:', error);
        res.status(500).json({ message: 'Error al obtener los antojitos' });
    }
});

app.post('/antojitos', upload.single('image'), async (req, res) => {
    const { nombre, descripcion, precio } = req.body;
    const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
  
    try {
      // Verifica si los campos no están vacíos
      if (!nombre || !descripcion || !precio) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
      }
  
      const [result] = await DB.query('INSERT INTO antojitos (nombre, descripcion, precio, url_imagen) VALUES (?, ?, ?, ?)', [nombre, descripcion, precio, imageUrl]);
  
      res.status(201).json({ id: result.insertId });
    } catch (error) {
      console.error('Error al añadir antojito:', error);
      res.status(500).json({ message: 'Error al añadir antojito' });
    }
  });
  

// Ruta para editar antojitos
app.put('/antojitos/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio } = req.body;
    const image = req.file ? req.file.path : null;

    try {
        const query = `UPDATE antojitos SET nombre = ?, descripcion = ?, precio = ?${image ? ', url_imagen = ?' : ''} WHERE id = ?`;
        const params = [nombre, descripcion, precio];
        if (image) params.push(image);
        params.push(id);

        await DB.query(query, params);
        res.status(200).send('Antojito actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar el antojito:', error);
        res.status(500).send('Error al actualizar el antojito');
    }
});

app.delete('/antojitos/:id', async (req, res) => {
    try {
        const [result] = await DB.query('DELETE FROM antojitos WHERE id = ?', [req.params.id]);

        if (result.affectedRows > 0) {
            res.send('Antojito eliminado');
        } else {
            res.status(404).send('Antojito no encontrado');
        }
    } catch (error) {
        console.error('Error al eliminar antojito:', error);
        res.status(500).send('Error en el servidor al eliminar antojito');
    }
});

app.post('/api/pedidos', async (req, res) => {
    const { cliente_id, fecha } = req.body;
    // Inserta el nuevo pedido en la base de datos
  });

app.post('/api/detalles_pedido', async (req, res) => {
    const { pedido_id, tipo_producto, producto_id, tamano, cantidad, precio } = req.body;
    // Inserta los detalles del pedido en la base de datos
  });

app.get('/api/pedidos/:id', async (req, res) => {
    const pedidoId = req.params.id;
    // Obtén el pedido y sus detalles de la base de datos
  });
  
  
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
