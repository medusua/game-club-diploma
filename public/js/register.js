// public/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const alertPlaceholder = document.getElementById('alert-placeholder');

    const showAlert = (message, type = 'danger') => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
        alertPlaceholder.innerHTML = '';
        alertPlaceholder.append(wrapper);
    };

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;

        if (password !== passwordConfirm) {
            showAlert('Пароли не совпадают.');
            return;
        }

        if (password.length < 6) {
            showAlert('Пароль должен быть не менее 6 символов.');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ошибка регистрации.');
            }

            // Успех!
            showAlert('Вы успешно зарегистрированы! Теперь вы можете войти.', 'success');
            setTimeout(() => {
                window.location.href = '/login.html'; // Перенаправляем на страницу входа
            }, 2000);

        } catch (error) {
            showAlert(error.message);
        }
    });
});