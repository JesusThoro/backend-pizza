const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importa el paquete cors

const app = express();
const port = 3001;

app.use(cors()); // Usa el middleware cors
app.use(bodyParser.json());

const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
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
     const query = "SELECT * FROM clientes";
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
    const { nombre_completo, telefono, email, direccion, especificaciones_direccion } = req.body;
    const query = "INSERT INTO clientes (nombre_completo, telefono, email, direccion, especificaciones_direccion) VALUES (?, ?, ?, ?, ?)";
    console.log(query);
    DB.query(query, [nombre_completo, telefono, email, direccion, especificaciones_direccion], (err, result) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
            res.status(500).json({ error: "Error interno del servidor" });
            return;
        }
        res.json({ message: 'Usuario registrado exitosamente' });
    });
});

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
    const { fullName, number } = req.body;
    const query = "SELECT id, nombre_completo, telefono, rol_id FROM clientes WHERE nombre_completo = ? AND telefono = ?";
    DB.query(query, [fullName, number], (err, result) => {
        if (err) {
            console.error("Error en la consulta SQL:", err);
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
                    rol_id: user.rol_id
                }
            });
        } else {
            res.status(401).json({ message: 'Credenciales incorrectas' });
        }
    });
});


app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });

