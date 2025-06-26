// public/js/contacts.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Загружает контактные данные и карту на отдельной странице контактов.

document.addEventListener('authChecked', async () => {
    const addressLi = document.getElementById('contact-address-li');
    const phoneLi = document.getElementById('contact-phone-li');
    const emailLi = document.getElementById('contact-email-li');
    const mapContainer = document.getElementById('map-container-full');
    if (!addressLi) return; // Если мы не на странице контактов, ничего не делаем.

    try {
        const response = await fetch('/api/contacts');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const contacts = await response.json();

        addressLi.innerHTML = `<i class="bi bi-geo-alt-fill me-2"></i>${contacts.address}`;
        phoneLi.innerHTML = `<i class="bi bi-telephone-fill me-2"></i><a href="tel:${contacts.phone}" class="text-warning">${contacts.phone}</a>`;
        emailLi.innerHTML = `<i class="bi bi-envelope-fill me-2"></i><a href="mailto:${contacts.email}" class="text-warning">${contacts.email}</a>`;
        mapContainer.innerHTML = `<iframe src="${contacts.map_iframe_url}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } catch (error) {
        addressLi.textContent = 'Ошибка загрузки контактов.';
    }
});