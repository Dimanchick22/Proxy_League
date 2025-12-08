#!/bin/bash

# Proxy League - Скрипт локального запуска без Docker
# Используется когда Docker недоступен

set -e

echo "==================================="
echo "Proxy League - Локальный запуск"
echo "==================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка зависимостей
echo -e "${BLUE}Проверка зависимостей...${NC}"

# Проверка Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go не установлен${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Go $(go version | awk '{print $3}')${NC}"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL клиент не установлен${NC}"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL клиент установлен${NC}"

# Проверка подключения к PostgreSQL
echo -e "${BLUE}Проверка подключения к PostgreSQL...${NC}"
if pg_isready -h localhost -p 5432 &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL доступен${NC}"
else
    echo -e "${RED}❌ PostgreSQL не запущен на localhost:5432${NC}"
    echo -e "${YELLOW}Запустите PostgreSQL командой:${NC}"
    echo -e "  sudo systemctl start postgresql"
    echo -e "${YELLOW}или запустите в Docker:${NC}"
    echo -e "  docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16"
    exit 1
fi

# Загрузка .env
if [ -f .env ]; then
    echo -e "${GREEN}✓ Загрузка переменных из .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠ Файл .env не найден, создание из .env.example${NC}"
    cp .env.example .env
    export $(cat .env | grep -v '^#' | xargs)
fi

# Настройка переменных для локального запуска
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_USER=${POSTGRES_USER:-postgres}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
export POSTGRES_DB=${POSTGRES_DB:-proxyleague}

# Создание базы данных если не существует
echo -e "${BLUE}Проверка базы данных...${NC}"
if psql -h localhost -U $POSTGRES_USER -lqt | cut -d \| -f 1 | grep -qw $POSTGRES_DB; then
    echo -e "${GREEN}✓ База данных '$POSTGRES_DB' существует${NC}"
else
    echo -e "${YELLOW}Создание базы данных '$POSTGRES_DB'...${NC}"
    createdb -h localhost -U $POSTGRES_USER $POSTGRES_DB || {
        echo -e "${RED}Не удалось создать базу данных${NC}"
        echo -e "${YELLOW}Попробуйте создать вручную:${NC}"
        echo -e "  createdb -h localhost -U postgres proxyleague"
        exit 1
    }
    echo -e "${GREEN}✓ База данных создана${NC}"
fi

# Установка зависимостей backend
echo -e "${BLUE}Установка зависимостей backend...${NC}"
cd backend
go mod download
echo -e "${GREEN}✓ Зависимости установлены${NC}"

# Запуск backend
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Запуск backend сервера...${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}API:       http://localhost:${BACKEND_PORT:-8080}/api/v1${NC}"
echo -e "${BLUE}WebSocket: ws://localhost:${BACKEND_PORT:-8080}/api/v1/ws${NC}"
echo -e "${BLUE}Health:    http://localhost:${BACKEND_PORT:-8080}/health${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Запуск
go run cmd/api/main.go
