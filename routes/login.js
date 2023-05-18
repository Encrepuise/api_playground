const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const uuidValidate = require('uuid-validate');
const { promisify } = require('util');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// Rate Limit
const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 5, // maximum of 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again later.',
  });

// User login endpoint
router.post('/login', loginRateLimiter, async (req, res) => {
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

  module.exports = router;