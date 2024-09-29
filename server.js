const express = require("express");
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const dbPath = path.join(__dirname, "render", "chat.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS messages (room TEXT, username TEXT, message TEXT, type TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
    db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY)");
});

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "chat.html"));
});

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("join room", ({ username, room }) => {
        socket.join(room);

        db.run(
            "INSERT OR IGNORE INTO users (username) VALUES (?)",
            [username],
            (err) => {
                if (err) {
                    console.error(err.message);
                }
            }
        );

        db.all(
            "SELECT rowid, username, message, type, content, timestamp FROM messages WHERE room = ? ORDER BY timestamp",
            [room],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                    return;
                }

                socket.emit("old message", rows);
            }
        );

        io.to(room).emit("chat message", {
            username,
            message: `${username} has joined the room`,
        });
    });

    socket.on("chat.message", ({ room, username, message, type, content }) => {

        db.run(
            "INSERT INTO messages (room, username, message, type, content) VALUES(?,?,?,?,?)",
            [room, username, message, type, content],
            function (err) {
                if (err) {
                    console.error(err.message);
                    return;
                }

                io.to(room).emit("chat message", {
                    rowid: this.lastID,
                    username,
                    message,
                    type,
                    content,
                });
            }
        );
    });

    socket.on("delete message", ({ messageId }) => {
        db.get(
            "SELECT username FROM messages WHERE rowid = ?",
            [messageId],
            (err, row) => {
                if (err) {
                    console.error(err.message);
                    return;
                }

                if (row && row.username === username) {
                    db.run("DELETE FROM messages WHERE rowid = ?",
                        [message],
                        (err) => {
                            if (err) {
                                console.error(err.message);
                                return;
                            }

                            io.to(room).emit("message deleted", { messageId });
                        }
                    );
                }
            }
        );
    });
});
