FROM node:18-alpine as build

WORKDIR /app

# Устанавливаем максимальное количество памяти для Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости с помощью npm install вместо npm ci
# Используем --production для установки только необходимых пакетов
RUN npm install --production=false --no-audit --prefer-offline

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Второй этап сборки - для production
FROM nginx:alpine

# Копируем сконфигурированный nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение из предыдущего этапа
COPY --from=build /app/build /usr/share/nginx/html

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]