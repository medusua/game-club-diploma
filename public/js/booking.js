// public/js/booking.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Управляет логикой многошаговой формы бронирования в модальном окне.

document.addEventListener('authChecked', () => {
    const startBookingBtn = document.getElementById('startBookingBtn');
    if (!startBookingBtn) return; // Если мы не на странице бронирования, ничего не делаем.

    // --- Инициализация элементов ---
    const guestModal = new bootstrap.Modal(document.getElementById('guestBookingModal'));
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingProcessModal'));
    const bookingModalEl = document.getElementById('bookingProcessModal');
    const modalTitle = document.getElementById('bookingModalTitle');
    const steps = { 1: document.getElementById('step1'), 2: document.getElementById('step2'), 3: document.getElementById('step3') };
    const choiceRecap = document.getElementById('choice-recap');
    const timeOptionsContainer = document.getElementById('time-options-container');
    const finalChoiceRecap = document.getElementById('final-choice-recap');
    const finalBookerName = document.getElementById('final-booker-name');
    const finalBookingDate = document.getElementById('final-booking-date');
    const backButton = document.getElementById('back-button');
    const submitButton = document.getElementById('submit-booking-button');
    const alertPlaceholder = document.getElementById('booking-alert-placeholder-modal');

    // --- Данные и состояние ---
    const prices = {
        "Малый стол": { type: 'table', options: { "Будни утро (до 17:30)": "2400₽", "Будни вечер (c 17:30)": "3400₽", "Выходные утро/вечер": "4400₽" }},
        "Большой стол": { type: 'table', options: { "Будни утро (до 17:30)": "3000₽", "Будни вечер (c 17:30)": "4250₽", "Выходные утро/вечер": "5500₽" }},
        "Комната": { type: 'room', options: { "Будни утро (до 17:30)": "3600₽", "Будни вечер (c 17:30)": "5100₽", "Выходные утро/вечер": "6600₽" }}
    };
    let currentStep = 1;
    let bookingDetails = {};

    // --- Функции ---
    const showStep = (stepNumber) => {
        currentStep = stepNumber;
        Object.values(steps).forEach(step => step.classList.add('d-none'));
        steps[stepNumber].classList.remove('d-none');
        backButton.classList.toggle('d-none', stepNumber === 1);
        submitButton.classList.toggle('d-none', stepNumber !== 3);
        modalTitle.textContent = `Шаг ${stepNumber}: ${stepNumber === 1 ? 'Выберите место' : stepNumber === 2 ? 'Выберите время' : 'Подтвердите данные'}`;
    };
    
    const resetModal = () => {
        bookingDetails = {};
        showStep(1);
        alertPlaceholder.innerHTML = '';
        document.getElementById('finalBookingForm').reset();
    };

    // --- Обработчики событий ---
    startBookingBtn.addEventListener('click', () => {
        if (window.authState.loggedIn) {
            finalBookerName.value = window.authState.user.name;
            bookingModal.show();
        } else {
            guestModal.show();
        }
    });

    steps[1].addEventListener('click', e => {
        if (e.target.matches('[data-booking-choice]')) {
            bookingDetails.choice = e.target.dataset.bookingChoice;
            choiceRecap.textContent = bookingDetails.choice;
            timeOptionsContainer.innerHTML = '';
            const options = prices[bookingDetails.choice].options;
            for (const [time, price] of Object.entries(options)) {
                timeOptionsContainer.innerHTML += `<button type="button" class="list-group-item list-group-item-action d-flex justify-content-between" data-time-choice="${time}"><span>${time}</span><strong>${price}</strong></button>`;
            }
            showStep(2);
        }
    });

    steps[2].addEventListener('click', e => {
        const choiceButton = e.target.closest('[data-time-choice]');
        if (choiceButton) {
            bookingDetails.time = choiceButton.dataset.timeChoice;
            finalChoiceRecap.value = `${bookingDetails.choice} (${bookingDetails.time})`;
            showStep(3);
        }
    });

    backButton.addEventListener('click', () => {
        if (currentStep > 1) showStep(currentStep - 1);
    });

    bookingModalEl.addEventListener('hidden.bs.modal', resetModal);

    submitButton.addEventListener('click', async () => {
        const bookingDate = finalBookingDate.value;
        if (!bookingDate) {
            showAlert('Пожалуйста, выберите дату.', 'danger');
            return;
        }

        const dataToSend = {
            bookingType: prices[bookingDetails.choice].type,
            bookerName: finalBookerName.value,
            bookingDate: bookingDate,
            bookingTime: bookingDetails.time
        };
        
        try {
            const response = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alertPlaceholder.innerHTML = `<div class="alert alert-success">Ваша бронь на ${bookingDetails.choice} (${bookingDate}) успешно создана!</div>`;
            backButton.classList.add('d-none');
            submitButton.classList.add('d-none');
            steps[3].classList.add('d-none');
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });

    // Устанавливаем минимальную дату в календаре
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('final-booking-date').setAttribute('min', today);

    // Активируем GLightbox для галереи на этой странице
    if (typeof GLightbox === 'function') {
        GLightbox({ selector: '.glightbox' });
    }
});