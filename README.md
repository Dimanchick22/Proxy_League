# Запуск проекта

## Требования
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (включает Docker и Docker Compose)

## Установка

1. **Установите Docker Desktop:**
   - Скачайте с официального сайта: https://www.docker.com/products/docker-desktop/
   - Установите и запустите Docker Desktop
   - Убедитесь, что Docker запущен (иконка в трее)

2. **Клонируйте репозиторий:**
```bash
git clone <url-репозитория>
cd <название-проекта>
```

3. **Запустите проект:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Готово! Проект запущен.

## Остановка проекта
```bash
docker compose down
```