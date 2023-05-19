const mysql = require("mysql2");
export const connection = mysql.createConnection(process.env.DATABASE_URL);