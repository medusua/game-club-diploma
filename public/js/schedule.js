// public/js/schedule.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Загружает расписание игр и информацию о мастерах,
// отрисовывает карточки событий и управляет логикой записи на игру.

document.addEventListener('authChecked', async () => {
    const container = document.getElementById('schedule-container');
    if (!container) return; // Если мы не на странице расписания, ничего не делаем.

    const bookingModalElement = document.getElementById('bookingModal');
    const bookingModal = bookingModalElement ? new bootstrap.Modal(bookingModalElement) : null;
    const guestModalElement = document.getElementById('guestModal');
    const guestModal = guestModalElement ? new bootstrap.Modal(guestModalElement) : null;
    const eventIdInput = document.getElementById('eventIdInput');
    const bookingForm = document.getElementById('bookingForm');
    const modalAlertPlaceholder = document.getElementById('modal-alert-placeholder');

    try {
        // Загружаем данные о событиях и мастерах одновременно для эффективности.
        const [eventsRes, mastersRes] = await Promise.all([
            fetch('/api/events'),
            fetch('/api/masters')
        ]);
        if (!eventsRes.ok || !mastersRes.ok) throw new Error('Ошибка загрузки данных');
        
        const events = await eventsRes.json();
        const masters = await mastersRes.json();
        
        // Преобразуем массив мастеров в объект (карту) для быстрого доступа по ID.
        const mastersMap = masters.reduce((acc, master) => {
            acc[master.id] = master;
            return acc;
        }, {});

        container.innerHTML = '';
        if (events.length === 0) {
            container.innerHTML = '<p class="text-center col-12">В ближайшее время нет запланированных игр.</p>';
            return;
        }

        events.forEach(event => {
            const master = mastersMap[event.master_id];
            if (!master) return; // Пропускаем событие, если для него не найден мастер.

            const eventDate = new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

             // Создаем переменные для класса и текста бейджа в зависимости от кол-ва мест
            const badgeClass = event.available_slots > 0 ? 'bg-success' : 'bg-danger';
            const badgeText = event.available_slots > 0 ? `Свободно: ${event.available_slots} из ${event.total_slots}` : 'Мест нет';

            const eventCardHtml = `
            <div class="col">
                <div class="card h-100 d-flex flex-row overflow-hidden">
                    <img src="${event.game_image}" class="card-img-left" alt="${event.game_title}" style="width: 45%; object-fit: cover;">
                    <div class="card-body d-flex flex-column p-3">
                        <h5 class="card-title">${event.game_title}</h5>
                        <p class="card-text small text-white-50 flex-grow-1">${event.description}</p>
                        <ul class="list-unstyled small text-white-50 mb-3">
                            <li class="mb-1"><i class="bi bi-calendar-check me-2"></i>${eventDate}</li>
                            <li><i class="bi bi-clock me-2"></i>${event.time}</li>
                        </ul>
                        <div class="mt-auto">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${master.image}" class="rounded-circle me-3" width="45" height="45" alt="${master.name}" style="object-fit: cover; border: 2px solid var(--theme-border);">
                                <div>
                                    <div class="small text-white-50">Мастер</div>
                                    <div class="fw-bold">${master.name}</div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <!-- Используем наши переменные -->
                                <span class="badge ${badgeClass} fs-6" id="slots-count-${event.id}">${badgeText}</span>
                                <button type="button" class="btn btn-warning btn-sm book-btn" data-event-id="${event.id}" ${event.available_slots <= 0 ? 'disabled' : ''}>Записаться</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            container.insertAdjacentHTML('beforeend', eventCardHtml);
        });
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger col-12">${error.message}</div>`;
    }
    
    // --- Логика для модальных окон записи ---
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('book-btn')) {
            if (window.authState.loggedIn) {
                if(eventIdInput) eventIdInput.value = e.target.dataset.eventId;
                bookingModal?.show();
            } else {
                guestModal?.show();
            }
        }
    });

    if (bookingModalElement) {
        bookingModalElement.addEventListener('hidden.bs.modal', () => {
            if (bookingForm) bookingForm.reset();
            if (modalAlertPlaceholder) modalAlertPlaceholder.innerHTML = '';
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventId = eventIdInput.value;
            try {
                const response = await fetch(`/api/events/${eventId}/book`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                if (!response.ok) { const result = await response.json(); throw new Error(result.message); }
                const result = await response.json();
                showAlert('modal-alert-placeholder', `Вы успешно записаны, ${window.authState.user.name}!`, 'success');
                const updatedEvent = result.event;
                const slotsCountElement = document.getElementById(`slots-count-${updatedEvent.id}`);
                if (slotsCountElement) slotsCountElement.textContent = `Свободно: ${updatedEvent.available_slots} из ${updatedEvent.total_slots}`;
                if (updatedEvent.available_slots <= 0) {
                    const button = document.querySelector(`.book-btn[data-event-id="${updatedEvent.id}"]`);
                    if (button) { button.disabled = true; button.textContent = 'Мест нет'; }
                }
                setTimeout(() => bookingModal.hide(), 2000);
            } catch (error) {
                showAlert('modal-alert-placeholder', error.message, 'danger');
            }
        });
    }
});