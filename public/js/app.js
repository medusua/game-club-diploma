// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Элементы навигации, связанные с авторизацией
    const authLinks = document.getElementById('auth-links'); // Контейнер для "Вход/Регистрация"
    const userLinks = document.getElementById('user-links'); // Контейнер для "Привет/Выход"
    const userGreeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-btn');

    // Проверяем, есть ли информация о пользователе в localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        // Если пользователь "вошел"
        userGreeting.textContent = `Привет, ${loggedInUser}!`;
        authLinks.classList.add('d-none'); // Скрываем "Вход/Регистрация"
        userLinks.classList.remove('d-none'); // Показываем "Привет/Выход"
    } else {
        // Если пользователь не "вошел"
        authLinks.classList.remove('d-none');
        userLinks.classList.add('d-none');
    }

    // Обработчик для кнопки "Выход"
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Удаляем пользователя из localStorage
            localStorage.removeItem('loggedInUser');
            // Перенаправляем на главную страницу, чтобы обновить состояние
            window.location.href = '/';
        });
    }
});