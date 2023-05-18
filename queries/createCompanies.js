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
  CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT,
    companypicture VARCHAR(255)
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