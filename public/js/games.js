// public/js/games.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// Назначение: Загружает каталог игр и управляет их фильтрацией по категориям.

document.addEventListener('authChecked', () => {
    // Ждем сигнала от auth.js, чтобы начать работу.
    
    const gamesContainer = document.getElementById('games-container');
    const filterContainer = document.getElementById('filter-container');
    
    // Если мы не на странице игр, ничего не делаем.
    if (!gamesContainer || !filterContainer) return;

    let allGames = []; // Переменная для хранения полного списка загруженных игр.

    /**
     * Отрисовывает карточки игр на странице.
     * @param {Array<object>} gamesToRender - Массив игр для отрисовки.
     */
    const renderGames = (gamesToRender) => {
        gamesContainer.innerHTML = '';

        if (gamesToRender.length === 0) {
            gamesContainer.innerHTML = '<p class="text-center col-12">Игры в этой категории не найдены.</p>';
            return;
        }

        gamesToRender.forEach(game => {
            const cardHtml = `
                <div class="col">
                    <div class="card h-100 shadow-sm">
                        <img src="${game.image}" class="card-img-top" alt="${game.title}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${game.title}</h5>
                            <span class="badge bg-secondary align-self-start mb-2">${game.category}</span>
                            <p class="card-text flex-grow-1 small text-white-50">${game.description}</p>
                        </div>
                        <div class="card-footer">
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item"><i class="bi bi-people-fill me-2"></i>Игроки: ${game.players}</li>
                                <li class="list-group-item"><i class="bi bi-clock-fill me-2"></i>Время партии: ${game.play_time}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            gamesContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    };

    /**
     * Обрабатывает клики по кнопкам фильтров.
     */
    filterContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            filterContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            const category = e.target.dataset.category;
            const filteredGames = category === 'all'
                ? allGames
                : allGames.filter(game => game.category === category);
            
            renderGames(filteredGames);
        }
    });

    /**
     * Загружает полный список игр с сервера при первой загрузке страницы.
     */
    const loadAndRenderGames = async () => {
        try {
            const response = await fetch('/api/games');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            allGames = await response.json();
            renderGames(allGames);

        } catch (error) {
            console.error("Ошибка:", error);
            gamesContainer.innerHTML = '<div class="alert alert-danger col-12">Не удалось загрузить игры.</div>';
        }
    };

    loadAndRenderGames();
});