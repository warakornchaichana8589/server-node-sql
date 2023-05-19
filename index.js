const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mysql = require("mysql2");
// const multer = require("multer");
const bodyParser = require("body-parser");
const app = express();
const fs = require('fs');
const uploadRouter = require("./controllers/upload-addworkshop");
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const router1 = require('./controllers/time')
app.use("/api-time",router1)
app.use('/upload', uploadRouter);
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var secret = "1639900warakorn";
const saltRounds = 10;
const connection = mysql.createConnection(process.env.DATABASE_URL);
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'image/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + ".jpg"); //เปลี่ยนชื่อไฟล์ป้องกันชื่อซ้ำ
//   },
// });

// const upload = multer({
//   storage: storage,
// });

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
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/project", (req, res) => {  
  connection.query("SELECT * FROM project", function (err, results, fields) {
    res.send(results);
  });
});

app.get("/get-image/:image_name",(req, res) => {

  const imagePath = `./image/${req.params.image_name}`
  fs.readFile(imagePath, (err, data) => {
    if (err) {
      // กรณีเกิดข้อผิดพลาดในการอ่านไฟล์
      console.error(err);
      res.sendStatus(500);
    } else {
      // กำหนด Content-Type ของ response เป็น image/*
      res.setHeader('Content-Type', 'image/*');
      // ส่งข้อมูลรูปภาพกลับไปยังไคลเอนต์
      res.send(data);
    }
  });
})
app.post("/addworkshop", (req, res) => {
  // , upload.single("file")
  connection.query(
    "INSERT INTO project (name, description, urldemo, image_name) VALUES (?, ?, ?, ?)",
    [
      req.body.projectName,
      req.body.description,
      req.body.urlDemo,
      req.file.filename,
    ],
    function (err, results) {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error inserting data" });
      }
      res.json(results);
    }
  );
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
        if (error) {
          res.json({ status: "error", message: error });
          return;
        }
        res.json({ status: "ok" });
      }
    );
  });
});
app.delete("/delete", (req, res) => {
  const id = req.body.id;
  connection.query(
    "DELETE FROM admin WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) {
        res.json({ status: "error", message: error });
        return;
      }
      res.json({ status: "ok" });
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
    res.json({ status: "error", message: err.message });
  }
});

app.listen(process.env.PORT || 3333);
