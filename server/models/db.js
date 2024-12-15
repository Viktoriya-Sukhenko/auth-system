const mysql = require("mysql");

// Настройка подключения
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1706", // Укажите ваш пароль
    database: "auth_system",
});

// Устанавливаем соединение
db.connect((err) => {
    if (err) {
        console.error("Ошибка подключения к базе данных:", err);
    } else {
        console.log("Подключено к базе данных MySQL.");
    }
});

module.exports = db;
