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

const AWS = require('aws-sdk');
const fs = require('fs');
const s3 = new AWS.S3({ region: 'ap-southeast-2' });
AWS.config.update({
  region: 'ap-southeast-2',
  accessKeyId: 'ASIAU3YQSJUKMWRA7OVA',
  secretAccessKey: 'HVqVCS52FKtCMZfG5pDLq81JU4bBOyZEDwUOZyn3',
  sessionToken: 'IQoJb3JpZ2luX2VjEHAaCmFwLXNvdXRoLTEiRjBEAiAy1GlrKukYgFurM1Vgbm0vsAQtz5DITxyX98DUVJaxuwIgM+CDfx6I7Mbjbxp3ggaviLKWDZph9LCW2DBdeKf7iysqrQIIeRAAGgwzMzQ1MDUzMzE5ODgiDMjlididzMS+ohWvdiqKAvsfVT9B8DH0rmPVLNhZ2MDRC8n+DoQrPVcLytgPMzOdYjLKInHhCNgtFPmL642t1YNEcMJ6Ch9VnQiSSfvJZtf8D+kH60LSslSWBtka32zfxFYYBRnQCpH+G4Bgx+mZMa1wszvDNcn2SlRl3HrEqR+6Af1DEI4nIGhWQe8074sPfL9pH9Nme/BWies2C1tEx/IXcibjPEgS8qjZy0E+bdLawZRM0AXKemZpL83M3qcgQYYKvl0gpEFTo6idx+FEceMBhrqgy0OYEN88lie1d+LtGwSNa2bEf2q7or81Er6XYvQtQhHUNHksMTYRwOhjbca0tabjKhb4ZdkMHGEEXVj++8dnntWu1rjVMNaEtaIGOp4BcRCGV+1PYtnlhO7SmeNjKwDU5LXrHy/ZpSRud5jcfdctdPo4x1Zlahi+mGK9cmWHn3PSq/oDfe1oS3vEaHLIERofIYuYa17Nuz2Jy+ULMjkLjkLRgbVbnrGJMaY9Y135XmQA9wbnxH4I/f6ZLcQIngsRCO8yxhM/k8b2Drds6j/pxj7g9Yu6puIyj1O45biDeNbNiR2nwonk7+sTtF0='
});



app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/project", (req, res) => {
 
  connection.query("SELECT * FROM project", function (err, results, fields) {
    res.send(results);
  });

});
app.get("/project/:id", (req, res) => {
  const projectId = req.params.id;

  const params = {
    Bucket: 'cyclic-cheerful-colt-shrug-ap-southeast-2',
    Key: `${projectId}`,
    Expires: 3600
  };

  const url = s3.getSignedUrl('getObject', params);

  // ส่ง URL กลับไปใน response
  res.json({ url: url });
});
app.post("/add/project",(req, res) => {
  
  if (!req.file) { // ตรวจสอบว่ามีไฟล์ที่อัพโหลดมาหรือไม่
    return res.status(400).json({ message: "No file uploaded" });
  }

  const params = {
    Bucket:'cyclic-cheerful-colt-shrug-ap-southeast-2',
    Key: req.file.filename,
    Body: fs.createReadStream(req.file.path),
    ACL: 'public-read',
  };

  s3.putObject(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to upload file to S3" });
    } else {
      
      const s3Key = data.Key;

      connection.query(
        "INSERT INTO `project` (`name`, `description`, `filename`) VALUES (?, ?, ?)",
        [req.body.projectName, req.body.description, s3Key],
        function (err, results) {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error inserting data" });
          }
          res.json(results);
        }
      );

      // ลบไฟล์ที่อัพโหลดเสร็จแล้วออกจาก server
      fs.unlinkSync(req.file.path);
      
      
    }
  });
  
 
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
