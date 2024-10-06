const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("chat.db");

db.serialize(() => {
    db.all("SELECT * FROM messages", (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        rows.forEach((row) => {
            console.log(`${row.timestamp} - ${row.username}: ${row.message}`);
        });
    });
});

db.close();
