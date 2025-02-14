require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const fs = require("fs");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Храним пользователей в файле (на старте загружаем данные)
let usersData = {};
const DATA_FILE = "users.json";

// Загружаем сохранённые данные
if (fs.existsSync(DATA_FILE)) {
    usersData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Функция сохранения данных
const saveData = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(usersData, null, 2));
};

// **Обработчик команды /start**
bot.start((ctx) => {
    const userId = ctx.from.id;
    
    if (!usersData[userId]) {
        usersData[userId] = {
            username: ctx.from.username || `User${userId}`,
            daysLeft: 365,
            points: 0,
            lastCheckIn: null,
        };
        saveData();
    }

    ctx.reply(
        `Привет, ${ctx.from.first_name}! 🚀\n\nДобро пожаловать в "Счётчик времени".\n\nТы можешь:\n✔️ Запустить обратный отсчёт\n✔️ Ежедневно подтверждать активность\n✔️ Зарабатывать баллы за выполнение заданий\n\n🔽 Нажми кнопку, чтобы открыть WebApp!`,
        {
            reply_markup: {
                inline_keyboard: [[
                    { text: "🚀 Открыть WebApp", web_app: { url: process.env.WEBAPP_URL } }
                ]]
            }
        }
    );
});

// **Чек-ин (подтверждение дня)**
bot.command("checkin", (ctx) => {
    const userId = ctx.from.id;
    const today = new Date().toISOString().split("T")[0];

    if (!usersData[userId]) {
        return ctx.reply("Ты ещё не запустил свой таймер! Используй /start.");
    }

    if (usersData[userId].lastCheckIn === today) {
        return ctx.reply("Ты уже подтвердил день сегодня! Возвращайся завтра. ⏳");
    }

    usersData[userId].lastCheckIn = today;
    usersData[userId].points += 5;
    usersData[userId].daysLeft = Math.max(usersData[userId].daysLeft - 1, 0);
    saveData();

    ctx.reply(`✅ День подтверждён! Ты получил +5 баллов. 🎉\n📉 Осталось ${usersData[userId].daysLeft} дней.`);
});

// **Проверка состояния таймера**
bot.command("status", (ctx) => {
    const userId = ctx.from.id;

    if (!usersData[userId]) {
        return ctx.reply("Ты ещё не запустил свой таймер! Используй /start.");
    }

    ctx.reply(
        `⏳ *Твой таймер*\n🕰 Осталось: ${usersData[userId].daysLeft} дней\n⭐ Баллы: ${usersData[userId].points}`,
        { parse_mode: "Markdown" }
    );
});

// **Напоминания (бот проверяет, кто не заходил более 24 часов)**
setInterval(() => {
    const today = new Date().toISOString().split("T")[0];

    for (const userId in usersData) {
        if (usersData[userId].lastCheckIn !== today) {
            bot.telegram.sendMessage(userId, "⏰ Ты забыл подтвердить день! Не пропусти свою награду. Введи /checkin.");
        }
    }
}, 1000 * 60 * 60 * 24); // Проверка раз в сутки

// **Запускаем Express-сервер для WebApp**
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.send("WebApp работает! 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));

// **Запускаем бота**
bot.launch();
console.log("Бот успешно запущен! ✅");