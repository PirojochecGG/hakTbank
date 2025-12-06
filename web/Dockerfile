# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости с чистым кэшем
RUN npm ci --verbose

# Копируем исходный код
COPY . .

# Build arguments
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Собираем приложение
RUN npm run build

# Production stage
FROM nginx:alpine

# Метаинформация
LABEL maintainer="HakTbank Team"
LABEL description="Frontend web application"

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"]
