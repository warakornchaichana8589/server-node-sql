const express = require('express');
require('dotenv').config()
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fileupload = require("express-fileupload");
const app = express();

const connection = mysql.createConnection(process.env.DATABASE_URL)
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("files"));
app.use(fileupload())

app.get('/',(req, res) =>{
    res.send("Hello World")
})

app.post("/upload", async (req, res) => {
    const newpath = __dirname + "/image/";
    const file = req.files.file;
    const filename = file.name;
   
    file.mv(`${newpath}${filename}`, (err) => {
      if (err) {
        res.status(500).send({ message: "File upload failed", code: 200 });
      }
      res.status(200).send({ message: "File Uploaded", code: 200 });
    });
  });

app.get('/project', (req, res) => {
    connection.query(
        'SELECT * FROM project',
       function(err, results, fields) {
            res.send(results)
        }
    )
})
app.get('/admin', (req, res) => {
    connection.query(
        'SELECT * FROM admin',
       function(err, results, fields) {
            res.send(results)
        }
    )
})
app.post('/add/admin',(req, res) => {
        connection.query(
            'INSERT INTO `admin` (`username`, `password`) VALUES (?, ?)',
            [req.body.username, req.body.password],
                function (err, results) {
                res.json(results);
    }
        )
})
app.post('/add/project',(req, res) => {
    connection.query(
        'INSERT INTO `project` (`name`, `description`, `project_image`) VALUES (?, ?, ?)',
        [req.body.name, req.body.description, req.body.project_image],
            function (err, results) {
            res.json(results);
}
    )
})


app.listen(process.env.PORT || 3000)