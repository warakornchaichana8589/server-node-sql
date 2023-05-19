const express = require("express");
const { Router } = require("express");
const { initializeApp } = require("firebase/app")  ;
const { getStorage, ref, getDownloadURL, uploadBytesResumable } = require("firebase/storage");
const multer = require("multer");
const mysql = require("mysql2");
const config = require("../config/firebase-config") 

const router = express.Router();
const connection = mysql.createConnection(process.env.DATABASE_URL);
initializeApp(config.firebaseConfig);
const storage = getStorage();
const upload = multer({ storage: multer.memoryStorage() });


router.post("/", upload.single("filename"), async (req, res) => {
    try {
      const dateTime = giveCurrentDateTime();
  
      const storageRef = ref(storage, `files/${req.file.originalname + "       " + dateTime}`);
      const metadata = {
        contentType: req.file.mimetype,
      };
      const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
  
      console.log('File successfully uploaded.');
  
      // Insert data into MySQL database
      connection.query(
        "INSERT INTO project (name, description, urldemo, image_name) VALUES (?, ?, ?, ?)",
        [
          req.body.projectName,
          req.body.description,
          req.body.urlDemo,
          downloadURL, // Store downloadURL in the image_name column
        ],
        function (err, results) {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Error inserting data" });
          }
          res.json(results);
        }
      );
    } catch (error) {
      return res.status(400).send(error.message);
    }
  });

const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    return dateTime;
}
module.exports = router;