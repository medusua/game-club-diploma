// server/index.js

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const JWT_SECRET = 'super_secret_key_for_diploma'; // В реальном проекте выносится в переменные окружения (.env)

// --- Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


// --- Вспомогательные функции для работы с БД ---

/**
 * Асинхронно читает и парсит JSON-файл базы данных.
 * @returns {Promise<object>} Объект базы данных.
 */
const readDb = async () => {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Ошибка при чтении db.json:", err);
        // Возвращаем пустую структуру в случае ошибки, чтобы избежать падения сервера.
        return { users: [], games: [], events: [], bookings: [], contacts: {}, masters: [] };
    }
};

/**
 * Асинхронно записывает данные в JSON-файл базы данных.
 * @param {object} data - Объект для записи в файл.
 */
const writeDb = async (data) => {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error("Ошибка при записи в db.json:", err);
    }
};

// --- Middleware для проверки JWT токена ---

/**
 * Проверяет наличие и валидность JWT токена в cookie.
 * В случае успеха добавляет данные пользователя в req.user.
 */
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Доступ запрещен. Пожалуйста, войдите." });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Неверный токен. Пожалуйста, войдите заново." });
    }
};


// --- API: Маршруты для аутентификации ---

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password) {
        return res.status(400).json({ message: "Все поля обязательны." });
    }
    const db = await readDb();
    if (db.users.find(u => u.phone === phone)) {
        return res.status(409).json({ message: "Пользователь с таким телефоном уже существует." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, phone, password: hashedPassword };
    db.users.push(newUser);
    await writeDb(db);
    res.status(201).json({ message: "Регистрация прошла успешно!" });
});

// Вход пользователя
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    const db = await readDb();
    const user = db.users.find(u => u.phone === phone);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Неверный телефон или пароль." });
    }
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
    res.status(200).json({ message: "Вход выполнен успешно." });
});

// Выход пользователя
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Выход выполнен успешно." });
});

// Проверка статуса аутентификации
app.get('/api/check-auth', verifyToken, (req, res) => {
    res.status(200).json({ loggedIn: true, user: req.user });
});


// --- API: Маршруты для получения данных (GET) ---

app.get('/api/games', async (req, res) => { const db = await readDb(); res.json(db.games); });
app.get('/api/events', async (req, res) => { const db = await readDb(); res.json(db.events); });
app.get('/api/contacts', async (req, res) => { const db = await readDb(); res.json(db.contacts); });
app.get('/api/masters', async (req, res) => { const db = await readDb(); res.json(db.masters); });


// --- API: Маршруты для действий (POST) ---

// Запись на игру (маршрут защищен)
app.post('/api/events/:id/book', verifyToken, async (req, res) => {
    const { id } = req.params;
    const db = await readDb();
    const eventIndex = db.events.findIndex(e => e.id == id);
    if (eventIndex === -1) return res.status(404).json({ message: "Событие не найдено." });
    if (db.events[eventIndex].available_slots <= 0) return res.status(409).json({ message: "Мест нет." });
    db.events[eventIndex].available_slots -= 1;
    await writeDb(db);
    res.status(200).json({ message: "Вы успешно записаны!", event: db.events[eventIndex] });
});

// Бронирование стола/комнаты
app.post('/api/booking', async (req, res) => {
    const { bookingType, bookerName, bookingDate, bookingTime } = req.body;
    if (!bookingType || !bookerName || !bookingDate || !bookingTime) {
        return res.status(400).json({ message: "Пожалуйста, заполните все поля." });
    }
    const db = await readDb();
    const newBooking = { id: Date.now(), type: bookingType, name: `${bookingTime}`, booker_name: bookerName, date: bookingDate, time: bookingTime };
    db.bookings.unshift(newBooking);
    await writeDb(db);
    res.status(201).json({ message: "Ваше бронирование успешно создано!", booking: newBooking });
});


// --- Запуск сервера ---
app.listen(PORT, () => {
    console.log(`Сервер успешно запущен на порту http://localhost:${PORT}`);
});