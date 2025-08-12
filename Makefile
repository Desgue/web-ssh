.PHONY: help up down clean logs-backend logs-redis

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-10s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

up: ## Start services with rebuild
	@docker-compose up -d --build > /dev/null

down: ## Stop services
	@docker-compose down > /dev/null

clean: ## Full cleanup (stop services, remove volumes, orphans, and prune system)
	@docker-compose down -v --remove-orphans > /dev/null
	@docker system prune -f > /dev/null
	@docker volume prune -f > /dev/null

logs-backend: ## Show backend service logs
	docker-compose logs -f backend

logs-redis: ## Show redis service logs
	docker-compose logs -f redis