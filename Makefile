.PHONY: backend frontend dev version

backend:
	cd apps/backend && poetry run flask --app app.main run --port 3000

frontend:
	npm --prefix apps/frontend run dev

version:
	@backend_version=$$(cd apps/backend && poetry version -s); \
	frontend_version=$$(node -p "JSON.parse(require('node:fs').readFileSync('apps/frontend/package.json', 'utf8')).version"); \
	printf 'Current versions: backend=%s, frontend=%s\n' "$$backend_version" "$$frontend_version"; \
	printf 'New shared version: '; IFS= read -r new_version; \
	test -n "$$new_version" || { printf 'Version is required.\n' >&2; exit 1; }; \
	if git show-ref --verify --quiet "refs/tags/v$$new_version"; then \
		printf 'Tag %s already exists.\n' "$$new_version" >&2; exit 1; \
	else \
		status=$$?; test "$$status" -eq 1 || { printf 'Unable to check existing Git tags.\n' >&2; exit 1; }; \
	fi; \
	(cd apps/backend && poetry version "$$new_version") && \
	npm --prefix apps/frontend version "$$new_version" --no-git-tag-version && \
	git add apps/backend/pyproject.toml apps/frontend/package.json apps/frontend/package-lock.json && \
	git commit -m "chore: bump version to v$$new_version" -- apps/backend/pyproject.toml apps/frontend/package.json apps/frontend/package-lock.json && \
	git tag "$$new_version"

dev:
	@set +e; \
	workdir="$${TMPDIR:-/tmp}/webforms-links-generator-dev-$$$$"; \
	backend_pid= frontend_pid= backend_log_pid= frontend_log_pid=; \
	cleanup() { \
		trap - EXIT HUP INT TERM; \
		for pid in "$$backend_pid" "$$frontend_pid"; do \
			[ -z "$$pid" ] || kill -TERM -- "-$$pid" 2>/dev/null || true; \
		done; \
		for pid in "$$backend_pid" "$$frontend_pid" "$$backend_log_pid" "$$frontend_log_pid"; do \
			[ -z "$$pid" ] || wait "$$pid" 2>/dev/null || true; \
		done; \
		rm -rf "$$workdir"; \
	}; \
	on_signal() { cleanup; exit 130; }; \
	mkdir "$$workdir" && mkfifo "$$workdir/backend" "$$workdir/frontend" || exit $$?; \
	trap cleanup EXIT; \
	trap on_signal HUP INT TERM; \
	setsid $(MAKE) --no-print-directory backend >"$$workdir/backend" 2>&1 & backend_pid=$$!; \
	setsid $(MAKE) --no-print-directory frontend >"$$workdir/frontend" 2>&1 & frontend_pid=$$!; \
	sed 's/^/[backend] /' <"$$workdir/backend" & backend_log_pid=$$!; \
	sed 's/^/[frontend] /' <"$$workdir/frontend" & frontend_log_pid=$$!; \
	wait $$backend_pid; backend_status=$$?; \
	wait $$frontend_pid; frontend_status=$$?; \
	wait $$backend_log_pid; \
	wait $$frontend_log_pid; \
	test $$backend_status -eq 0 -a $$frontend_status -eq 0
