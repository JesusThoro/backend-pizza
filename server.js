const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
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

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Guardar archivo con nombre único
    }
});

const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

// Ruta para obtener todos los productos de las tres tablas
app.get('/productos', (req, res) => {
    const query = `
        SELECT id, name, description, price, price_small, price_medium, price_large, cheese_crust_price, url_imagen, 'pizza' AS tipo FROM pizzas
        UNION ALL
        SELECT id, name, description, NULL AS price, NULL AS price_small, NULL AS price_medium, NULL AS price_large, NULL AS cheese_crust_price, url_imagen, 'refresco' AS tipo FROM refrescos
        UNION ALL
        SELECT id, name, description, price, NULL AS price_small, NULL AS price_medium, NULL AS price_large, NULL AS cheese_crust_price, url_imagen, 'antojo' AS tipo FROM antojitos
    `;
    DB.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

// Ruta para agregar un nuevo producto
app.post('/productos', upload.single('image'), (req, res) => {
    const { name, description, price, price_small, price_medium, price_large, cheese_crust_price, tipo, size } = req.body;
    const imageUrl = req.file ? `http://localhost:3001/uploads/${req.file.filename}` : null;

    let query;
    let values;

    if (tipo === 'pizza') {
        query = "INSERT INTO pizzas (name, description, price_small, price_medium, price_large, cheese_crust_price, url_imagen) VALUES (?, ?, ?, ?, ?, ?, ?)";
        values = [name, description, price_small, price_medium, price_large, cheese_crust_price, imageUrl];
    } else if (tipo === 'refresco') {
        query = "INSERT INTO refrescos (name, description, size, price, url_imagen) VALUES (?, ?, ?, ?, ?)";
        values = [name, description, size, price, imageUrl];
    } else if (tipo === 'antojo') {
        query = "INSERT INTO antojitos (name, description, price, url_imagen) VALUES (?, ?, ?, ?)";
        values = [name, description, price, imageUrl];
    } else {
        return res.status(400).json({ message: 'Tipo de producto no válido' });
    }

    DB.query(query, values, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'Producto agregado exitosamente' });
    });
});

// Ruta para actualizar un producto
app.put('/productos/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, description, price, price_small, price_medium, price_large, cheese_crust_price, tipo, oldImage } = req.body;
    let updateQuery;
    let updateValues;

    if (req.file) {
        const newImagePath = `http://localhost:3001/uploads/${req.file.filename}`;
        if (tipo === 'pizza') {
            updateQuery = "UPDATE pizzas SET name = ?, description = ?, price_small = ?, price_medium = ?, price_large = ?, cheese_crust_price = ?, url_imagen = ? WHERE id = ?";
            updateValues = [name, description, price_small, price_medium, price_large, cheese_crust_price, newImagePath, id];
        } else if (tipo === 'refresco') {
            updateQuery = "UPDATE refrescos SET name = ?, description = ?, size = ?, price = ?, url_imagen = ? WHERE id = ?";
            updateValues = [name, description, req.body.size, price, newImagePath, id];
        } else if (tipo === 'antojo') {
            updateQuery = "UPDATE antojitos SET name = ?, description = ?, price = ?, url_imagen = ? WHERE id = ?";
            updateValues = [name, description, price, newImagePath, id];
        } else {
            return res.status(400).json({ message: 'Tipo de producto no válido' });
        }

        // Eliminar la imagen anterior si existe
        if (oldImage) {
            const oldImagePath = path.join(__dirname, oldImage.replace('http://localhost:3001/uploads/', ''));
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) {
                        console.error(`Error deleting old image: ${err}`);
                        return res.status(500).json({ message: 'Error deleting old image' });
                    }
                    console.log('Old image deleted successfully.');
                });
            } else {
                console.log(`Old image not found at: ${oldImagePath}`);
            }
        }
    } else {
        if (tipo === 'pizza') {
            updateQuery = "UPDATE pizzas SET name = ?, description = ?, price_small = ?, price_medium = ?, price_large = ?, cheese_crust_price = ? WHERE id = ?";
            updateValues = [name, description, price_small, price_medium, price_large, cheese_crust_price, id];
        } else if (tipo === 'refresco') {
            updateQuery = "UPDATE refrescos SET name = ?, description = ?, size = ?, price = ? WHERE id = ?";
            updateValues = [name, description, req.body.size, price, id];
        } else if (tipo === 'antojo') {
            updateQuery = "UPDATE antojitos SET name = ?, description = ?, price = ? WHERE id = ?";
            updateValues = [name, description, price, id];
        } else {
            return res.status(400).json({ message: 'Tipo de producto no válido' });
        }
    }

    DB.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).send(err);
        }
        res.json({ message: 'Producto actualizado exitosamente' });
    });
});

// Ruta para eliminar un producto
app.delete('/productos/:id', (req, res) => {
    const { id } = req.params;

    // Primero, obtén el nombre del archivo de la imagen asociada al producto
    DB.query('SELECT url_imagen, tipo FROM pizzas WHERE id = ? UNION ALL SELECT url_imagen, tipo FROM refrescos WHERE id = ? UNION ALL SELECT url_imagen, tipo FROM antojitos WHERE id = ?', [id, id, id], (err, results) => {
        if (err) {
            console.error('Error al obtener el producto:', err);
            res.status(500).send('Error al obtener el producto');
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: 'Producto no encontrado' });
            return;
        }

        const urlImagen = results[0].url_imagen;
        const tipo = results[0].tipo;
        let deleteQuery;

        // Eliminar el producto de la base de datos
        if (tipo === 'pizza') {
            deleteQuery = 'DELETE FROM pizzas WHERE id = ?';
        } else if (tipo === 'refresco') {
            deleteQuery = 'DELETE FROM refrescos WHERE id = ?';
        } else if (tipo === 'antojo') {
            deleteQuery = 'DELETE FROM antojitos WHERE id = ?';
        } else {
            return res.status(400).json({ message: 'Tipo de producto no válido' });
        }

        DB.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar el producto:', err);
                res.status(500).send('Error al eliminar el producto');
                return;
            }

            // Elimina la imagen del sistema de archivos si existe
            if (urlImagen) {
                const fileName = path.basename(urlImagen); // Extrae el nombre del archivo
                const filePath = path.join(__dirname, 'uploads', fileName);
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar la imagen:', err);
                        res.status(500).send('Error al eliminar la imagen');
                        return;
                    }
                    res.json({ message: 'Producto eliminado exitosamente' });
                });
            } else {
                res.json({ message: 'Producto eliminado exitosamente' });
            }
        });
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
            GROUP_CONCAT(ppd.tamaño ORDER BY ppd.id SEPARATOR ', ') AS tamaños,
            GROUP_CONCAT(ppd.cantidad ORDER BY ppd.id SEPARATOR ', ') AS cantidades,
            GROUP_CONCAT(ppd.precio ORDER BY ppd.id SEPARATOR ', ') AS precios
        FROM pedido_pizza pp
        JOIN pedido_pizza_detalle ppd ON pp.id = ppd.pedido_pizza_id
        JOIN productos p ON ppd.producto_id = p.id
        GROUP BY pp.cliente_id;
    `;

    DB.query(query, (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto ${port}`);
});
