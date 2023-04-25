const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const connection = mysql.createConnection(process.env.DATABASE_URL);
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const bcrypt = require("bcrypt");
const saltRounds = 10;
var jwt = require("jsonwebtoken");
var secret = "1639900warakorn";
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/project", (req, res) => {
  connection.query("SELECT * FROM project", function (err, results, fields) {
    res.send(results);
  });
});
app.post("/add/project", (req, res) => {
  connection.query(
    "INSERT INTO `project` (`name`, `description`, `project_image`) VALUES (?, ?, ?)",
    [req.body.name, req.body.description, req.body.project_image],
    function (err, results) {
      res.json(results);
    }
  );
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    connection.query(
      "INSERT INTO admin (username, password, email, fname, lname) VALUES (?, ?, ?, ?, ?)",
      [req.body.username, hash, req.body.email, req.body.fname, req.body.lname],
      function (err, results, fields) {
        if (err) {
          res.json({ status: "error", message: err });
          return;
        }
        res.json({ status: "ok" });
      }
    );
  });
});

app.get("/manager", (req, res) => {
  connection.query("SELECT * FROM admin", function (err, results, fields) {
    res.send(results);
  });
});

app.put("/update", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const username = req.body.username;
    const email = req.body.email;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const id = req.body.id;
    connection.query(
      "UPDATE admin SET username = ?, password = ?, email = ?, fname = ?, lname = ? WHERE id = ?",
      [username, hash, email, fname, lname, id],
      (error, results, fields) => {
        if (error){
          res.json({ status: "error", message: error });
          return;
        } 
        res.json({ status: "ok" });
      }
    );
  });
});
app.delete('/delete',(req, res)=>{
  const id = req.body.id
  connection.query( "DELETE FROM admin WHERE id = ?",[id],(error, results, fields)=>{
    if (error){
      res.json({ status: "error", message: error });
      return;
    } 
    res.json({ status: "ok" });
  })
})

app.post("/login", (req, res) => {
  connection.query(
    "SELECT * FROM admin WHERE email=?",
    [req.body.email],
    function (err, users, fields) {
      if (err) {
        res.json({ status: "error", message: err });
        return;
      }
      if (users.length == 0) {
        res.json({ status: "error", message: "No User" });
        return;
      }
      bcrypt.compare(
        req.body.password,
        users[0].password,
        function (err, isLogin) {
          if (isLogin) {
            var accessToken = jwt.sign({ email: users[0].email }, secret, {
              expiresIn: "1h",
            });
            res.json({ status: "ok", message: "Login success", accessToken });
          } else {
            res.json({ status: "error", message: "Login failed " });
          }
        }
      );
    }
  );
});

app.post("/authen", (req, res) => {
  try {
    const token = req.headers.authorization;
    const tokenWithoutBearer = token.replace("Bearer ", "");
    var decoded = jwt.verify(tokenWithoutBearer, secret);
    res.json({ status: "ok", decoded });
  } catch (err) {
    res.json({ status: "error", message: err.message});
    
  }
});

app.listen(process.env.PORT || 3333);
