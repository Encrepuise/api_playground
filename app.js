// Main application file
const express = require('express');
const app = express();
const { promisify } = require('util');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(bodyParser.json());
app.use(cookieParser());
const secret = process.env.JWT_SECRET || 'secret';

// HTTPS
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Bcrypt
const bcrypt = require ('bcrypt');
const saltRounds = 10;


// Database Connection
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'senroweb.com',
  user: 'senroweb_neomanadmin',
  password: '123456Neoman',
  database: 'senroweb_neoman'
});

const query = promisify(connection.query).bind(connection);
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});


// Default Gateway
app.get("/", async function(req, res, next) {
  res.send('Hello World!');
});


// User registration endpoint
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
  // Check if email or username already exists
  const checkSql = `
    SELECT * FROM users WHERE email = ? OR name = ?
  `;
  const checkValues = [email, name];
  const results = await promisify(connection.query).call(connection, checkSql, checkValues);

  if (results.length > 0) {
      res.status(400).send('User already exists!');
    } else {
      const hash = await bcrypt.hash(password, saltRounds);
        const insertSql = `
        INSERT INTO users (name, email, password) VALUES (?, ?, ?)
      `;
      const insertValues = [name, email, hash];
      await promisify(connection.query).call(connection, insertSql, insertValues);
        console.log('New user registered!');
        res.send('New user registered!');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });


// User login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const sql = `
    SELECT * FROM users WHERE email = ?
  `;
  const values = [email];
  try {
    const [rows, fields] = await connection.promise().query(sql, values);
    if (rows.length === 0) {
      res.status(401).send('Invalid email or password');
      return;
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401).send('Invalid email or password');
      return;
    }
    // Create and sign JWT token
    const token = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });
    // Store JWT token in a HTTP-only cookie
    res.cookie('token', token, { httpOnly: true });
    res.send('Login successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


// Protected route
app.get('/protected', async (req, res) => {
  try {
    if (!req.cookies || !req.cookies.token) {
      res.status(401).send('No token found');
      return;
    }
    const token = req.cookies.token;
    const decoded = jwt.verify(token, secret);
    const sql = `
      SELECT * FROM users WHERE email = ?
    `;
    const values = [decoded.email];
    const [rows, fields] = await connection.promise().query(sql, values);
    if (rows.length === 0) {
      res.status(401).send('Invalid token');
      return;
    }
    const user = rows[0];
    res.send(`Welcome, ${user.name}!`);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send('Invalid token');
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
});


// Update Profile
app.post('/updateprofile', upload.single('profile_picture'), async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('No token found');
    }
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).send('Invalid token');
    }
    const sql = 'SELECT * FROM users WHERE email = ?';
    const values = [decoded.email];
    const [rows] = await connection.promise().query(sql, values);
    if (rows.length === 0) {
      return res.status(401).send('User not found');
    }
    const user = rows[0];

    const birth_date = req.body.birth_date || user.birth_date;
    const gender = req.body.gender || user.gender;
    const mobile_number = req.body.mobile_number || user.mobile_number;
    let profile_picture = user.profile_picture;
    if (req.file) {
      if (profile_picture) {
        try {
          fs.unlinkSync(profile_picture);
        } catch (err) {
          console.error(`Failed to delete old profile picture: ${err}`);
        }
      }
      profile_picture = req.file.path;
    }
    const sql2 = `
      UPDATE users SET birth_date = ?, gender = ?, mobile_number = ?, profile_picture = ? WHERE email = ?
    `;
    const values2 = [birth_date, gender, mobile_number, profile_picture, decoded.email];
    await connection.promise().query(sql2, values2);
    return res.send('User profile updated!');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Internal Server Error');
  }
});



// Create Server
/*
const sslServer = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
}, app);

sslServer.listen(3443, () => console.log('Secure server on port 3443')); */


const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
}); 

// Export the app and server objects
module.exports = { app, server };