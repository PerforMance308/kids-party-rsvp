# Kids Party RSVP - Makefile
# Database and development command management

.PHONY: help dev build start lint db-push db-pull db-studio db-generate db-migrate db-reset db-seed db-clear install clean

# Default target: show help
help:
	@echo ============================================
	@echo   Kids Party RSVP - Available Commands
	@echo ============================================
	@echo.
	@echo   Development:
	@echo     make dev       - Start development server
	@echo     make build     - Build production version
	@echo     make start     - Start production server
	@echo     make lint      - Run linter
	@echo     make install   - Install dependencies
	@echo     make clean     - Clean build cache
	@echo.
	@echo   Database:
	@echo     make db-push      - Push schema to database (Dev)
	@echo     make db-pull      - Pull schema from database
	@echo     make db-studio    - Open Prisma Studio
	@echo     make db-generate  - Generate Prisma Client
	@echo     make db-migrate   - Create and apply migrations
	@echo     make db-reset     - Reset database (Drop data and re-migrate)
	@echo     make db-seed      - Run seed script
	@echo     make db-clear     - Clear all tables (Keep schema)
	@echo     make db-init      - Initialize DB (Generate + Push + Seed)
	@echo     make db-rebuild   - Fully rebuild DB (Reset + Seed)
	@echo.

# ============================================
# Development Commands
# ============================================

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

install:
	npm install

clean:
	@if exist .next rmdir /s /q .next
	@if exist node_modules\.cache rmdir /s /q node_modules\.cache
	@echo Build cache cleaned.

# ============================================
# Database Commands
# ============================================

db-push:
	npx prisma db push

db-pull:
	npx prisma db pull

db-studio:
	npm run db:studio

db-generate:
	npx prisma generate

db-migrate:
	npx prisma migrate dev

db-migrate-deploy:
	npx prisma migrate deploy

db-reset:
	npx prisma migrate reset --force

db-seed:
	npm run db:seed

db-clear:
	@echo Clearing all tables...
	npx tsx prisma/clear.ts

db-rebuild: db-reset db-seed
	@echo Database rebuilt and seeded.

db-init: db-generate db-push db-seed
	@echo Database initialized.
