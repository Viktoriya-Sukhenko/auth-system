const bcrypt = require("bcrypt");

const password = "admin2024"; // Пароль, который нужно захешировать
const saltRounds = 10; // Количество раундов соли

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error("Ошибка при хэшировании пароля:", err);
        return;
    }
    console.log("Хэшированный пароль:", hash);
});
