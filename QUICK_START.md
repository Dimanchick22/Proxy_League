# Proxy League - Быстрый старт 🚀

## Проблема: WebSocket не подключается

Ошибка `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED` означает, что **бэкенд сервер не запущен**.

## Решение

### Вариант 1: Запуск с помощью простого скрипта (PostgreSQL уже установлен)

1. **Запустите PostgreSQL сервер**:
   ```bash
   sudo systemctl start postgresql
   # ИЛИ (если PostgreSQL запускается от пользователя postgres):
   sudo -u postgres pg_ctl start -D /var/lib/postgresql/16/main
   ```

2. **Создайте базу данных** (если еще не создана):
   ```bash
   sudo -u postgres createdb proxyleague
   ```

3. **Запустите бэкенд**:
   ```bash
   cd /home/user/ProxyLeague
   ./start-local.sh
   ```

   Скрипт автоматически:
   - Проверит зависимости
   - Создаст .env файл
   - Создаст базу данных (если нужно)
   - Запустит бэкенд сервер

4. **В другом терминале запустите фронтенд**:
   ```bash
   cd /home/user/ProxyLeague/frontend
   npm run dev
   ```

5. **Откройте браузер**: http://localhost:5173

---

### Вариант 2: Запуск через Docker (рекомендуется)

Если Docker установлен:

```bash
cd /home/user/ProxyLeague
make setup    # Создаст .env файлы
make up       # Запустит все сервисы
```

Или вручную:
```bash
docker-compose up -d
```

Проверка статуса:
```bash
docker-compose ps
docker-compose logs -f backend
```

---

### Вариант 3: Ручной запуск (для разработки)

#### 1. PostgreSQL

Если PostgreSQL не установлен, запустите в Docker:
```bash
docker run -d \
  --name proxyleague-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=proxyleague \
  -p 5432:5432 \
  postgres:16
```

Или используйте системный PostgreSQL:
```bash
sudo systemctl start postgresql
sudo -u postgres createdb proxyleague
```

#### 2. Backend

```bash
cd backend
export POSTGRES_HOST=localhost
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB=proxyleague
export JWT_SECRET=your-super-secret-jwt-key
export SERVER_PORT=8080

go run cmd/api/main.go
```

#### 3. Frontend

В отдельном терминале:
```bash
cd frontend
npm install  # Только при первом запуске
npm run dev
```

---

## Проверка работы

1. **Проверьте бэкенд**:
   ```bash
   curl http://localhost:8080/health
   # Должно вернуть: {"status":"ok"}
   ```

2. **Проверьте WebSocket** (откройте DevTools в браузере):
   - Должно появиться сообщение: `WebSocket connected`
   - Больше не должно быть ошибок `NS_ERROR_WEBSOCKET_CONNECTION_REFUSED`

3. **Откройте фронтенд**: http://localhost:5173
   - Зарегистрируйтесь или войдите
   - Попробуйте отправить сообщение в чате

---

## Что дальше?

- **Создайте турнир**: Tournaments → Create Tournament
- **Создайте комнату**: Rooms → Create Room
- **Попробуйте чат**: Войдите в турнир или комнату и отправьте сообщение
- **Переключите язык**: Кнопка 🇷🇺 RU / 🇬🇧 EN в правом верхнем углу

---

## Troubleshooting

### PostgreSQL не запускается
```bash
# Проверьте статус
sudo systemctl status postgresql

# Посмотрите логи
sudo journalctl -u postgresql -n 50
```

### Backend не компилируется
```bash
cd backend
go mod tidy
go mod download
go build -o bin/server cmd/api/main.go
```

### Frontend не запускается
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### WebSocket все еще не работает
1. Убедитесь, что бэкенд запущен: `curl http://localhost:8080/health`
2. Проверьте порт в `.env`: `BACKEND_PORT=8080`
3. Проверьте консоль браузера на ошибки
4. Очистите кэш браузера и перезагрузите страницу

---

## Полезные команды

```bash
# Посмотреть все доступные команды
make help

# Логи всех сервисов (Docker)
make logs

# Перезапустить все (Docker)
make restart

# Очистить все и начать заново (Docker)
make clean
make setup
make up
```
