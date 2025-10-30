
const mysql = require('mysql2/promise');
const { dbConfig } = require('./src/config/database-mysql');

const createTables = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS service_sections (
        id INT PRIMARY KEY AUTO_INCREMENT,
        service_id INT,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        type VARCHAR(50),
        FOREIGN KEY (service_id) REFERENCES services(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS service_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        section_id INT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price VARCHAR(255),
        image VARCHAR(255),
        attributes JSON,
        FOREIGN KEY (section_id) REFERENCES service_sections(id)
      )
    `);

    console.log('Services tables created successfully');
    await connection.end();
  } catch (error) {
    console.error('Error creating services tables:', error);
    process.exit(1);
  }
};

createTables();
