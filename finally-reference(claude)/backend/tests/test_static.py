from pathlib import Path
import pytest
from fastapi.testclient import TestClient

STATIC = Path(__file__).resolve().parents[2] / "static"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("FINALLY_DB_PATH", str(tmp_path / "s.db"))
    monkeypatch.setenv("FINALLY_STATIC_DIR", str(STATIC))
    import importlib, app.main as main
    main = importlib.reload(main)          # STATIC_DIR is read at import time, so re-read the env var
    with TestClient(main.app) as c:
        yield c


def test_frontend_is_served_and_api_still_wins(client):
    home = client.get("/")
    assert home.status_code == 200 and "FinAlly" in home.text
    for asset in ("/css/styles.css", "/js/app.js", "/js/logic.js", "/js/charts.js", "/js/api.js"):
        assert client.get(asset).status_code == 200, asset
    assert client.get("/api/health").json()["status"] == "ok"      # /api/* not shadowed by static files


def test_brand_colors_present_in_css(client):
    css = client.get("/css/styles.css").text.lower()
    for hex_ in ("#1f3d2b", "#f6f3ed", "#bfa76a", "#a58970"):
        assert hex_ in css
