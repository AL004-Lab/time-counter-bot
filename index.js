require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Обслуживание статики

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

// 📌 Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 API: Получение данных пользователя
app.get("/api/user/:userId", (req, res) => {
  const userId = req.params.userId;

  if (!usersData[userId]) {
    usersData[userId] = {
      endTime: Date.now() + 365 * 24 * 60 * 60 * 1000, // По умолчанию 1 год
      points: 0
    };
    saveData();
  }

  res.json({
    endTime: usersData[userId].endTime,
    points: usersData[userId].points
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

// 📌 API: Установка таймера (рассчитывается на основе возраста)
app.post("/api/user/:userId/setup", (req, res) => {
  const userId = req.params.userId;
  const { endTime } = req.body;

  if (!usersData[userId]) {
    usersData[userId] = { points: 0 };
  }

  usersData[userId].endTime = endTime;
  saveData();
  res.json({ success: true });
});

// 📌 API: Сброс всех пользователей (обнуление данных)
app.post("/api/users/reset", (req, res) => {
  usersData = {};
  saveData();
  res.json({ success: true, message: "Все данные пользователей сброшены" });
});

// 📌 Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});