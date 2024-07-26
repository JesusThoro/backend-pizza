const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Asegúrate de que la contraseña sea la correcta para tu base de datos
    database: 'basededatos',
});

DB.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexión exitosa');
});

// Ruta para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
    const query = 'SELECT * FROM clientes';
    DB.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

// Ruta para registrar un nuevo usuario
app.post('/register_user', (req, res) => {
    const { nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id } = req.body;
    const query = 'INSERT INTO clientes (nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id) VALUES (?, ?, ?, ?, ?, ?)';
    DB.query(query, [nombre_completo, telefono, email, direccion, especificaciones_direccion, rol_id], (err, result) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }
        res.json({ message: 'Usuario registrado exitosamente' });
    });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { fullName, number } = req.body;
    const query = 'SELECT id, nombre_completo, telefono, rol_id FROM clientes WHERE nombre_completo = ? AND telefono = ?';
    DB.query(query, [fullName, number], (err, result) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            res.status(500).send(err);
            return;
        }
        if (result.length > 0) {
            const user = result[0];
            res.json({
                message: 'Inicio de sesión exitoso',
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
    });
});

// Ruta para obtener todos los productos
app.get('/productos', (req, res) => {
    const query = "SELECT * FROM productos";
    DB.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

// Ruta para agregar un nuevo producto
app.post('/productos', (req, res) => {
    const { name, description, price_small, price_medium, price_large, cheese_crust_price } = req.body;
    const query = "INSERT INTO productos (name, description, price_small, price_medium, price_large, cheese_crust_price) VALUES (?, ?, ?, ?, ?, ?)";
    DB.query(query, [name, description, price_small, price_medium, price_large, cheese_crust_price], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Producto agregado exitosamente' });
    });
});

// Ruta para actualizar un producto
app.put('/productos/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, price_small, price_medium, price_large, cheese_crust_price } = req.body;
    const query = "UPDATE productos SET name = ?, description = ?, price_small = ?, price_medium = ?, price_large = ?, cheese_crust_price = ? WHERE id = ?";
    DB.query(query, [name, description, price_small, price_medium, price_large, cheese_crust_price, id], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Producto actualizado exitosamente' });
    });
});

// Ruta para eliminar un producto
app.delete('/productos/:id', (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM productos WHERE id = ?";
    DB.query(query, [id], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Producto eliminado exitosamente' });
    });
});

// Ruta para registrar un nuevo pedido
app.post('/register_order', (req, res) => {
    const orders = req.body;
    const cliente_id = orders[0].cliente_id;

    // Insertar en la tabla pedido_pizza
    const queryPedidoPizza = 'INSERT INTO pedido_pizza (cliente_id, fecha_pedido) VALUES (?, NOW())';

    DB.query(queryPedidoPizza, [cliente_id], (err, result) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            res.status(500).json({ error: 'Error interno del servidor al registrar el pedido' });
            return;
        }
        const pedido_pizza_id = result.insertId;

        // Preparar los detalles del pedido
        const queryPedidoPizzaDetalle = 'INSERT INTO pedido_pizza_detalle (pedido_pizza_id, producto_id, tamaño, cantidad, precio) VALUES ?';
        const values = orders.map(order => [
            pedido_pizza_id,
            order.producto_id,
            order.tamano,
            order.cantidad,
            order.precio
        ]);

        // Insertar en la tabla pedido_pizza_detalle
        DB.query(queryPedidoPizzaDetalle, [values], (err, result) => {
            if (err) {
                console.error('Error en la consulta SQL:', err);
                res.status(500).json({ error: 'Error interno del servidor al registrar los detalles del pedido' });
                return;
            }
            res.json({ message: 'Pedido registrado exitosamente' });
        });
    });
});

// Ruta para obtener los pedidos agrupados por cliente_id
app.get('/pedidos', (req, res) => {
    const query = `
        SELECT 
            pp.cliente_id,
            GROUP_CONCAT(p.name ORDER BY ppd.id SEPARATOR ', ') AS nombre_pizza,
            GROUP_CONCAT(ppd.tamaño ORDER BY ppd.id SEPARATOR ', ') AS tamano,
            GROUP_CONCAT(ppd.cantidad ORDER BY ppd.id SEPARATOR ', ') AS cantidad,
            GROUP_CONCAT(ppd.precio ORDER BY ppd.id SEPARATOR ', ') AS precio
        FROM pedido_pizza pp
        JOIN pedido_pizza_detalle ppd ON pp.id = ppd.pedido_pizza_id
        JOIN productos p ON ppd.producto_id = p.id
        GROUP BY pp.cliente_id
    `;

    DB.query(query, (err, result) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

// Ruta para obtener los pedidos de un usuario específico
app.get('/pedidos/:cliente_id', (req, res) => {
    const { cliente_id } = req.params;
    const query = `
        SELECT 
            p.name AS nombre_pizza,
            ppd.tamaño AS tamano,
            ppd.cantidad AS cantidad,
            ppd.precio AS precio
        FROM pedido_pizza pp
        JOIN pedido_pizza_detalle ppd ON pp.id = ppd.pedido_pizza_id
        JOIN productos p ON ppd.producto_id = p.id
        WHERE pp.cliente_id = ?
    `;

    DB.query(query, [cliente_id], (err, result) => {
        if (err) {
            console.error('Error en la consulta SQL:', err);
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
