.DEFAULT_GOAL := help

.PHONY: help backend frontend dev version publish test test-backend test-frontend

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make backend        Start the backend server on port 3000.' \
		'  make frontend       Start the frontend development server.' \
		'  make dev            Start backend and frontend together.' \
		'  make test           Run backend and frontend tests.' \
		'  make test-backend    Run backend tests.' \
		'  make test-frontend   Run frontend tests.' \
		'  make version        Set a shared backend and frontend version.' \
		'  make publish        Build and publish the Harbor image.'

backend:
	./scripts/run-backend.sh

frontend:
	./scripts/run-frontend.sh

version:
	./scripts/bump-version.sh

dev:
	./scripts/run-dev.sh

publish:
	./scripts/publish-images.sh

test: test-backend test-frontend

test-backend:
	cd apps/backend && .venv/bin/python -m pytest

test-frontend:
	cd apps/frontend && npm test
