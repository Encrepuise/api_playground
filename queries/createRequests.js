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
    CREATE TABLE requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NOT NULL,
        status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
        FOREIGN KEY (company_id) REFERENCES companies (id);
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