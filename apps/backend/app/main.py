import os
import secrets
from pathlib import Path
from urllib.parse import quote, unquote_plus, urlsplit, urlunsplit

import requests
from flask import Flask, jsonify, redirect, request, send_from_directory
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from dotenv import load_dotenv


COOKIE_NAME = "admin_session"
SESSION_MAX_AGE = 60 * 60 * 8
SOCIAL_TARIFF_URL = "https://www.somenergia.coop/ca/formulari-contractacio-periodes"


def _custom_form_url(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError

    value = value.strip()
    if not value:
        return None
    if any(character.isspace() for character in value):
        raise ValueError

    try:
        parsed = urlsplit(value)
        parsed.port  # Accessing this validates a malformed port.
    except ValueError as error:
        raise ValueError from error

    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError

    return value


def _link_with_token(form_url: str, token: str) -> str:
    parsed = urlsplit(form_url)
    encoded_token = quote(token, safe="")
    query_parts = parsed.query.split("&") if parsed.query else []
    updated_query = []
    token_added = False

    for part in query_parts:
        parameter_name = unquote_plus(part.partition("=")[0])
        if parameter_name != "token":
            updated_query.append(part)
        elif not token_added:
            updated_query.append(f"token={encoded_token}")
            token_added = True

    if not token_added:
        updated_query.append(f"token={encoded_token}")

    return urlunsplit(parsed._replace(query="&".join(updated_query)))


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing {name}.")
    return value


def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _load_local_dotenv() -> None:
    if os.environ.get("FLASK_RUN_FROM_CLI") != "true":
        return

    dotenv_path = Path(__file__).resolve().parents[3] / ".env"
    load_dotenv(dotenv_path=dotenv_path, override=False)


def create_app() -> Flask:
    repository_root = Path(__file__).resolve().parents[3]
    load_dotenv(repository_root / ".env", override=False)
    _load_local_dotenv()
    dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    app = Flask(__name__, static_folder=dist_dir / "assets", static_url_path="/assets")

    admin_password = _required_env("ADMIN_PASSWORD")
    session_secret = _required_env("SESSION_SECRET")
    if len(session_secret) < 32:
        raise RuntimeError("SESSION_SECRET must be at least 32 characters.")

    admin_gateway_secret = _required_env("ADMIN_GATEWAY_SECRET")
    jwt_api_url = _required_env("JWT_API_URL")
    cookie_secure = _env_bool("COOKIE_SECURE", True)
    serializer = URLSafeTimedSerializer(session_secret, salt=COOKIE_NAME)

    def is_authenticated() -> bool:
        cookie = request.cookies.get(COOKIE_NAME)
        if not cookie:
            return False

        try:
            serializer.loads(cookie, max_age=SESSION_MAX_AGE)
        except (BadSignature, SignatureExpired):
            return False

        return True

    def serve_react() -> object:
        index_path = dist_dir / "index.html"
        if not index_path.exists():
            return jsonify({"message": "Frontend build not found."}), 503
        return send_from_directory(dist_dir, "index.html")

    @app.get("/health")
    def health() -> object:
        return jsonify({"status": "ok"})

    @app.post("/auth/login")
    def login() -> object:
        password = request.form.get("password")
        if password != admin_password:
            return redirect("/?error=1", code=303)

        response = redirect("/admin", code=303)
        response.set_cookie(
            COOKIE_NAME,
            serializer.dumps(secrets.token_urlsafe(32)),
            max_age=SESSION_MAX_AGE,
            httponly=True,
            secure=cookie_secure,
            samesite="Lax",
            path="/",
        )
        return response

    @app.post("/auth/logout")
    def logout() -> object:
        response = redirect("/", code=303)
        response.delete_cookie(
            COOKIE_NAME,
            httponly=True,
            secure=cookie_secure,
            samesite="Lax",
            path="/",
        )
        return response

    @app.post("/api/links/social-tariff")
    def social_tariff_link() -> object:
        if not is_authenticated():
            return jsonify({"message": "Unauthorized"}), 401

        payload = request.get_json(silent=True) or {}
        try:
            form_url = _custom_form_url(payload.get("formUrl"))
        except (AttributeError, ValueError):
            return jsonify({"message": "L'URL del formulari ha de ser una URL HTTP o HTTPS vàlida."}), 400

        try:
            response = requests.post(
                jwt_api_url,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "X-Admin-Gateway-Token": admin_gateway_secret,
                },
                json={"ff": ["socialTariffByPass"]},
                timeout=10,
            )
        except requests.RequestException:
            app.logger.exception("Could not reach JWT API")
            return jsonify({"message": "No se pudo generar el enlace."}), 502

        if not response.ok:
            app.logger.warning("JWT API returned status %s", response.status_code)
            return jsonify({"message": "La API externa no pudo generar el token."}), 502

        try:
            token = response.json()["data"]["token"]
        except (ValueError, KeyError, TypeError):
            return jsonify({"message": "La API externa no devolvió un JWT válido."}), 502

        if not isinstance(token, str) or not token:
            return jsonify({"message": "La API externa no devolvió un JWT válido."}), 502

        if form_url:
            return jsonify({"link": _link_with_token(form_url, token)})

        return jsonify({"link": f"{SOCIAL_TARIFF_URL}?form_type=domestic&token={token}"})

    @app.get("/")
    def root() -> object:
        return serve_react()

    @app.get("/admin")
    def admin() -> object:
        if not is_authenticated():
            return redirect("/", code=302)
        return serve_react()

    @app.get("/<path:path>")
    def spa_fallback(path: str) -> object:
        if path.startswith("api/") or path.startswith("auth/"):
            return jsonify({"message": "Not found"}), 404
        return serve_react()

    return app


app = create_app()
