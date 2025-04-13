# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Этап раздачи
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/memeup /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]