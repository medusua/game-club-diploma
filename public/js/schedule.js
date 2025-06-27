// public/js/schedule.js (ФИНАЛЬНАЯ ЕДИНАЯ ВЕРСИЯ)

document.addEventListener('authChecked', async () => {
    const container = document.getElementById('schedule-container');
    if (!container) return;

    // --- Инициализация всех необходимых элементов ---
    const bookingModalElement = document.getElementById('bookingModal');
    const bookingModal = bookingModalElement ? new bootstrap.Modal(bookingModalElement) : null;
    const guestModalElement = document.getElementById('guestModal');
    const guestModal = guestModalElement ? new bootstrap.Modal(guestModalElement) : null;
    const eventIdInput = document.getElementById('eventIdInput');
    const bookingForm = document.getElementById('bookingForm');
    const modalAlertPlaceholder = document.getElementById('modal-alert-placeholder');

    // --- Локальная функция для показа уведомлений в модальном окне ---
    const showAlert = (message, type = 'success') => {
        if (modalAlertPlaceholder) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = `<div class="alert alert-${type} alert-dismissible" role="alert">${message}</div>`;
            modalAlertPlaceholder.innerHTML = '';
            modalAlertPlaceholder.append(wrapper);
        }
    };

    try {
        const [eventsRes, mastersRes] = await Promise.all([
            fetch('/api/events'),
            fetch('/api/masters')
        ]);
        if (!eventsRes.ok || !mastersRes.ok) throw new Error('Ошибка загрузки данных');
        
        const events = await eventsRes.json();
        const masters = await mastersRes.json();
        
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
            if (!master) return;

            const eventDate = new Date(event.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const badgeClass = event.available_slots > 0 ? 'bg-success' : 'bg-danger';
            const badgeText = event.available_slots > 0 ? `Свободно: ${event.available_slots} из ${event.total_slots}` : 'Мест нет';
            const buttonText = event.available_slots > 0 ? 'Записаться' : 'Мест нет';

            // *** ИСПОЛЬЗУЕМ ВАШ ПРАВИЛЬНЫЙ, ОДОБРЕННЫЙ HTML-ШАБЛОН ***
            const eventCardHtml = `
            <div class="col">
                <div class="card h-100 text-center p-3">
                    <div class="schedule-card-image-wrapper">
                        <img src="${event.game_image}" alt="${event.game_title}">
                    </div>
                    
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${event.game_title}</h5>
                        <p class="card-text small text-white-50 flex-grow-1">${event.description}</p>
                        
                        <ul class="list-unstyled small text-white-50 my-3">
                            <li class="mb-1"><i class="bi bi-calendar-check me-2"></i>${eventDate}</li>
                            <li><i class="bi bi-clock me-2"></i>${event.time}</li>
                        </ul>
                        
                        <div class="mt-auto">
                            <div class="d-flex align-items-center justify-content-center mb-3">
                                <img src="${master.image}" class="rounded-circle me-2" width="40" height="40" alt="${master.name}" style="object-fit: cover; border: 2px solid var(--theme-border);">
                                <div>
                                    <div class="small text-white-50">Мастер</div>
                                    <div class="fw-bold">${master.name}</div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge ${badgeClass} fs-6" id="slots-count-${event.id}">${badgeText}</span>
                                <button type="button" class="btn btn-warning btn-sm book-btn" data-event-id="${event.id}" ${event.available_slots <= 0 ? 'disabled' : ''}>${buttonText}</button>
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
    
    // --- Логика для модальных окон (с работающим обновлением UI) ---
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
                
                showAlert(`Вы успешно записаны, ${window.authState.user.name}!`, 'success');
                
                // *** ВОССТАНОВЛЕННАЯ И РАБОТАЮЩАЯ ЛОГИКА ОБНОВЛЕНИЯ ***
                const updatedEvent = result.event;
                const slotsCountElement = document.getElementById(`slots-count-${updatedEvent.id}`);
                const buttonElement = document.querySelector(`.book-btn[data-event-id="${updatedEvent.id}"]`);
                
                if (slotsCountElement) {
                    const newBadgeClass = updatedEvent.available_slots > 0 ? 'bg-success' : 'bg-danger';
                    const newBadgeText = updatedEvent.available_slots > 0 ? `Свободно: ${updatedEvent.available_slots} из ${updatedEvent.total_slots}` : 'Мест нет';
                    slotsCountElement.className = `badge ${newBadgeClass} fs-6`;
                    slotsCountElement.textContent = newBadgeText;
                }

                if (buttonElement && updatedEvent.available_slots <= 0) {
                    buttonElement.disabled = true;
                    buttonElement.textContent = 'Мест нет';
                }
                
                setTimeout(() => bookingModal.hide(), 2000);
            } catch (error) {
                showAlert(error.message, 'danger');
            }
        });
    }
});