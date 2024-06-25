
const express = require('express')
const mysql = require('mysql')

const app =express()
const port =3001

const DB = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basededatos',
});

app.get('/usuarios', (req, res) => {
    const query="SELECT * FROM clientes"
    DB.query(query, (err, result) =>{
        if(err){

        }
        res.json(result)
    })
})



DB.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexion exitosa');
});


app.listen(port,()=>{
    console.log(`servidor corriendo en el puerto ${port}`)
})

