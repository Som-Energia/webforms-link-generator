.DEFAULT_GOAL := help

.PHONY: help backend frontend dev version publish

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make backend   Start the backend server on port 3000.' \
		'  make frontend  Start the frontend development server.' \
		'  make dev       Start backend and frontend together.' \
		'  make version   Set a shared backend and frontend version.' \
		'  make publish   Build and publish the Harbor image.'

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
