/* eslint-disable no-unused-vars */
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import UserPanel from "./pages/UserPanel";
import HelpModal from "./pages/HelpModal";

const App = () => {
    return (
        <Router>
            <HelpModal /> {/* Додано компонент Довідка */}
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/user" element={<UserPanel />} />
            </Routes>
        </Router>
    );
};

export default App;
