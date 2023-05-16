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
    CREATE TABLE orders (
        orderId INT PRIMARY KEY AUTO_INCREMENT,
        orderOwner INT NOT NULL,
        orderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        totalPrice DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        shippingAddress VARCHAR(255) NOT NULL,
        billingAddress VARCHAR(255) NOT NULL,
        paymentMethod VARCHAR(50) NOT NULL,
        paymentStatus VARCHAR(20) NOT NULL,
        deliveryDate DATETIME,
        items INT NOT NULL,
        totalAmount DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (orderOwner) REFERENCES users(id),
        FOREIGN KEY (items) REFERENCES items(itemId)
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