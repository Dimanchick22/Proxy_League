.PHONY: help setup build up down restart logs clean dev test

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Показать справку
	@echo "$(BLUE)Proxy League - Команды управления$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Первоначальная настройка проекта
	@echo "$(BLUE)Настройка проекта...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ Создан файл .env из .env.example$(NC)"; \
	else \
		echo "$(YELLOW)! Файл .env уже существует$(NC)"; \
	fi
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✓ Создан файл backend/.env$(NC)"; \
	else \
		echo "$(YELLOW)! Файл backend/.env уже существует$(NC)"; \
	fi
	@if [ ! -f frontend/.env ]; then \
		cp frontend/.env.example frontend/.env; \
		echo "$(GREEN)✓ Создан файл frontend/.env$(NC)"; \
	else \
		echo "$(YELLOW)! Файл frontend/.env уже существует$(NC)"; \
	fi
	@echo "$(GREEN)✓ Проект настроен!$(NC)"
	@echo "$(YELLOW)⚠ Не забудьте изменить JWT_SECRET в .env файле для production!$(NC)"

build: ## Собрать Docker образы
	@echo "$(BLUE)Сборка Docker образов...$(NC)"
	docker-compose build

up: ## Запустить все сервисы
	@echo "$(BLUE)Запуск сервисов...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Сервисы запущены!$(NC)"
	@echo "Frontend: http://localhost:$${FRONTEND_PORT:-3000}"
	@echo "Backend:  http://localhost:$${BACKEND_PORT:-8080}"

down: ## Остановить все сервисы
	@echo "$(BLUE)Остановка сервисов...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Сервисы остановлены$(NC)"

restart: down up ## Перезапустить все сервисы

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

logs-db: ## Показать логи базы данных
	docker-compose logs -f postgres

clean: ## Удалить все контейнеры и volumes
	@echo "$(YELLOW)⚠ Это удалит все данные! Продолжить? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	docker-compose down -v
	docker system prune -f
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

dev: setup ## Запустить в режиме разработки (с пересборкой)
	@echo "$(BLUE)Запуск в режиме разработки...$(NC)"
	docker-compose up --build

dev-backend: ## Запустить только backend для разработки
	cd backend && go run cmd/api/main.go

dev-frontend: ## Запустить только frontend для разработки
	cd frontend && npm run dev

test-backend: ## Запустить тесты backend
	cd backend && go test ./...

ps: ## Показать статус контейнеров
	docker-compose ps

shell-backend: ## Открыть shell в backend контейнере
	docker-compose exec backend sh

shell-frontend: ## Открыть shell в frontend контейнере
	docker-compose exec frontend sh

shell-db: ## Открыть psql в базе данных
	docker-compose exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-proxyleague}

migrate: ## Выполнить миграции базы данных
	@echo "$(BLUE)Миграции выполняются автоматически при запуске backend$(NC)"

db-reset: ## Сбросить базу данных (УДАЛИТ ВСЕ ДАННЫЕ!)
	@echo "$(YELLOW)⚠ Это удалит все данные из БД! Продолжить? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	docker-compose down postgres
	docker volume rm proxyleague_postgres_data || true
	docker-compose up -d postgres
	@echo "$(GREEN)✓ База данных сброшена$(NC)"

install-backend: ## Установить зависимости backend
	cd backend && go mod download

install-frontend: ## Установить зависимости frontend
	cd frontend && npm install

prod: ## Запустить в production режиме
	@echo "$(BLUE)Запуск в production режиме...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)⚠ Файл .env не найден. Запустите 'make setup' сначала$(NC)"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.yml up -d --build
	@echo "$(GREEN)✓ Production запущен!$(NC)"
