# Використовуємо офіційний образ Node.js
FROM node:18

# Встановлюємо робочу директорію в контейнері
WORKDIR /app

# Копіюємо файли package.json і package-lock.json для встановлення залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо решту файлів у робочу директорію
COPY . .

# Вказуємо команду для запуску програми
CMD ["npm", "run", "dev"]

# Відкриваємо порт для доступу до сервісу
EXPOSE 3000
