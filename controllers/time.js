const express = require("express");
const router1 = express.Router();
const mysql = require("mysql2");
const connection = mysql.createConnection(process.env.DATABASE_URL);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = "1639900warakorn";
const saltRounds = 10;

router1.get("/test1", (req, res) => {
  const a = 3 + 4;
  const response = a.toString(); // แปลงค่า a เป็นสตริง
  res.send(response);
});

router1.post("/login", (req, res) => {
  connection.query(
    "SELECT * FROM admin WHERE username=?",
    [req.body.username],
    (err, users, fields) => {
      if (err) {
        return res.json({ status: "error", message: err });
      }
      if (users.length === 0) {
        return res.json({ status: "error", message: "No User" });
      }
      bcrypt.compare(req.body.password, users[0].password, (err, isLogin) => {
        if (isLogin) {
          const accessToken = jwt.sign({ email: users[0].email }, secret, {
            expiresIn: "1h",
          });
          const fullname = `${users[0].fname} ${users[0].lname}`;
          const isAdmin = users[0].status === "admin";
          return res.json({
            status: "ok",
            message: "Login success",
            username: users[0].username,
            admin: isAdmin ? "admin" : "no",
            fullname: fullname,
            accessToken: accessToken,
          });
        } else {
          return res.json({ status: "error", message: "Login failed" });
        }
      });
    }
  );
});

router1.get("/employee/date/:date", (req, res) => {
  const date = req.params.date;
  const username = req.query.username;

  connection.query(
    `SELECT * FROM employee WHERE username=? AND DATE(checkin)=? ORDER BY checkin ASC`,
    [username, date],
    (error, results, fields) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results);
    }
  );
});

router1.post("/checkin", (req, res) => {
  const username = req.body.username;
  const fullname = req.body.fullname;
  const checkinTime = new Date();

  connection.query(
    "INSERT INTO employee (username, checkin, fullname) VALUES (?, ?, ?)",
    [username, checkinTime, fullname],
    (error, results, fields) => {
      if (error) {
        return res.status(400).send("Error");
      }
      return res.status(201).send("CheckIn successful.");
    }
  );
});

router1.post("/checkout", (req, res) => {
  const username = req.body.username;
  const checkoutTime = new Date();

  connection.query(
    "UPDATE employee SET checkout = ? WHERE username = ? AND checkout IS NULL",
    [checkoutTime, username],
    (error, results, fields) => {
      if (error) {
        throw error;
      }
      if (results.affectedRows === 0) {
        return res
          .status(404)
          .send("No open attendance record found for the employee.");
      } else {
        return res.status(200).send("Checkout successful.");
      }
    }
  );
});

router1.get("/employee/:username", (req, res) => {
  const username = req.params.username;
  connection.query(
    `SELECT * FROM employee WHERE username=?`,
    [username],
    (error, results, fields) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results);
    }
  );
});

router1.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    connection.query(
      "INSERT INTO admin (username, password, email, fname, lname) VALUES (?, ?, ?, ?, ?)",
      [req.body.username, hash, req.body.email, req.body.fname, req.body.lname],
      (err, results, fields) => {
        if (err) {
          return res.json({ status: "error", message: err });
        }
        return res.json({ status: "ok" });
      }
    );
  });
});

module.exports = router1;
