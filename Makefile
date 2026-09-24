.PHONY: backend frontend dev

backend:
	cd apps/backend && poetry run flask --app app.main run --port 3000

frontend:
	npm --prefix apps/frontend run dev

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
