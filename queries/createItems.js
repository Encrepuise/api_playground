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
    CREATE TABLE items (
        itemId INT PRIMARY KEY AUTO_INCREMENT,
        itemName VARCHAR(50) NOT NULL,
        itemDescription VARCHAR(255) NOT NULL,
        itemPrice DECIMAL(10,2) NOT NULL,
        itemQuantity INT NOT NULL,
        itemImage VARCHAR(255) NOT NULL,
        itemCategory VARCHAR(50) NOT NULL,
        itemSeller INT NOT NULL,
        FOREIGN KEY (itemSeller) REFERENCES users(id)
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