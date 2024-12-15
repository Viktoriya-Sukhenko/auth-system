import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/global.css";
import "../styles/user.css";

const UserPanel = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("Паролі не збігаються", true);
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      showToast("Не вдалося отримати ID користувача. Увійдіть у систему знову.", true);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/change-password", {
        id: userId,
        oldPassword,
        newPassword,
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Пароль успішно змінено");
    } catch (err) {
      showToast(err.response?.data?.message || "Помилка під час зміни пароля", true);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="user-panel">
      {/* Toast повідомлення */}
      {successMessage && (
        <div className={`toast-notification toast-success show`}>{successMessage}</div>
      )}
      {errorMessage && (
        <div className={`toast-notification toast-error show`}>{errorMessage}</div>
      )}

      <h1>Панель користувача</h1>

      <div className="change-password-section">
        <h2>Зміна пароля</h2>
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
        <input
          type="password"
          placeholder="Підтвердьте пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button className="change-password-button" onClick={handleChangePassword}>
          Змінити пароль
        </button>
      </div>

      <button className="logout-button" onClick={handleLogout}>
        Вийти
      </button>
    </div>
  );
};

export default UserPanel;
