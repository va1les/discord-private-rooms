# Установка

> **1.** Переменуйте файл `example.env` => `.env`.<br>
> `DISCORD_TOKEN` — Токен бота.<br>
> `MONGO` — Ссылка на подключение к базе данных MongoDB.

> **2.** Установите все модули — `npm i`

> **3.** Запустите бота — `node .`.
***
# Система
> `commands/private-voices/private-voices.js`, `events/SlashCommand.js`, `events/voiceStateUpdate.js`.

`commands/private-voices/private-voices.js`
> создает категорию с текстовым и голосовым каналом.

`events/SlashCommand.js`
> отслеживание нажатия кнопок.

`events/voiceStateUpdate.js`
> отслеживание входы и выхода из голосового канала.