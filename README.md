# Proxy League - Zenless Zone Zero Tournament Platform

Турнирная платформа для игры Zenless Zone Zero с системой рейтингов, чатом в реальном времени и базой данных персонажей.

## Возможности

### 🎮 Турнирная система
- Создание турниров различных типов:
  - Single Elimination (одиночное выбывание)
  - Double Elimination (двойное выбывание)
  - Round Robin (круговая система)
- Поддержка до 16 участников
- Автоматическая генерация турнирных сеток
- Система рейтингов и статистики

### 👥 Система пользователей
- Регистрация и аутентификация через JWT
- Система ролей (User, Moderator, Admin)
- Профили игроков с персональной статистикой
- Отслеживание побед, поражений и рейтинга

### 💬 Чат в реальном времени
- WebSocket для мгновенного обмена сообщениями
- Отображение онлайн-пользователей
- Система комнат для общения
- Поддержка модерации

### 🏆 База героев
- Полная база персонажей из ZZZ
- Фильтрация по элементам и ролям
- Статистика использования (Pick Rate, Win Rate)
- Детальные характеристики

### 🏢 Игровые комнаты
- Создание публичных и приватных лобби
- Управление участниками
- Защита паролем для приватных комнат

## Технологический стек

### Backend
- **Go 1.21** - основной язык
- **Gin** - веб-фреймворк
- **GORM** - ORM для работы с БД
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Gorilla WebSocket** - WebSocket соединения

### Frontend
- **React 18** - UI библиотека
- **Vite** - сборщик
- **React Router** - роутинг
- **Zustand** - управление состоянием
- **Axios** - HTTP клиент

### DevOps
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация

## Быстрый старт

### Требования
- Docker 20.10+
- Docker Compose 2.0+
- Make (опционально, для удобных команд)

### Запуск проекта

#### Вариант 1: С использованием Make (рекомендуется)

```bash
# Клонируйте репозиторий
git clone https://github.com/Dimanchick22/ProxyLeague.git
cd ProxyLeague

# Настройте проект (создаст .env файлы из примеров)
make setup

# Настройте переменные в .env файле (опционально)
# nano .env

# Запустите проект
make dev
```

#### Вариант 2: Без Make

```bash
# Клонируйте репозиторий
git clone https://github.com/Dimanchick22/ProxyLeague.git
cd ProxyLeague

# Создайте .env файлы из примеров
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Настройте переменные в .env файле (опционально)
# nano .env

# Запустите все сервисы
docker-compose up --build
```

### Доступ к сервисам

По умолчанию сервисы доступны по адресам:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **API Health Check**: http://localhost:8080/health
- **PostgreSQL**: localhost:5432
  - Database: `proxyleague`
  - User: `postgres`
  - Password: `postgres`

**Примечание:** Все порты и настройки можно изменить в файле `.env`

## Конфигурация

### Основной файл конфигурации (.env)

Проект использует централизованную конфигурацию через `.env` файл в корневой директории. Все настройки в одном месте:

```env
# Порты
BACKEND_PORT=8080
FRONTEND_PORT=3000
POSTGRES_PORT=5432

# База данных
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=proxyleague

# JWT Secret (ОБЯЗАТЕЛЬНО измените для production!)
JWT_SECRET=your-super-secret-jwt-key

# API URLs для frontend
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/api/v1
```

Подробности всех доступных настроек смотрите в файле `.env.example`

### Важно для Production

⚠️ **Перед развертыванием в production:**

1. Измените `JWT_SECRET` на случайную строку
2. Измените пароли базы данных
3. Установите `GIN_MODE=release`
4. Настройте `CORS_ALLOW_ORIGINS` только для вашего домена
5. Используйте SSL для PostgreSQL (`DB_SSL_MODE=require`)

## Полезные команды (Make)

```bash
make help           # Показать все доступные команды
make setup          # Первоначальная настройка проекта
make dev            # Запустить в режиме разработки
make up             # Запустить все сервисы
make down           # Остановить все сервисы
make restart        # Перезапустить все сервисы
make logs           # Показать логи всех сервисов
make logs-backend   # Показать логи backend
make logs-frontend  # Показать логи frontend
make shell-backend  # Открыть shell в backend контейнере
make shell-db       # Открыть psql в базе данных
make clean          # Удалить все контейнеры и volumes
make db-reset       # Сбросить базу данных
```

## Структура проекта

```
ProxyLeague/
├── backend/
│   ├── cmd/api/          # Точка входа приложения
│   ├── internal/
│   │   ├── database/     # Подключение к БД и миграции
│   │   ├── handlers/     # HTTP обработчики
│   │   ├── middleware/   # Middleware (auth, cors, etc.)
│   │   ├── models/       # Модели данных
│   │   ├── tournament/   # Логика турниров
│   │   └── websocket/    # WebSocket hub и клиенты
│   ├── pkg/
│   │   ├── config/       # Конфигурация
│   │   └── utils/        # Утилиты
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы
│   │   ├── services/     # API сервисы
│   │   ├── stores/       # Zustand хранилища
│   │   ├── styles/       # CSS стили
│   │   └── types/        # TypeScript типы
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Регистрация пользователя
- `POST /api/v1/auth/login` - Вход в систему
- `GET /api/v1/profile` - Получить профиль (защищено)
- `PUT /api/v1/profile` - Обновить профиль (защищено)

### Tournaments
- `GET /api/v1/tournaments` - Список турниров
- `POST /api/v1/tournaments` - Создать турнир (защищено)
- `GET /api/v1/tournaments/:id` - Детали турнира
- `POST /api/v1/tournaments/:id/join` - Присоединиться к турниру (защищено)
- `POST /api/v1/tournaments/:id/start` - Начать турнир (защищено)
- `PUT /api/v1/tournaments/:id/matches/:matchId` - Обновить результат матча (защищено)

### Rooms
- `GET /api/v1/rooms` - Список комнат
- `POST /api/v1/rooms` - Создать комнату (защищено)
- `GET /api/v1/rooms/:id` - Детали комнаты
- `POST /api/v1/rooms/join` - Присоединиться к комнате (защищено)
- `POST /api/v1/rooms/:id/leave` - Покинуть комнату (защищено)
- `DELETE /api/v1/rooms/:id` - Удалить комнату (защищено)

### Heroes
- `GET /api/v1/heroes` - Список героев
- `GET /api/v1/heroes/:id` - Детали героя
- `GET /api/v1/heroes/:id/stats` - Статистика героя
- `GET /api/v1/heroes/top` - Топ героев

### WebSocket
- `GET /api/v1/ws` - WebSocket подключение (защищено)
- `GET /api/v1/online` - Список онлайн пользователей (защищено)

## Разработка

### Backend (Go)

Запуск без Docker:
```bash
cd backend
go mod download
go run cmd/api/main.go
```

### Frontend (React)

Запуск без Docker:
```bash
cd frontend
npm install
npm run dev
```

## База данных

При первом запуске автоматически:
- Создаются все необходимые таблицы
- Заполняется база героев из Zenless Zone Zero

### Герои в базе

**S-ранг (5★):**
- Ellen Joe (Ice, Attacker)
- Zhu Yuan (Ether, Attacker)
- Jane Doe (Physical, Attacker)
- Qingyi (Electric, Stun)
- Koleda (Fire, Stun)
- Lycaon (Ice, Stun)
- Grace Howard (Electric, Attacker)
- Rina (Electric, Support)

**A-ранг (4★):**
- Anby Demara (Electric, Stun)
- Nicole Demara (Ether, Support)
- Billy Kid (Physical, Attacker)
- Corin Wickes (Physical, Attacker)
- Nekomata (Physical, Attacker)
- Piper (Physical, Attacker)
- Anton Ivanov (Electric, Attacker)
- Ben Bigger (Fire, Defense)
- Lucy (Fire, Support)
- Soukaku (Ice, Support)

## Особенности реализации

### Турнирная система
- Автоматическая генерация сеток турниров
- Поддержка BYE для нечетного количества участников
- Расчет количества раундов на основе типа турнира

### WebSocket чат
- Автоматическое переподключение при обрыве связи
- Обработка присоединения/выхода пользователей
- Поддержка комнат для группового чата

### Безопасность
- JWT токены с истечением срока действия (24 часа)
- Хеширование паролей через bcrypt
- Middleware для защиты приватных endpoints
- CORS настройки для безопасного взаимодействия frontend/backend

## Лицензия

MIT

## Авторы

Разработано для сообщества Zenless Zone Zero
