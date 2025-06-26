// public/js/auth.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Управляет состоянием аутентификации пользователя,
// отображением UI и обработкой модальных окон входа/регистрации.
// Загружается на каждой странице первым.

/**
 * Глобальный объект для хранения текущего статуса аутентификации.
 * @property {boolean} loggedIn - true, если пользователь вошел.
 * @property {object|null} user - Данные пользователя (id, name), если он вошел.
 */
window.authState = {
    loggedIn: false,
    user: null
};

/**
 * Показывает уведомление в указанном контейнере.
 * @param {string} placeholderId - ID элемента-контейнера для уведомления.
 * @param {string} message - Текст сообщения.
 * @param {string} [type='danger'] - Тип уведомления ('success', 'danger', 'warning').
 */
function showAlert(placeholderId, message, type = 'danger') {
    const placeholder = document.getElementById(placeholderId);
    if (placeholder) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        placeholder.innerHTML = '';
        placeholder.append(wrapper);
    }
}

/**
 * Обновляет интерфейс навигационной панели в зависимости от статуса входа.
 * @param {boolean} loggedIn - Статус входа.
 * @param {object|null} user - Объект пользователя.
 */
function updateUI(loggedIn, user) {
    window.authState.loggedIn = loggedIn;
    window.authState.user = user;
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const userGreeting = document.getElementById('user-greeting');
    if (loggedIn) {
        guestView?.classList.add('d-none');
        userView?.classList.remove('d-none');
        if (userGreeting) userGreeting.textContent = `Привет, ${user.name}!`;
    } else {
        guestView?.classList.remove('d-none');
        userView?.classList.add('d-none');
    }
}

// Основная логика, которая запускается после загрузки HTML
document.addEventListener('DOMContentLoaded', async () => {
    // --- Инициализация элементов ---
    const guestView = document.getElementById('guest-view');
    const logoutButton = document.getElementById('logout-button');
    const loginModalEl = document.getElementById('loginModal');
    const loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;
    const registerModalEl = document.getElementById('registerModal');
    const registerModal = registerModalEl ? new bootstrap.Modal(registerModalEl) : null;
    const loginForm = document.getElementById('loginFormModal');
    const registerForm = document.getElementById('registerFormModal');
    
    // 1. Проверка статуса аутентификации при загрузке
    try {
        const response = await fetch('/api/check-auth');
        updateUI(response.ok, response.ok ? (await response.json()).user : null);
    } catch (error) {
        updateUI(false, null);
    } finally {
        // Отправляем кастомное событие, чтобы другие скрипты знали, что проверка завершена.
        document.dispatchEvent(new Event('authChecked'));
    }

    // 2. Обработчики для кнопок "Вход/Регистрация" в навбаре
    if (guestView) {
        guestView.addEventListener('click', e => {
            if (e.target.closest('a[href="/login.html"]')) { e.preventDefault(); loginModal?.show(); }
            if (e.target.closest('a[href="/register.html"]')) { e.preventDefault(); registerModal?.show(); }
        });
    }

    // 3. Обработчик кнопки "Выход"
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            updateUI(false, null);
        });
    }

    // 4. Обработчик формы ЛОГИНА
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const data = { phone: loginForm.querySelector('#loginPhone').value, password: loginForm.querySelector('#loginPassword').value };
            try {
                const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (!response.ok) { const error = await response.json(); throw new Error(error.message); }
                const checkAuth = await fetch('/api/check-auth');
                const authData = await checkAuth.json();
                updateUI(true, authData.user);
                loginModal.hide();
            } catch (error) {
                showAlert('login-alert-placeholder', error.message || 'Неверный телефон или пароль');
            }
        });
    }

    // 5. Обработчик формы РЕГИСТРАЦИИ
    if (registerForm) {
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const data = { name: registerForm.querySelector('#registerName').value, phone: registerForm.querySelector('#registerPhone').value, password: registerForm.querySelector('#registerPassword').value };
            try {
                const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (!response.ok) { const error = await response.json(); throw new Error(error.message); }
                showAlert('register-alert-placeholder', 'Регистрация прошла успешно! Теперь вы можете войти.', 'success');
                
                // Переключаем окна после успешной регистрации
                registerModalEl.addEventListener('hidden.bs.modal', () => {
                    loginModal?.show();
                }, { once: true });
                registerModal.hide();

            } catch (error) {
                showAlert('register-alert-placeholder', error.message || 'Ошибка регистрации');
            }
        });
    }

    // 6. Обработчик переключения окон "Требуется вход" -> "Вход/Регистрация"
    document.addEventListener('click', (e) => {
        const actionButton = e.target.closest('[data-action]');
        if (!actionButton) return;
        e.preventDefault();

        const parentModalEl = actionButton.closest('.modal');
        if (!parentModalEl) return;
        
        const parentModalInstance = bootstrap.Modal.getInstance(parentModalEl);
        if (!parentModalInstance) return;

        const action = actionButton.dataset.action;

        // Вешаем одноразовый слушатель, который сработает ПОСЛЕ закрытия текущего окна.
        parentModalEl.addEventListener('hidden.bs.modal', () => {
            if (action === 'open-login') { loginModal?.show(); }
            if (action === 'open-register') { registerModal?.show(); }
        }, { once: true }); // { once: true } гарантирует, что слушатель сработает только один раз и удалится.

        // Даем команду на закрытие текущего окна.
        parentModalInstance.hide();
    });

    // 7. Логика для изменения фона навигации при скролле
    const navbar = document.getElementById('main-navbar');
    if (navbar) {
        const updateNavbarStyle = () => {
            const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
            if (isHomePage && window.scrollY < 50) {
                navbar.classList.add('navbar-transparent');
                navbar.classList.remove('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-transparent');
                navbar.classList.add('navbar-scrolled');
            }
        };
        window.addEventListener('scroll', updateNavbarStyle);
        updateNavbarStyle(); // Устанавливаем правильное состояние при загрузке
    }
});