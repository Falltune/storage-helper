"""HTTP server for 藏物 Archive — a tiny, dependency-free local web app."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import sys
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlsplit

from database import AppError, Database

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DEFAULT_DB = BASE_DIR / "data" / "archive.db"
MAX_BODY_BYTES = 1_000_000
PAGE_ROUTE_RE = re.compile(r"^/(?:[A-Za-z]{3}\d{6})/?$")
BASE_PAGE_ROUTES = {"/", "/items", "/warehouses", "/categories"}

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}

HTML_CSP = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "base-uri 'none'; "
    "form-action 'self'; "
    "frame-ancestors 'none'"
)


def safe_print(*values: Any, file: Any = None, **kwargs: Any) -> None:
    """Print without letting a closed stdout/stderr stop the local server."""
    target = sys.stdout if file is None else file
    if target is None:
        return
    try:
        print(*values, file=target, **kwargs)
    except (OSError, ValueError, UnicodeError):
        pass


class ArchiveServer(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64
    # On Windows SO_REUSEADDR lets a second process bind the same port, which
    # can leave half-dead listeners behind. Prefer a clear "port in use" error.
    allow_reuse_address = os.name != "nt"

    def __init__(
        self,
        server_address: tuple[str, int],
        database: Database,
        static_dir: Path,
    ) -> None:
        self.database = database
        self.static_dir = static_dir.resolve()
        super().__init__(server_address, ArchiveHandler)

    def handle_error(self, request: Any, client_address: Any) -> None:
        # Browsers routinely drop idle keep-alive sockets; that is not a server
        # error and must not spam the console (or crash when stderr is closed).
        error = sys.exc_info()[1]
        if isinstance(
            error, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)
        ):
            return
        try:
            super().handle_error(request, client_address)
        except Exception:
            pass


class ArchiveHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "Archive/1.0"
    sys_version = ""

    @property
    def db(self) -> Database:
        return self.server.database  # type: ignore[attr-defined]

    @property
    def static_dir(self) -> Path:
        return self.server.static_dir  # type: ignore[attr-defined]

    # --------------------------------------------------------------- requests

    def do_GET(self) -> None:
        self._run("GET")

    def do_POST(self) -> None:
        self._run("POST")

    def do_PATCH(self) -> None:
        self._run("PATCH")

    def do_PUT(self) -> None:
        self._method_not_allowed()

    def do_DELETE(self) -> None:
        self._run("DELETE")

    def do_OPTIONS(self) -> None:
        self._send_bytes(
            405,
            b"Method Not Allowed",
            "text/plain; charset=utf-8",
            extra_headers={"Allow": "GET, POST, PATCH, DELETE"},
        )

    def _run(self, method: str) -> None:
        try:
            self._dispatch(method)
        except AppError as exc:
            self._send_json_error(exc)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            try:
                traceback.print_exc()
            except Exception:
                # stdout/stderr may be unavailable in background launches.
                pass
            try:
                self._send_json(
                    500,
                    {
                        "error": {
                            "code": "internal_error",
                            "message": "服务器开小差了，请稍后再试",
                            "fields": {},
                        }
                    },
                )
            except (BrokenPipeError, ConnectionResetError):
                pass

    def _dispatch(self, method: str) -> None:
        parsed = urlsplit(self.path)
        path = unquote(parsed.path)
        if not path.startswith("/"):
            raise AppError("请求路径不正确", status=400)
        if path != "/":
            path = path.rstrip("/") or "/"

        if path == "/api" or path.startswith("/api/"):
            self._dispatch_api(method, path, parse_qs(parsed.query, keep_blank_values=True))
            return

        if path.startswith("/static/"):
            if method != "GET":
                self._method_not_allowed({"GET"})
            self._serve_static(path)
            return

        if method != "GET":
            self._method_not_allowed({"GET"})
            return
        self._serve_page(path)

    # -------------------------------------------------------------------- API

    def _dispatch_api(
        self, method: str, path: str, query: dict[str, list[str]]
    ) -> None:
        parts = [part for part in path.split("/") if part]
        # ["api", resource, ...]
        resource = parts[1] if len(parts) > 1 else ""

        if path == "/api/health" and method == "GET":
            self._send_json(
                200,
                {"status": "ok", "app": "藏物 Archive", "version": "1.0"},
            )
            return

        if resource == "overview" and len(parts) == 2:
            self._require_method(method, {"GET"})
            self._send_json(200, self.db.get_overview())
            return

        if resource == "categories":
            if len(parts) == 2:
                if method == "GET":
                    self._send_json(200, {"categories": self.db.list_categories()})
                    return
                if method == "POST":
                    created = self.db.create_category(self._read_json())
                    self._send_json(201, {"category": created})
                    return
                self._method_not_allowed({"GET", "POST"})
                return
            if len(parts) == 3:
                self._require_method(method, {"DELETE"})
                self._read_json_optional()
                deleted = self.db.delete_category(parts[2])
                self._send_json(200, {"deleted": deleted})
                return
            raise AppError("接口不存在", status=404, code="not_found")

        if resource == "warehouses":
            if len(parts) == 2:
                if method == "GET":
                    archived = self._query_bool(query, "archived")
                    if self._query_bool(query, "include_archived") is True:
                        archived = None
                    elif archived is None:
                        archived = False
                    self._send_json(
                        200, {"warehouses": self.db.list_warehouses(archived=archived)}
                    )
                    return
                if method == "POST":
                    created = self.db.create_warehouse(self._read_json())
                    self._send_json(201, {"warehouse": created})
                    return
                self._method_not_allowed({"GET", "POST"})
                return
            if len(parts) == 3:
                if method == "GET":
                    self._send_json(
                        200, {"warehouse": self.db.get_warehouse(parts[2])}
                    )
                    return
                if method == "PATCH":
                    self._send_json(
                        200,
                        {
                            "warehouse": self.db.update_warehouse(
                                parts[2], self._read_json()
                            )
                        },
                    )
                    return
                if method == "DELETE":
                    self._read_json_optional()
                    deleted = self.db.delete_warehouse(parts[2])
                    self._send_json(200, {"deleted": deleted})
                    return
                self._method_not_allowed({"GET", "PATCH", "DELETE"})
                return
            if len(parts) == 4 and parts[3] in {"archive", "unarchive", "restore"}:
                self._require_method(method, {"POST"})
                self._read_json_optional()
                if parts[3] == "archive":
                    warehouse = self.db.archive_warehouse(parts[2])
                else:
                    warehouse = self.db.unarchive_warehouse(parts[2])
                self._send_json(200, {"warehouse": warehouse})
                return
            if len(parts) == 4 and parts[3] == "delete":
                self._require_method(method, {"POST"})
                self._read_json_optional()
                deleted = self.db.delete_warehouse(parts[2])
                self._send_json(200, {"deleted": deleted})
                return
            raise AppError("接口不存在", status=404, code="not_found")

        if resource == "items":
            if len(parts) == 2:
                if method == "GET":
                    archived = self._query_bool(query, "archived")
                    if self._query_bool(query, "include_archived") is True:
                        archived = None
                    elif archived is None:
                        archived = False
                    items = self.db.list_items(
                        status=self._query_value(query, "status"),
                        category=self._query_value(query, "category"),
                        query=self._query_value(query, "q"),
                        archived=archived,
                    )
                    self._send_json(200, {"items": items})
                    return
                if method == "POST":
                    created = self.db.create_item(self._read_json())
                    self._send_json(201, {"item": created})
                    return
                self._method_not_allowed({"GET", "POST"})
                return
            if len(parts) == 3:
                if method == "GET":
                    item = self.db.get_item(parts[2])
                    self._send_json(200, {"item": item})
                    return
                if method == "PATCH":
                    item = self.db.update_item(parts[2], self._read_json())
                    self._send_json(200, {"item": item})
                    return
                if method == "DELETE":
                    self._read_json_optional()
                    deleted = self.db.delete_item(parts[2])
                    self._send_json(200, {"deleted": deleted})
                    return
                self._method_not_allowed({"GET", "PATCH", "DELETE"})
                return
            if len(parts) == 4 and parts[3] in {"archive", "unarchive", "restore"}:
                self._require_method(method, {"POST"})
                self._read_json_optional()
                if parts[3] == "archive":
                    item = self.db.archive_item(parts[2])
                else:
                    item = self.db.unarchive_item(parts[2])
                self._send_json(200, {"item": item})
                return
            if len(parts) == 4 and parts[3] == "outbound":
                self._require_method(method, {"POST"})
                self._read_json_optional()
                item = self.db.outbound_item(parts[2])
                self._send_json(200, {"item": item})
                return
            if len(parts) == 4 and parts[3] == "inbound":
                self._require_method(method, {"POST"})
                payload = self._read_json()
                item = self.db.inbound_item(parts[2], payload.get("warehouse_id"))
                self._send_json(200, {"item": item})
                return
            raise AppError("接口不存在", status=404, code="not_found")

        raise AppError("接口不存在", status=404, code="not_found")

    def _require_method(self, method: str, allowed: set[str]) -> None:
        if method not in allowed:
            self._method_not_allowed(allowed)

    def _method_not_allowed(self, allowed: set[str] | None = None) -> None:
        raise AppError(
            "请求方式不支持",
            status=405,
            code="method_not_allowed",
        )

    @staticmethod
    def _query_value(query: dict[str, list[str]], key: str) -> str | None:
        values = query.get(key)
        return values[0] if values else None

    @staticmethod
    def _query_bool(query: dict[str, list[str]], key: str) -> bool | None:
        values = query.get(key)
        if not values:
            return None
        raw = str(values[0]).strip().lower()
        if raw in {"1", "true", "yes", "on"}:
            return True
        if raw in {"0", "false", "no", "off"}:
            return False
        raise AppError(
            "筛选条件不正确",
            fields={key: "应为 true / false 或 1 / 0"},
        )

    def _read_json_optional(self) -> dict[str, Any]:
        length = self.headers.get("Content-Length")
        if not length or length == "0":
            return {}
        return self._read_json()

    def _read_json(self) -> dict[str, Any]:
        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            raise AppError(
                "请求内容必须是 JSON",
                status=415,
                code="unsupported_media_type",
            )
        raw_length = self.headers.get("Content-Length")
        try:
            length = int(raw_length or "0")
        except ValueError as exc:
            raise AppError("请求长度不正确", status=400) from exc
        if length < 0:
            raise AppError("请求长度不正确", status=400)
        if length > MAX_BODY_BYTES:
            raise AppError("请求内容过大", status=413, code="payload_too_large")
        raw = self.rfile.read(length) if length else b""
        if not raw:
            raise AppError("请求内容为空", status=422, code="empty_body")
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise AppError(
                "JSON 格式不正确", status=400, code="invalid_json"
            ) from exc
        if not isinstance(payload, dict):
            raise AppError(
                "请求内容必须是一个 JSON 对象",
                status=422,
                code="invalid_payload",
            )
        return payload

    def _send_json_error(self, error: AppError) -> None:
        self._send_json(
            error.status,
            {
                "error": {
                    "code": error.code,
                    "message": error.message,
                    "fields": error.fields,
                }
            },
        )

    def _send_json(self, status: int, payload: Any) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode(
            "utf-8"
        )
        self._send_bytes(
            status,
            body,
            "application/json; charset=utf-8",
            extra_headers={"Cache-Control": "no-store"},
        )

    # ------------------------------------------------------------------ pages

    def _serve_page(self, path: str) -> None:
        if path == "/favicon.ico":
            favicon = self.static_dir / "favicon.svg"
            if favicon.is_file():
                self._send_file(favicon, status=200)
                return
        index_file = self.static_dir / "index.html"
        is_known = path in BASE_PAGE_ROUTES or bool(PAGE_ROUTE_RE.fullmatch(path))
        if not index_file.is_file():
            self._send_bytes(
                500,
                "Missing static/index.html".encode("utf-8"),
                "text/plain; charset=utf-8",
            )
            return
        # Unknown client-side routes still receive the app shell (with a 404
        # status), so the interface can show its own not-found screen.
        self._send_file(index_file, status=200 if is_known else 404, csp=True)

    def _serve_static(self, path: str) -> None:
        relative = path[len("/static/") :]
        candidate = (self.static_dir / relative).resolve()
        try:
            candidate.relative_to(self.static_dir)
        except ValueError:
            raise AppError("文件不存在", status=404, code="not_found")
        if not candidate.is_file() or candidate.name.startswith("."):
            raise AppError("文件不存在", status=404, code="not_found")
        self._send_file(candidate, status=200)

    def _send_file(self, file_path: Path, *, status: int, csp: bool = False) -> None:
        try:
            data = file_path.read_bytes()
        except OSError:
            raise AppError("文件不存在", status=404, code="not_found")
        guessed, _ = mimetypes.guess_type(str(file_path))
        content_type = guessed or "application/octet-stream"
        if content_type.startswith("text/") or content_type in {
            "application/javascript",
            "application/json",
            "image/svg+xml",
        }:
            content_type += "; charset=utf-8"
        headers: dict[str, str] = {"Cache-Control": "no-cache"}
        if csp:
            headers["Content-Security-Policy"] = HTML_CSP
        self._send_bytes(status, data, content_type, extra_headers=headers)

    # ---------------------------------------------------------------- output

    def _send_bytes(
        self,
        status: int,
        body: bytes,
        content_type: str,
        *,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for key, value in SECURITY_HEADERS.items():
            self.send_header(key, value)
        if extra_headers:
            for key, value in extra_headers.items():
                self.send_header(key, value)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        # Static asset noise is avoided; keep a useful one-line request log.
        message = format % args
        if "/static/" in message:
            return
        stream = sys.stderr
        if stream is None:
            return
        try:
            stream.write(f"  {self.log_date_time_string()}  {message}\n")
            stream.flush()
        except Exception:
            # A closed/redirected console must never take the HTTP server down.
            # BaseHTTPRequestHandler calls this from send_response(), so raising
            # here would drop the connection before any response is written.
            pass


def create_server(
    host: str = "127.0.0.1",
    port: int = 8000,
    db_path: str | Path = DEFAULT_DB,
    static_dir: str | Path = STATIC_DIR,
) -> ArchiveServer:
    database = Database(db_path)
    return ArchiveServer((host, port), database, Path(static_dir))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="藏物 Archive — 个人物品管理系统的本地服务"
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("HOST", "127.0.0.1"),
        help="监听地址（默认 127.0.0.1，仅本机访问）",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", "8000")),
        help="监听端口（默认 8000）",
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("ARCHIVE_DB", str(DEFAULT_DB)),
        help="SQLite 数据库文件路径",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if not (0 <= args.port <= 65535):
        safe_print("端口号必须在 0 到 65535 之间。", file=sys.stderr)
        return 2

    try:
        server = create_server(args.host, args.port, args.db)
    except OSError as exc:
        safe_print(
            f"无法启动服务：{exc}\n端口 {args.port} 可能已被占用，请使用 --port 换一个端口。",
            file=sys.stderr,
        )
        return 1

    actual_host, actual_port = server.server_address[:2]
    shown_host = "127.0.0.1" if actual_host in {"0.0.0.0", "::"} else actual_host
    db_path = Path(args.db).resolve()
    safe_print()
    safe_print("  藏物 ARCHIVE")
    safe_print("  个人物品管理档案 · 本地服务已启动")
    safe_print()
    safe_print(f"  访问地址   http://{shown_host}:{actual_port}")
    safe_print(f"  数据文件   {db_path}")
    safe_print()
    safe_print("  按 Ctrl+C 停止服务")
    safe_print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        safe_print("\n  服务已停止。")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
