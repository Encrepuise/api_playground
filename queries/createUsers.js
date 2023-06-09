const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'senroweb.com',
    user: 'senroweb_neomanadmin',
    password: '123456Neoman',
    database: 'senroweb_neoman'
  });

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');

  const sql = `
    CREATE TABLE users (
      id INT(11) NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      ip_address VARCHAR(255) NOT NULL,
      is_verified BOOLEAN NOT NULL DEFAULT false,
      verification_token VARCHAR(255) NULL DEFAULT null,
      birth_date DATE,
      gender ENUM('male', 'female', 'other'),
      mobile_number VARCHAR(20),
      profile_picture VARCHAR(255),
      can_create_company BOOLEAN NOT NULL DEFAULT false,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `;

  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log('Table created successfully!');
  });

  connection.end((err) => {
    if (err) throw err;
    console.log('Connection to MySQL database closed!');
  });
});