const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../models/db");

const router = express.Router();

// Перевірка відповідності пароля обмеженням
const isPasswordValid = (password) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[а-яА-ЯёЁіІїЇєЄҐґ])(?=.*[\+\-\*\/=])[\s\S]{8,}$/;
    return regex.test(password);
};

// Вхід
router.post("/login", (req, res) => {
    const { username, password, isFirstLogin } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Ім'я користувача є обов'язковим" });
    }

    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("Помилка під час пошуку користувача:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        const user = results[0];

        // Перевірка, чи заблокований акаунт
        if (user.is_blocked) {
            return res.status(403).json({ message: "Ваш акаунт заблоковано. Зверніться до адміністратора." });
        }

        // Перший вхід
        if (isFirstLogin) {
            if (!user.password || user.password === "") {
                return res.status(200).json({
                    firstLogin: true,
                    id: user.id,
                });
            } else {
                return res.status(400).json({ message: "Користувач вже має пароль. Використовуйте звичайний вхід." });
            }
        }

        // Звичайний вхід
        if (!password) {
            return res.status(400).json({ message: "Пароль є обов'язковим для входу" });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Помилка під час перевірки пароля:", err);
                return res.status(500).json({ message: "Помилка сервера" });
            }

            if (!isMatch) {
                return res.status(401).json({ message: "Неправильне ім'я користувача або пароль" });
            }

            // Якщо увімкнено обмеження і пароль не відповідає вимогам
            if (user.password_restrictions && !isPasswordValid(password)) {
                return res.status(200).json({
                    message: "Ваш пароль не відповідає встановленим обмеженням. Будь ласка, змініть його.",
                    forceChange: true,
                    id: user.id,
                });
            }

            // Успішний вхід
            res.status(200).json({
                message: "Успішний вхід",
                id: user.id,
                username: user.username,
                role: user.role,
                is_blocked: user.is_blocked,
            });
        });
    });
});

// Встановлення нового пароля
router.post("/set-password", (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ message: "ID та новий пароль є обов'язковими" });
    }

    // Перевірка обмежень пароля
    if (!isPasswordValid(password)) {
        return res.status(400).json({
            message: "Пароль повинен містити латинські букви, символи кирилиці та знаки арифметичних операцій.",
        });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
        if (err) {
            console.error("Помилка встановлення пароля:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }
        res.status(200).json({ message: "Пароль успішно встановлено" });
    });
});

// Зміна пароля адміністратора
router.post("/change-admin-password", (req, res) => {
    const { id, oldPassword, newPassword } = req.body;

    if (!id || !oldPassword || !newPassword) {
        return res.status(400).json({ message: "ID, старий та новий паролі є обов'язковими" });
    }

    db.query("SELECT * FROM users WHERE id = ? AND role = 'admin'", [id], (err, results) => {
        if (err) {
            console.error("Помилка під час пошуку адміністратора:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Адміністратора не знайдено" });
        }

        const admin = results[0];

        bcrypt.compare(oldPassword, admin.password, (err, isMatch) => {
            if (err) {
                console.error("Помилка перевірки старого пароля:", err);
                return res.status(500).json({ message: "Помилка сервера" });
            }

            if (!isMatch) {
                return res.status(401).json({ message: "Старий пароль неправильний" });
            }

            // Перевірка обмежень для нового пароля
            if (!isPasswordValid(newPassword)) {
                return res.status(400).json({
                    message: "Новий пароль повинен містити латинські букви, символи кирилиці та знаки арифметичних операцій.",
                });
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
                if (err) {
                    console.error("Помилка зміни пароля адміністратора:", err);
                    return res.status(500).json({ message: "Помилка сервера" });
                }
                res.status(200).json({ message: "Пароль адміністратора успішно змінено" });
            });
        });
    });
});


router.get("/users", (req, res) => {
    db.query(
        "SELECT id, username, role, is_blocked, password_restrictions FROM users",
        (err, results) => {
            if (err) {
                console.error("Помилка завантаження користувачів:", err);
                return res.status(500).json({ message: "Помилка завантаження користувачів" });
            }
            res.status(200).json(results);
        }
    );
});


// Додавання користувача з порожнім паролем
router.post("/add-user", (req, res) => {
    const { username } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("Помилка перевірки існування користувача:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "Користувач вже існує" });
        }

        db.query(
            "INSERT INTO users (username, password, role, is_blocked, password_restrictions) VALUES (?, '', 'user', FALSE, FALSE)",
            [username],
            (err) => {
                if (err) {
                    console.error("Помилка додавання користувача:", err);
                    return res.status(500).json({ message: "Помилка додавання користувача" });
                }
                res.status(201).json({ message: "Користувача успішно додано" });
            }
        );
    });
});

// Блокування користувача
router.post("/block", (req, res) => {
    const { id, block } = req.body;

    db.query("UPDATE users SET is_blocked = ? WHERE id = ?", [block ? 1 : 0, id], (err) => {
        if (err) {
            console.error("Помилка зміни статусу блокування користувача:", err);
            return res.status(500).json({ message: "Помилка зміни статусу блокування" });
        }
        res.status(200).json({ message: `Користувача ${block ? "заблоковано" : "розблоковано"}` });
    });
});

router.post("/toggle-restrictions", (req, res) => {
    const { id, enable } = req.body;

    console.log(`Отримано запит: ID=${id}, enable=${enable}`);

    if (!id || typeof enable === "undefined") {
        console.error("Запит відхилено: ID або enable відсутній");
        return res.status(400).json({ message: "ID та статус обмежень є обов'язковими" });
    }

    // Приведення enable до булевого значення
    const isEnabled = !!enable;
    console.log(`Після приведення до булевого значення: isEnabled=${isEnabled}`);

    // Логування перед виконанням SQL-запиту
    const checkQuery = "SELECT password_restrictions FROM users WHERE id = ?";
    console.log(`SQL-запит на перевірку: ${checkQuery} [ID=${id}]`);

    db.query(checkQuery, [id], (err, results) => {
        if (err) {
            console.error("Помилка під час отримання поточного стану:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }

        if (results.length === 0) {
            console.warn(`Користувача з ID=${id} не знайдено`);
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        const currentStatus = results[0].password_restrictions;
        console.log(`Поточний статус обмежень для ID=${id}: currentStatus=${currentStatus}`);

        // Якщо статус вже такий самий, повертаємо відповідь
        if (currentStatus === isEnabled) {
            console.log(`ID=${id}: статус обмежень вже ${isEnabled ? "увімкнено" : "вимкнено"}`);
            return res.status(200).json({
                message: `Обмеження вже ${isEnabled ? "увімкнено" : "вимкнено"}`,
            });
        }

        // Логування перед оновленням
        const updateQuery = "UPDATE users SET password_restrictions = ? WHERE id = ?";
        console.log(
            `SQL-запит на оновлення: ${updateQuery} [password_restrictions=${isEnabled ? 1 : 0}, ID=${id}]`
        );

        db.query(updateQuery, [isEnabled ? 1 : 0, id], (err, updateResults) => {
            if (err) {
                console.error("Помилка зміни обмежень для користувача:", err);
                return res.status(500).json({ message: "Помилка сервера" });
            }

            console.log(`Результат оновлення: ${JSON.stringify(updateResults)}`);

            if (updateResults.affectedRows === 0) {
                console.warn(`ID=${id}: Запис не змінено`);
                return res.status(404).json({ message: "Користувача не знайдено або зміни не потрібні" });
            }

            console.log(`ID=${id}: обмеження ${isEnabled ? "увімкнено" : "вимкнено"}`);
            res.status(200).json({
                message: `Обмеження ${isEnabled ? "увімкнено" : "вимкнено"}`,
            });
        });
    });
});

// Зміна пароля користувача
router.post("/change-password", (req, res) => {
    const { id, oldPassword, newPassword } = req.body;

    if (!id || !oldPassword || !newPassword) {
        return res.status(400).json({ message: "ID, старий пароль та новий пароль є обов'язковими" });
    }

    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Помилка під час пошуку користувача:", err);
            return res.status(500).json({ message: "Помилка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        const user = results[0];

        // Перевірка старого пароля
        bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
            if (err) {
                console.error("Помилка перевірки старого пароля:", err);
                return res.status(500).json({ message: "Помилка сервера" });
            }

            if (!isMatch) {
                return res.status(401).json({ message: "Старий пароль неправильний" });
            }

            // Хешування нового пароля
            const hashedPassword = bcrypt.hashSync(newPassword, 10);
            db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id], (err) => {
                if (err) {
                    console.error("Помилка зміни пароля:", err);
                    return res.status(500).json({ message: "Помилка сервера" });
                }

                res.status(200).json({ message: "Пароль успішно змінено" });
            });
        });
    });
});


module.exports = router;
