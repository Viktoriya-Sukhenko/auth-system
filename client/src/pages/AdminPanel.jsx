import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/global.css";
import "../styles/admin.css";
import "../styles/help.css";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // Функція для показу повідомлення
  const showToast = (message, isError = false) => {
    if (isError) {
      setErrorMessage(message);
    } else {
      setSuccessMessage(message);
    }

    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 3000);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/users");
      console.log("Отримано користувачів:", response.data);
      setUsers(response.data);
    } catch (err) {
      console.error(
        "Помилка завантаження користувачів:",
        err.response?.data || err
      );
      showToast(
        err.response?.data?.message || "Помилка завантаження користувачів",
        true
      );
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/add-user", {
        username: newUsername,
      });
      setNewUsername("");
      fetchUsers();
      showToast("Користувача успішно додано");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Помилка під час додавання користувача",
        true
      );
    }
  };

  const handleBlockUser = async (id, block) => {
    try {
      await axios.post("http://localhost:5000/api/auth/block", { id, block });
      fetchUsers();
      showToast(`Користувача ${block ? "заблоковано" : "розблоковано"}`);
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "Помилка під час зміни статусу блокування",
        true
      );
    }
  };

  const handleToggleRestrictions = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;

      console.log(`Надсилається запит: ID=${id}, newStatus=${newStatus}`);

      await axios.post("http://localhost:5000/api/auth/toggle-restrictions", {
        id,
        enable: newStatus,
      });

      await fetchUsers();

      showToast(`Обмеження ${newStatus ? "увімкнено" : "вимкнено"}`);
    } catch (err) {
      console.error(
        "Помилка під час зміни обмежень:",
        err.response?.data || err
      );
      showToast(
        err.response?.data?.message || "Помилка під час зміни обмежень",
        true
      );
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast("Введіть старий та новий пароль", true);
      return;
    }

    try {
      const adminId = localStorage.getItem("userId");
      if (!adminId) {
        showToast("Не вдалося отримати ID адміністратора", true);
        return;
      }

      await axios.post("http://localhost:5000/api/auth/change-admin-password", {
        id: adminId,
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      showToast("Пароль адміністратора успішно змінено");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Помилка зміни пароля адміністратора",
        true
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="admin-panel">
      {/* Повідомлення успіху */}
      {successMessage && (
        <div className="toast-notification show">{successMessage}</div>
      )}
      {/* Повідомлення помилки */}
      {errorMessage && (
        <div
          className="toast-notification show"
          style={{ backgroundColor: "#ff4d4d" }}
        >
          {errorMessage}
        </div>
      )}

      <div className="left-column">
        <div className="change-password">
          <h2>Змінити пароль адміністратора</h2>
          <input
            type="password"
            placeholder="Старий пароль"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Новий пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            className="change-password-button"
            onClick={handleChangeAdminPassword}
          >
            Змінити пароль
          </button>
        </div>

        <div className="add-user">
          <h2>Додати нового користувача</h2>
          <input
            type="text"
            placeholder="Ім'я користувача"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button className="add-user-button" onClick={handleAddUser}>
            Додати
          </button>
        </div>

        <div className="logout-section">
          <button className="logout-button" onClick={handleLogout}>
            Вийти
          </button>
        </div>
      </div>

      <div className="right-column">
        <h2>Список користувачів</h2>
        <table>
          <thead>
            <tr>
              <th>Ім&apos;я</th>
              <th>Роль</th>
              <th>Заблокований</th>
              <th>Обмеження</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{user.is_blocked ? "Так" : "Ні"}</td>
                <td>{user.password_restrictions ? "Увімкнено" : "Вимкнено"}</td>
                <td>
                  <div className="action-buttons-wrapper">
                    <button
                      className="block-user-button"
                      onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                    >
                      {user.is_blocked ? "Розблокувати" : "Заблокувати"}
                    </button>
                    <button
                      className="toggle-restrictions-button"
                      onClick={() => {
                        console.log(
                          `Передано до handleToggleRestrictions: ID=${user.id}, currentStatus=${user.password_restrictions}`
                        );
                        handleToggleRestrictions(
                          user.id,
                          user.password_restrictions
                        );
                      }}
                    >
                      {user.password_restrictions
                        ? "Вимкнути обмеження"
                        : "Увімкнути обмеження"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
