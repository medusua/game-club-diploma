// public/js/masters.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Загружает и отображает информацию о мастерах клуба.

document.addEventListener('authChecked', async () => {
    const container = document.getElementById('masters-container');
    if (!container) return; // Если мы не на странице мастеров, ничего не делаем.

    try {
        const response = await fetch('/api/masters');
        if (!response.ok) throw new Error('Не удалось загрузить данные мастеров');
        const masters = await response.json();

        container.innerHTML = ''; // Очищаем спиннер
        masters.forEach(master => {
            const masterCardHtml = `
                <div class="col d-flex">
                    <div class="card h-100 text-center">
                        <img src="${master.image}" class="card-img-top" alt="${master.name}" style="height: 450px; !important object-fit: cover; object-position: top;">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${master.name}</h5>
                            <p class="card-text small text-white-50 flex-grow-1">${master.bio}</p>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', masterCardHtml);
        });
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
});