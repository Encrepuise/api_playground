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
const rateLimit = require('express-rate-limit');
const router = express.Router();
require('dotenv').config();


app.use(bodyParser.json());
app.use(cookieParser());
const secret = process.env.JWT_SECRET;


// Routes
// const loginRoute = require('./routes/login.js');


// Rate Limit
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 5, // maximum of 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again later.',
});


// HTTPS
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');


// Create a multer storage instance for profile picture uploads
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profilePictures');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, uniqueSuffix + extname);
  }
});

// Create a multer upload instance for profile picture with file filter for valid image formats
const profilePictureUpload = multer({
  storage: profilePictureStorage,
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['.jpg', '.jpeg', '.png'];
    const extname = path.extname(file.originalname).toLowerCase();
    if (allowedFormats.includes(extname)) {
      cb(null, true);
    } else {
      cb({ error: 'Only JPEG and PNG files are allowed', status: 400 }, false);
    }
  }
});

// Create a multer storage instance for company picture uploads
const companyPictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/companyPictures');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname);
    cb(null, uniqueSuffix + extname);
  }
});

// Create a multer upload instance for company picture with file filter for valid image formats
const companyPictureUpload = multer({
  storage: companyPictureStorage,
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['.jpg', '.jpeg', '.png'];
    const extname = path.extname(file.originalname).toLowerCase();
    if (allowedFormats.includes(extname)) {
      cb(null, true);
    } else {
      cb({ error: 'Only JPEG and PNG files are allowed', status: 400 }, false);
    }
  }
});


// Bcrypt
const bcrypt = require ('bcrypt');
const saltRounds = 10;


// Database Connection
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
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
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  requireTLS: process.env.EMAIL_REQUIRE_TLS === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});
*/


// Default Gateway
app.get("/", async function(req, res, next) {
  res.send('Hello World!');
});


// User registration endpoint
app.post('/register', async (req, res) => {
  // Obtain client's IP address
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
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
      INSERT INTO users (name, email, password, verification_token, ip_address) VALUES (?, ?, ?, ?, ?)
    `;
    const insertValues = [name, email, hash, verificationToken, clientIp];
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


// app.use('/login', loginRoute);


// User login endpoint
app.post('/login', loginRateLimiter, async (req, res) => {
  // Obtain client's IP address
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { email, password } = req.body;
  const sql = `
    SELECT * FROM users WHERE email = ?
  `;
  const values = [email];
  try {
    const [rows, fields] = await connection.promise().query(sql, values);
    if (rows.length === 0) {
      // Store unsuccessful login attempt in the database
      const loginAttemptSql = `
        INSERT INTO login_attempts (email, ip_address, attempt_time) VALUES (?, ?, NOW())
      `;
      const loginAttemptValues = [email, clientIp];
      await connection.promise().query(loginAttemptSql, loginAttemptValues);

      res.status(401).send('Invalid email or password');
      return;
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Store unsuccessful login attempt in the database
      const loginAttemptSql = `
        INSERT INTO login_attempts (email, ip_address, attempt_time) VALUES (?, ?, NOW())
      `;
      const loginAttemptValues = [email, clientIp];
      await connection.promise().query(loginAttemptSql, loginAttemptValues);

      res.status(401).send('Invalid email or password');
      return;
    }

    // Store the login session record in the database
    const loginRecordSql = `
      INSERT INTO login_sessions (user_id, login_time, ip_address) VALUES (?, NOW(), ?)
    `;
    const loginRecordValues = [user.id, clientIp];
    await connection.promise().query(loginRecordSql, loginRecordValues);

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


// User logout endpoint
app.post('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  res.send('Logout successful!');
});


// Create Server
/*
const sslServer = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
}, app);

sslServer.listen(3443, () => console.log('Secure server on port 3443')); */


app.post('/createcompany', companyPictureUpload.single('company_picture'), async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!req.cookies || !req.cookies.token) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(401).send('No token found');
      return;
    }
    if (!name || !description) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(401).send('No info found');
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
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(401).send('Invalid token');
      return;
    }
    const sql2 = `SELECT * FROM users WHERE email = ? AND can_create_company = 1`;
    connection.query(sql2, [decoded.email], (err, results) => {
      if (err) throw err;

      // Check if a user with the specified email and can_create_company = 1 exists
      if (results.length === 0) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(403).json({ message: 'User does not have permission to create a company' });
      }

      // User has permission, continue with company creation
      const userId = results[0].id;

      // Insert company into the companies table
      const companySql = `INSERT INTO companies (name, description, companypicture) VALUES (?, ?, ?)`;
      const values = [name, description, req.file ? req.file.path : null];
      connection.query(companySql, values, (err, result) => {
        if (err) throw err;

        // Retrieve the ID of the inserted company
        const companyId = result.insertId;

        // Insert user and company ID into the company_admins table
        const adminsSql = `INSERT INTO company_admins (company_id, admin_id) VALUES (?, ?)`;
        connection.query(adminsSql, [companyId, userId], (err) => {
          if (err) throw err;

          res.status(200).json({ message: 'Company created successfully', companyId });
        });
      });
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(401).send('Invalid token');
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
});

app.post('/putusertocompany', async (req, res) => {
  const { company_id, useremail } = req.body;

  try {
    if (!req.cookies || !req.cookies.token) {
      res.status(401).send('No token found');
      return;
    }

    const token = req.cookies.token;
    const decoded = jwt.verify(token, secret);
    const userEmail = decoded.email;

    const checkAdminSql = `SELECT * FROM company_admins WHERE company_id = ? AND admin_id = (SELECT id FROM users WHERE email = ?)`;
    const checkAdminValues = [company_id, userEmail];

    connection.query(checkAdminSql, checkAdminValues, (err, results) => {
      if (err) throw err;

      if (results.length === 0) {
        return res.status(403).json({ message: 'User is not an admin of the company' });
      }

      const userIdSql = `SELECT id FROM users WHERE email = ?`;
      const userIdValues = [useremail];

      connection.query(userIdSql, userIdValues, (err, userResults) => {
        if (err) throw err;

        if (userResults.length === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const userId = userResults[0].id;
        const checkMembershipSql = `SELECT * FROM user_companies WHERE company_id = ? AND user_id = ?`;
        const checkMembershipValues = [company_id, userId];

        connection.query(checkMembershipSql, checkMembershipValues, (err, membershipResults) => {
          if (err) throw err;

          if (membershipResults.length > 0) {
            return res.status(400).json({ message: 'User is already a member of the company' });
          }

          const insertMembershipSql = `INSERT INTO user_companies (company_id, user_id) VALUES (?, ?)`;
          const insertMembershipValues = [company_id, userId];

          connection.query(insertMembershipSql, insertMembershipValues, (err) => {
            if (err) throw err;

            res.status(200).json({ message: 'User added to company successfully' });
          });
        });
      });
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send('Invalid token');
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
});


app.get('/getcompanies', (req, res) => {
  // Check if token exists in the cookie
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'No token found' });
  }

  try {
    // Verify and decode the token to get the user's email
    const decoded = jwt.verify(token, secret);
    const userEmail = decoded.email;

    const getUserIdQuery = 'SELECT id FROM users WHERE email = ?';

    // Execute the query to retrieve the user's ID based on the email
    connection.query(getUserIdQuery, [userEmail], (err, userIdResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Failed to retrieve user information' });
      }

      if (userIdResults.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userId = userIdResults[0].id;

      // Assuming you have a 'user_companies' table that stores the user's company associations
      const getAdminCompaniesQuery = `
        SELECT companies.id, companies.name, companies.description
        FROM companies
        INNER JOIN company_admins ON companies.id = company_admins.company_id
        WHERE company_admins.admin_id = ?
      `;
      
      const getUserCompaniesQuery = `
        SELECT companies.id, companies.name, companies.description
        FROM companies
        INNER JOIN user_companies ON companies.id = user_companies.company_id
        WHERE user_companies.user_id = ?
      `;

      // Execute the queries with the user's ID
      connection.query(getAdminCompaniesQuery, [userId], (err, adminCompaniesResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to retrieve admin companies' });
        }

        connection.query(getUserCompaniesQuery, [userId], (err, userCompaniesResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to retrieve user companies' });
          }

          const adminCompanies = adminCompaniesResults.length > 0 ? adminCompaniesResults : [];
          const userCompanies = userCompaniesResults.length > 0 ? userCompaniesResults : [];

          // Return the arrays of companies
          res.json({ adminCompanies, userCompanies });
        });
      });
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});


app.post('/request', (req, res) => {
  try {
    // Check if token exists in the cookie
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    // Verify and decode the token to get the user's email
    const decoded = jwt.verify(token, secret);
    const userEmail = decoded.email;

    const userQuery = 'SELECT id FROM users WHERE email = ?';

    connection.query(userQuery, [userEmail], (userErr, userResults) => {
      if (userErr) {
        console.error(userErr);
        return res.status(500).json({ message: 'Failed to fetch user data' });
      }

      const userId = userResults[0].id;
      const companyId = req.cookies.companyId; // Assuming the company ID is sent as "companyId" in the request body

      // Check if the user is associated with the provided company ID
      const userCompanyQuery = 'SELECT user_id FROM user_companies WHERE user_id = ? AND company_id = ?';
      const userCompanyValues = [userId, companyId];

      connection.query(userCompanyQuery, userCompanyValues, (userCompanyErr, userCompanyResults) => {
        if (userCompanyErr) {
          console.error(userCompanyErr);
          return res.status(500).json({ message: 'Failed to check user-company association' });
        }

        if (userCompanyResults.length === 0) {
          return res.status(403).json({ message: 'User does not belong to the provided company' });
        }

        const { start_date, end_date, reason } = req.body;

        // Check if the required fields are provided
        if (!start_date || !end_date || !reason) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if the user already has a request within the provided dates for the selected company
        const existingRequestQuery = `
          SELECT id FROM requests
          WHERE user_id = ? AND company_id = ? AND start_date <= ? AND end_date >= ?
        `;
        const existingRequestValues = [userId, companyId, end_date, start_date];

        connection.query(existingRequestQuery, existingRequestValues, (existingRequestErr, existingRequestResults) => {
          if (existingRequestErr) {
            console.error(existingRequestErr);
            return res.status(500).json({ message: 'Failed to check for an existing request' });
          }

          if (existingRequestResults.length > 0) {
            return res.status(409).json({ message: 'User already has a request within the provided dates for the selected company' });
          }

          // Insert the off-time request into the requests table
          const createRequestQuery = `
            INSERT INTO requests (user_id, company_id, start_date, end_date, reason, updated_by)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          const createRequestValues = [userId, companyId, start_date, end_date, reason, userId];

          connection.query(createRequestQuery, createRequestValues, (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: 'Failed to create an off-time request' });
            }

            res.status(200).json({ message: 'Off-time request created successfully' });
          });
        });
      });
      });
} catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send('Invalid token');
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  }
});




const server = app.listen(3000, () => {
  console.log('Server listening on port 3000');
}); 
