const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.json());

// Database Connection
const connection = mysql.createConnection({
  host: 'senroweb.com',
  user: 'senroweb_neomanadmin',
  password: '123456Neoman',
  database: 'senroweb_neoman'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

// User registration endpoint
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Check if email or username already exists
  const checkSql = `
    SELECT * FROM users WHERE email = ? OR name = ?
  `;
  const checkValues = [email, name];
  connection.query(checkSql, checkValues, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(400).send('User already exists!');
    } else {
      // Insert new user into the database
      const insertSql = `
        INSERT INTO users (name, email, password) VALUES (?, ?, ?)
      `;
      const insertValues = [name, email, password];
      connection.query(insertSql, insertValues, (err, result) => {
        if (err) throw err;
        console.log('New user registered!');
        res.send('New user registered!');
      });
    }
  });
});


// User login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = `
    SELECT * FROM users WHERE email = ?
  `;
  const values = [email];
  connection.query(sql, values, (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      res.status(401).send('Invalid email or password');
      return;
    }
    const user = results[0];
    if (user.password !== password) {
      res.status(401).send('Invalid email or password');
      return;
    }
    res.send('Login successful!');
  });
});




const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Export the app and server objects
module.exports = { app, server };