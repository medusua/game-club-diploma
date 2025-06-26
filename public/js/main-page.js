// public/js/main-page.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Управляет динамическим контентом на главной странице (события, контакты).

/**
 * Загружает и отрисовывает ближайшие D&D события.
 */
const loadUpcomingEvents = async () => {
    const container = document.getElementById('upcoming-events-container');
    if (!container) return;

    try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        let events = await response.json();
        
        container.innerHTML = '';
        if (events.length === 0) {
            container.innerHTML = '<p class="text-center col-12">В ближайшее время нет запланированных игр.</p>';
            return;
        }

        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        const eventsToShow = events.slice(0, 3);
        eventsToShow.forEach(event => {
            const eventDate = new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            const eventCardHtml = `
                <div class="col">
                    <div class="card cta-card h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${event.game_title}</h5>
                            <p class="card-text small text-white-50 flex-grow-1">Дата: ${eventDate}, ${event.time}</p>
                            <a href="/schedule.html" class="btn btn-outline-warning w-100 mt-auto">Подробнее</a>
                        </div>
                    </div>
                </div>`;
            container.insertAdjacentHTML('beforeend', eventCardHtml);
        });
    } catch (error) {
        console.error("Ошибка при загрузке событий:", error);
        container.innerHTML = '<div class="alert alert-warning col-12">Не удалось загрузить события.</div>';
    }
};

/**
 * Загружает контактную информацию и карту.
 */
const loadContactsOnMain = async () => {
    const phoneLink = document.getElementById('contact-phone');
    const addressP = document.getElementById('contact-address');
    const mapContainer = document.getElementById('map-container-main');
    if (!phoneLink || !addressP || !mapContainer) return;

    try {
        const response = await fetch('/api/contacts');
        if (!response.ok) throw new Error('Не удалось загрузить контакты');
        const contacts = await response.json();

        phoneLink.href = `tel:${contacts.phone}`;
        phoneLink.textContent = contacts.phone;
        addressP.textContent = contacts.address;
        mapContainer.innerHTML = `<iframe src="${contacts.map_iframe_url}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    } catch (error) {
        console.error("Ошибка при загрузке контактов:", error);
        if (addressP) addressP.textContent = 'Ошибка загрузки.';
        if (phoneLink) phoneLink.textContent = '';
    }
};

// Главный слушатель, который запускает все функции для этой страницы.
document.addEventListener('authChecked', () => {
    loadUpcomingEvents();
    loadContactsOnMain();
    if (typeof GLightbox === 'function') {
        GLightbox({ selector: '.glightbox' });
    }
});