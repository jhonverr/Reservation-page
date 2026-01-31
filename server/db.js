const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'reservation.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create Admins table
    db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

    // Create Performances table
    db.run(`CREATE TABLE IF NOT EXISTS performances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    date_range TEXT,
    location TEXT,
    duration TEXT,
    price INTEGER
  )`);

    // Create Reservations table
    db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    performance_id INTEGER,
    name TEXT,
    email TEXT,
    date TEXT,
    tickets INTEGER,
    total_price INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(performance_id) REFERENCES performances(id)
  )`);

    // Seed Admin if not exists
    db.get("SELECT * FROM admins WHERE username = ?", ['admin'], (err, row) => {
        if (!row) {
            db.run("INSERT INTO admins (username, password) VALUES (?, ?)", ['admin', 'admin123']);
            console.log("Seeded admin user.");
        }
    });

    // Seed Performance if not exists
    db.get("SELECT * FROM performances WHERE title = ?", ['별들이 쏟아지는 밤'], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO performances (title, description, date_range, location, duration, price) 
              VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    '별들이 쏟아지는 밤',
                    '당신의 잊혀진 꿈을 찾아 떠나는 환상적인 여정.\n압도적인 비주얼과 감동적인 선율이 함께합니다.',
                    '2026.02.01 - 2026.03.15',
                    '루미나 대극장',
                    '120분 (인터미션 15분)',
                    120000
                ]);
            console.log("Seeded default performance.");
        }
    });
});

module.exports = db;
