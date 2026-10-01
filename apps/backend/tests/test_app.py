import importlib
import sys
from pathlib import Path

import pytest


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


REQUIRED_ENV = {
    "ADMIN_PASSWORD": "secret",
    "SESSION_SECRET": "x" * 32,
    "ADMIN_GATEWAY_SECRET": "gateway-secret",
    "JWT_API_URL": "https://jwt.example.test/token",
    "COOKIE_SECURE": "false",
}
OWNER = "ada-lovelace"


@pytest.fixture()
def client(monkeypatch):
    for key, value in REQUIRED_ENV.items():
        monkeypatch.setenv(key, value)

    main = importlib.import_module("app.main")
    flask_app = main.create_app()
    flask_app.config.update(TESTING=True)
    return flask_app.test_client()


def login(client):
    return client.post("/auth/login", data={"password": "secret"})


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json == {"status": "ok"}


def test_login_rejects_wrong_password(client):
    response = client.post("/auth/login", data={"password": "wrong"})

    assert response.status_code == 303
    assert response.headers["Location"] == "/?error=1"


def test_login_sets_admin_cookie(client):
    response = login(client)

    assert response.status_code == 303
    assert response.headers["Location"] == "/admin"
    cookie = response.headers["Set-Cookie"]
    assert "admin_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=Lax" in cookie
    assert "Max-Age=28800" in cookie


def test_logout_clears_admin_cookie(client):
    login(client)

    response = client.post("/auth/logout")

    assert response.status_code == 303
    assert response.headers["Location"] == "/"
    assert "admin_session=;" in response.headers["Set-Cookie"]


def test_social_tariff_requires_authentication(client):
    response = client.post("/api/links/social-tariff", json={"owner": OWNER})

    assert response.status_code == 401
    assert response.json == {"message": "Unauthorized"}


def test_social_tariff_generates_link(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt-token"}}

    calls = []

    def fake_post(*args, **kwargs):
        calls.append((args, kwargs))
        return FakeResponse()

    monkeypatch.setattr("app.main.requests.post", fake_post)
    login(client)

    response = client.post("/api/links/social-tariff", json={"owner": OWNER})

    assert response.status_code == 200
    assert response.json == {
        "link": "https://www.somenergia.coop/ca/formulari-contractacio-periodes?form_type=domestic&token=jwt-token&owner=ada-lovelace"
    }
    assert calls[0][0] == ("https://jwt.example.test/token",)
    assert calls[0][1]["json"] == {"ff": ["socialTariffByPass"]}
    assert calls[0][1]["headers"]["X-Admin-Gateway-Token"] == "gateway-secret"


def test_social_tariff_reports_the_upstream_status_without_its_body(client, monkeypatch):
    class FakeResponse:
        ok = False
        status_code = 503
        text = "token=upstream-secret"

    monkeypatch.setattr("app.main.requests.post", lambda *args, **kwargs: FakeResponse())
    login(client)

    response = client.post("/api/links/social-tariff", json={"owner": OWNER})

    assert response.status_code == 502
    assert response.json == {
        "message": "L'API externa no pot generar el token.",
        "detail": "L'API JWT ha retornat HTTP 503.",
    }


def test_send_signature_generates_link(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt-token"}}

    calls = []

    def fake_post(*args, **kwargs):
        calls.append((args, kwargs))
        return FakeResponse()

    monkeypatch.setattr("app.main.requests.post", fake_post)
    login(client)

    response = client.post("/api/links/send-signature", json={"owner": OWNER})

    assert response.status_code == 200
    assert response.json == {
        "link": "https://www.somenergia.coop/ca/formulari-contractacio-periodes?form_type=domestic&token=jwt-token&owner=ada-lovelace"
    }
    assert calls[0][0] == ("https://jwt.example.test/token",)
    assert calls[0][1]["json"] == {"ff": ["sendSignature"]}
    assert calls[0][1]["headers"]["X-Admin-Gateway-Token"] == "gateway-secret"


def test_social_tariff_uses_custom_form_url(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt-token"}}

    monkeypatch.setattr("app.main.requests.post", lambda *args, **kwargs: FakeResponse())
    login(client)

    response = client.post(
        "/api/links/social-tariff",
        json={
            "formUrl": (
                "https://www.somenergia.coop/es/formulario-contratacion-periodos?"
                "form_type=enterprise&uid=3300"
            ),
            "owner": OWNER,
        },
    )

    assert response.status_code == 200
    assert response.json == {
        "link": (
            "https://www.somenergia.coop/es/formulario-contratacion-periodos?"
            "form_type=enterprise&uid=3300&token=jwt-token&owner=ada-lovelace"
        )
    }


def test_social_tariff_ignores_a_blank_custom_form_url(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt-token"}}

    monkeypatch.setattr("app.main.requests.post", lambda *args, **kwargs: FakeResponse())
    login(client)

    response = client.post("/api/links/social-tariff", json={"formUrl": "   ", "owner": OWNER})

    assert response.status_code == 200
    assert response.json == {
        "link": "https://www.somenergia.coop/ca/formulari-contractacio-periodes?form_type=domestic&token=jwt-token&owner=ada-lovelace"
    }


def test_social_tariff_replaces_existing_tokens_in_custom_form_url(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt+/="}}

    monkeypatch.setattr("app.main.requests.post", lambda *args, **kwargs: FakeResponse())
    login(client)

    response = client.post(
        "/api/links/social-tariff",
        json={"formUrl": "https://forms.example.test/alta?plan=solar&token=old&tag=a%2Bb&token=older", "owner": OWNER},
    )

    assert response.status_code == 200
    assert response.json == {
        "link": "https://forms.example.test/alta?plan=solar&token=jwt%2B%2F%3D&tag=a%2Bb&owner=ada-lovelace"
    }


@pytest.mark.parametrize("form_url", ["not-a-url", "ftp://forms.example.test/alta", "https://"])
def test_social_tariff_rejects_invalid_custom_form_url_without_requesting_jwt(client, monkeypatch, form_url):
    monkeypatch.setattr("app.main.requests.post", pytest.fail)
    login(client)

    response = client.post("/api/links/social-tariff", json={"formUrl": form_url, "owner": OWNER})

    assert response.status_code == 400
    assert response.json == {"message": "L'URL del formulari ha de ser una URL HTTP o HTTPS vàlida."}


@pytest.mark.parametrize("owner", [None, "", "Ada Lovelace", "ada--lovelace", "ada-lovelace-"])
def test_social_tariff_requires_a_valid_owner(client, monkeypatch, owner):
    monkeypatch.setattr("app.main.requests.post", pytest.fail)
    login(client)

    response = client.post("/api/links/social-tariff", json={"owner": owner})

    assert response.status_code == 400
    assert response.json == {"message": "A valid owner is required."}


def test_social_tariff_requires_owner(client, monkeypatch):
    monkeypatch.setattr("app.main.requests.post", pytest.fail)
    login(client)

    response = client.post("/api/links/social-tariff", json={})

    assert response.status_code == 400
    assert response.json == {"message": "A valid owner is required."}


def test_social_tariff_replaces_existing_owner_in_custom_form_url(client, monkeypatch):
    class FakeResponse:
        ok = True
        status_code = 200

        def json(self):
            return {"data": {"token": "jwt-token"}}

    monkeypatch.setattr("app.main.requests.post", lambda *args, **kwargs: FakeResponse())
    login(client)

    response = client.post(
        "/api/links/social-tariff",
        json={"formUrl": "https://forms.example.test/alta?plan=solar&owner=old&tag=vip&owner=older", "owner": OWNER},
    )

    assert response.status_code == 200
    assert response.json == {"link": "https://forms.example.test/alta?plan=solar&owner=ada-lovelace&tag=vip&token=jwt-token"}
