const express = require('express');
require('dotenv').config()
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const connection = mysql.createConnection(process.env.DATABASE_URL)
app.use(cors());
app.use(express.json());

app.get('/',(req, res) =>{
    res.send("Hello World")
})
app.get('/attractions', (req, res) => {
    connection.query(
        'SELECT * FROM attractions',
       function(err, results, fields) {
            res.send(results)
        }
    )
})

app.listen(process.env.PORT || 3000)