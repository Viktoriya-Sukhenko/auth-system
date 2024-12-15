import { useState } from "react";
import axios from "axios";

import "../styles/global.css";
import "../styles/login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState(null);

  // Функція для входу
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Ім'я користувача та пароль є обов'язковими");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          username,
          password,
        }
      );

      const { id, role, forceChange } = response.data;

      localStorage.setItem("userId", id);

      if (forceChange) {
        setShowModal(true);
        setUserId(id);
        setError(response.data.message);
        return;
      }

      setError("");
      window.location.href = role === "admin" ? "/admin" : "/user";
    } catch (err) {
      setError(err.response?.data?.message || "Помилка входу");
    }
  };

  const handleFirstLogin = async (e) => {
    e.preventDefault();
    if (!username) {
      setError("Ім'я користувача є обов'язковим для першого входу");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          username,
          password: "",
          isFirstLogin: true,
        }
      );

      if (response.data.firstLogin) {
        setShowModal(true);
        setUserId(response.data.id);
        setError("");
      } else {
        setError("Користувач вже має пароль. Використовуйте звичайний вхід.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Помилка перевірки логіна");
    }
  };

  // Функція для встановлення нового пароля
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Заповніть всі поля для встановлення пароля");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Паролі не збігаються");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/set-password",
        {
          id: userId,
          password: newPassword,
        }
      );
      setSuccess(
        response.data.message ||
          "Пароль успішно встановлено. Увійдіть з новими обліковими даними."
      );
      setError("");
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Помилка встановлення пароля");
    }
  };

  return (
    <div className="container">
      <h1>Вхід</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Ім'я користувача"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="buttons-horizontal">
          <button type="submit">Увійти</button>
          <button type="button" onClick={handleFirstLogin}>
            Перший вхід
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      {/* Модальне вікно */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Ваш пароль не відповідає обмеженням</h2>
            <p>Пароль повинен містити:</p>
            <ul>
              <li>Латинські букви</li>
              <li>Символи кирилиці</li>
              <li>Знаки арифметичних операцій (+, -, *, /, =)</li>
            </ul>
            <form onSubmit={handleSetPassword}>
              <input
                type="password"
                placeholder="Новий пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Підтвердити пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="buttons-horizontal">
                <button type="submit">Зберегти пароль</button>
                <button
                  type="button"
                  className="cancel"
                  onClick={() => setShowModal(false)}
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
