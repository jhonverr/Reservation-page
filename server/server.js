const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        if (row) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Get Performances
app.get('/api/performances', (req, res) => {
    db.all("SELECT * FROM performances", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create Reservation
app.post('/api/reservations', (req, res) => {
    const { name, email, date, tickets, total_price, performance_id } = req.body;

    // Basic validation using a default performance ID if not provided (for now)
    const perfId = performance_id || 1;

    const sql = `INSERT INTO reservations (performance_id, name, email, date, tickets, total_price) 
               VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [perfId, name, email, date, tickets, total_price], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            success: true,
            id: this.lastID,
            message: 'Reservation created successfully'
        });
    });
});

// Get Reservations (Admin)
app.get('/api/reservations', (req, res) => {
    const sql = `SELECT r.*, p.title as performance_title 
               FROM reservations r 
               JOIN performances p ON r.performance_id = p.id 
               ORDER BY r.created_at DESC`;
    db.all(sql, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
