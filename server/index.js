const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'birthday_app'
};

// Create database and table if they don't exist
const initDb = async () => {
    try {
        // connect without database first to create it
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await connection.end();

        // Now initialize the pool with the database
        const pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        await pool.query(`
      CREATE TABLE IF NOT EXISTS wishes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('Database and table initialized successfully');
        return pool;
    } catch (err) {
        console.error('Error during database initialization:', err);
        throw err;
    }
};

let pool;
initDb().then(p => pool = p).catch(err => {
    console.error("Critical: Could not initialize database. Server cannot handle requests.");
});

// API Endpoints
app.get('/api/wishes', async (req, res) => {
    try {
        // Ensure pool is initialized before use
        if (!pool) {
            return res.status(503).json({ error: 'Database not initialized yet.' });
        }
        const [rows] = await pool.query('SELECT * FROM wishes ORDER BY created_at ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wishes', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        if (!pool) {
            return res.status(503).json({ error: 'Database not initialized yet.' });
        }
        const [result] = await pool.query('INSERT INTO wishes (content) VALUES (?)', [content]);
        res.status(201).json({ id: result.insertId, content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/wishes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!pool) {
            return res.status(503).json({ error: 'Database not initialized yet.' });
        }
        await pool.query('DELETE FROM wishes WHERE id = ?', [id]);
        res.json({ message: 'Wish deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
