// Main application file
const express = require('express');
const app = express();
const { promisify } = require('util');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const uuidValidate = require('uuid-validate');
const smtpServer = require('smtp-server').SMTPServer;


app.use(bodyParser.json());
app.use(cookieParser());
const secret = process.env.JWT_SECRET || 'secret';


// HTTPS
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const profilePictureUpload = multer({ dest: 'uploads/profilePictures/' });


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


// Start a fake SMTP server
const server2 = new smtpServer({
  logger: false,
  authOptional: true,
  onData: (stream, session, callback) => {
    let message = '';
    stream.on('data', (data) => {
      message += data.toString();
    });
    stream.on('end', () => {
      console.log('Received email:');
      console.log(message);
      callback(null, 'Message received');
    });
  },
});
server2.listen(2525, '127.0.0.1', () => {
  console.log('Fake SMTP server started on port 2525');
});

// Configure Nodemailer to use the fake SMTP server
const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 2525,
  tls: {
    rejectUnauthorized: false,
  },
});

/*
// Send a test email
const mailOptions = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test email',
  text: 'This is a test email',
};
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Email sent:', info.response);
  }
});
*/


/*
// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'your-email-address@gmail.com',
    pass: 'your-email-password'
  }
});
*/


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
      const verificationToken = uuidv4();
        const insertSql = `
        INSERT INTO users (name, email, password, verification_token) VALUES (?, ?, ?, ?)
      `;
      const insertValues = [name, email, hash, verificationToken];
      await promisify(connection.query).call(connection, insertSql, insertValues);
        console.log('New user registered!');

      // Send email verification link to user
      const verificationLink = `https://your-website.com/verify/${verificationToken}`;
      await transporter.sendMail({
        from: 'your-email-address@gmail.com',
        to: email,
        subject: 'Verify your email address',
        html: `Please click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a>`
      });

      // Normaly Use This Respond
      // res.send('New user registered!');

      // For Testing
      res.send({ message: 'New user registered!', verificationToken });
    }
  } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });


// User email verification endpoint
app.get('/verify/:verificationToken', async (req, res) => {
  const { verificationToken } = req.params;

  try {
    // Validate the verification token format
    if (!uuidValidate(verificationToken)) {
      return res.status(400).send('Invalid verification token');
    }

    // Get the user's email address from the verification token
    const getUserEmailSql = `
      SELECT email FROM users WHERE verification_token = ?
    `;
    const getUserEmailValues = [verificationToken];
    const result = await query(getUserEmailSql, getUserEmailValues);

    if (result.length === 0) {
      return res.status(400).send('Invalid verification token');
    }

    const userEmail = result[0].email;

    // Update the user's record in the database to mark the email as verified
    const updateSql = `
      UPDATE users SET is_verified = 1 WHERE verification_token = ?
    `;
    const updateValues = [verificationToken];
    await query(updateSql, updateValues);

    console.log(`User with email ${userEmail} and verification token ${verificationToken} has been verified`);

    return res.send('Your email address has been verified. You can now log in to your account.');
  } catch (err) {
    console.error(err);
    return res.status(400).send('Invalid verification token');
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
app.post('/updateprofile', profilePictureUpload.single('profile_picture'), async (req, res) => {
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