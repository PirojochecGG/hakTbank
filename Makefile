.PHONY: help up down restart logs build clean status shell-api shell-web test env

help:
	@echo "HakTbank - Docker Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make restart         - Restart all services"
	@echo "  make logs            - Show logs from all services"
	@echo "  make build           - Build all images"
	@echo "  make clean           - Clean up containers and volumes"
	@echo "  make status          - Show status of services"
	@echo "  make shell-api       - Open shell in API container"
	@echo "  make shell-web       - Open shell in Web container"
	@echo "  make test            - Run tests"
	@echo "  make env             - Create .env from .env.example"
	@echo "  make db-backup       - Backup database"
	@echo "  make db-restore      - Restore database from backup"
	@echo "  make migrate         - Run migrations"
	@echo ""

env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env from .env.example"; \
	else \
		echo "✓ .env already exists"; \
	fi

up: env
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started"
	@echo ""
	@echo "Services available at:"
	@echo "  Frontend: http://localhost:80"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Database: localhost:5432"
	@echo "  Redis:    localhost:6379"

down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

restart: down up
	@echo "✓ Services restarted"

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

logs-db:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

build:
	@echo "Building images..."
	docker-compose build
	@echo "✓ Build complete"

build-no-cache:
	@echo "Building images (no cache)..."
	docker-compose build --no-cache
	@echo "✓ Build complete"

clean:
	@echo "⚠️  This will remove all containers, volumes, and images"
	@read -p "Continue? [y/N] " yn; \
	if [ "$$yn" = "y" ] || [ "$$yn" = "Y" ]; then \
		docker-compose down -v; \
		echo "✓ Cleanup complete"; \
	else \
		echo "Cancelled"; \
	fi

status:
	@echo "Service Status:"
	docker-compose ps

shell-api:
	docker-compose exec api /bin/bash

shell-web:
	docker-compose exec web /bin/sh

shell-db:
	docker-compose exec postgres psql -U postgres -d hakTbank

shell-redis:
	docker-compose exec redis redis-cli

test:
	@echo "Running tests..."
	docker-compose exec api uv run pytest tests/

test-watch:
	@echo "Running tests in watch mode..."
	docker-compose exec api uv run pytest tests/ -v --tb=short

migrate:
	@echo "Running migrations..."
	docker-compose exec api uv run alembic upgrade head
	@echo "✓ Migrations complete"

migrate-down:
	@echo "Rolling back last migration..."
	docker-compose exec api uv run alembic downgrade -1
	@echo "✓ Rollback complete"

migrate-status:
	@echo "Migration status:"
	docker-compose exec api uv run alembic current

db-backup:
	@echo "Creating database backup..."
	@mkdir -p backups
	@docker-compose exec postgres pg_dump -U postgres hakTbank > backups/hakTbank_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup created"

db-restore:
	@echo "Restoring database from latest backup..."
	@latest=$$(ls -t backups/*.sql 2>/dev/null | head -1); \
	if [ -z "$$latest" ]; then \
		echo "✗ No backup found"; \
	else \
		docker-compose exec -T postgres psql -U postgres hakTbank < "$$latest"; \
		echo "✓ Restore complete from $$latest"; \
	fi

health-check:
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@docker inspect hakTbank-postgres | grep -A 5 '"Health"' || echo "No health check for postgres"
	@docker inspect hakTbank-redis | grep -A 5 '"Health"' || echo "No health check for redis"
	@docker inspect hakTbank-api | grep -A 5 '"Health"' || echo "No health check for api"

stats:
	@echo "Resource usage:"
	docker stats --no-stream

prune:
	@echo "Cleaning up unused Docker resources..."
	docker system prune -a --volumes -f
	@echo "✓ Cleanup complete"

dev: up logs

prod-up: env
	@echo "Starting production services..."
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✓ Production services started"

prod-down:
	@echo "Stopping production services..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✓ Production services stopped"

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

info:
	@echo "HakTbank Project Info"
	@echo ""
	@echo "Project Structure:"
	@echo "  - Web Frontend:  $(shell [ -d web ] && echo '✓' || echo '✗') web/"
	@echo "  - Backend API:   $(shell [ -d server ] && echo '✓' || echo '✗') server/"
	@echo "  - Mobile App:    $(shell [ -d MobileRA ] && echo '✓' || echo '✗') MobileRA/"
	@echo ""
	@echo "Configuration:"
	@echo "  - Docker Compose: $(shell [ -f docker-compose.yml ] && echo '✓' || echo '✗') docker-compose.yml"
	@echo "  - Prod Compose:   $(shell [ -f docker-compose.prod.yml ] && echo '✓' || echo '✗') docker-compose.prod.yml"
	@echo "  - Environment:    $(shell [ -f .env ] && echo '✓' || echo '✗') .env"
	@echo ""
	@docker --version
	@docker-compose --version
