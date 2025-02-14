const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let usersData = {};
const DATA_FILE = "usersData.json";

// Загружаем данные из файла при старте сервера
if (fs.existsSync(DATA_FILE)) {
    usersData = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
}

// Функция для сохранения данных
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData));
}

// 📌 API: Получение данных пользователя
app.get("/api/user/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!usersData[userId]) {
        usersData[userId] = {
            endTime: Date.now() + 365 * 24 * 60 * 60 * 1000,
            points: 0,
            hacks: []
        };
        saveData();
    }

    res.json({
        endTime: usersData[userId].endTime,
        points: usersData[userId].points,
        hacks: usersData[userId].hacks.slice(-3) // Отправляем последние 3 хака
    });
});

// 📌 API: Добавление очков пользователю
app.post("/api/user/:userId/add-points", (req, res) => {
    const userId = req.params.userId;
    if (!usersData[userId]) return res.status(404).json({ error: "User not found" });

    usersData[userId].points += 1;
    saveData();

    res.json({ points: usersData[userId].points });
});

// 📌 API: Создание нового "Хака"
app.post("/api/user/:userId/add-hack", (req, res) => {
    const { userId } = req.params;
    const { text, duration } = req.body;

    if (!usersData[userId]) return res.status(404).json({ error: "User not found" });

    const deadline = Date.now() + parseInt(duration);
    usersData[userId].hacks.push({ text, deadline });
    saveData();

    res.json({ success: true, hacks: usersData[userId].hacks.slice(-3) });
});

// 📌 API: Чат с ассистентом (OpenAI)
app.post("/api/chat", async (req, res) => {
    const { userId, message } = req.body;

    if (!usersData[userId]) return res.status(404).json({ error: "User not found" });

    const prompt = `
        Пользователь говорит: "${message}". 
        У него таймер жизни и он ставит себе цели ("Хаки"). 
        Он хочет мотивацию и советы. Дай полезный ответ.
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                prompt: prompt,
                max_tokens: 50
            })
        });

        const data = await response.json();
        res.json({ message: data.choices[0].text.trim() });
    } catch (error) {
        console.error("Ошибка OpenAI:", error);
        res.status(500).json({ error: "Ошибка ассистента" });
    }
});

// 📌 Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});