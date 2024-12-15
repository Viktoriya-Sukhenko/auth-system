import { useState } from "react";

const HelpModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleModal = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <button className="help-button" onClick={toggleModal}>
                Довідка
            </button>
            {isOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Про програму</h2>
                        <p><strong>Автор:</strong> Сухенко Вікторія</p>
                        <p><strong>Завдання:</strong> Наявність латинських букв, символів кирилиці і знаків арифметичних операцій.</p>
                        <button className="close-button" onClick={toggleModal}>
                            Закрити
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpModal;
