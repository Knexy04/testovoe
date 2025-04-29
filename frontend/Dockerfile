FROM node:18-alpine as build

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=512"

COPY package*.json ./

RUN npm install --production=false --no-audit --prefer-offline

COPY . .

RUN npm run build

FROM nginx:alpine

EXPOSE 65437

CMD ["npm", "run", "start"]