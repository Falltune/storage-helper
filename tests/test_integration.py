"""End-to-end tests for the local Archive HTTP API and pages."""

from __future__ import annotations

import json
import sqlite3
import sys
import threading
import time
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app import BASE_DIR, create_server
from database import Database

TEST_DATA_DIR = BASE_DIR / "data"


class ArchiveHttpTest(unittest.TestCase):
    def setUp(self) -> None:
        TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.db_path = TEST_DATA_DIR / (
            "archive-test-" + uuid.uuid4().hex + ".db"
        )
        self.server = create_server("127.0.0.1", 0, self.db_path)
        self.port = int(self.server.server_address[1])
        self.thread = threading.Thread(
            target=self.server.serve_forever, daemon=True
        )
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.port}"
        self._wait_until_ready()

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        for suffix in ("", "-wal", "-shm"):
            try:
                (Path(str(self.db_path) + suffix)).unlink(missing_ok=True)
            except OSError:
                pass

    def _wait_until_ready(self) -> None:
        for _ in range(50):
            try:
                status, _, _ = self.http("GET", "/api/health")
                if status == 200:
                    return
            except OSError:
                pass
            time.sleep(0.02)
        self.fail("server did not start")

    def http(
        self,
        method: str,
        path: str,
        payload: object = None,
        *,
        raw: bytes | None = None,
        content_type: str = "application/json",
    ) -> tuple[int, dict[str, str], bytes]:
        body = raw
        headers: dict[str, str] = {"Accept": "application/json, text/html"}
        if payload is not None:
            body = json.dumps(payload).encode("utf-8")
        if body is not None:
            headers["Content-Type"] = content_type
        request = Request(
            self.base + path, data=body, headers=headers, method=method
        )
        try:
            with urlopen(request, timeout=10) as response:
                return (
                    response.status,
                    dict(response.headers.items()),
                    response.read(),
                )
        except HTTPError as error:
            return error.code, dict(error.headers.items()), error.read()

    def api_json(
        self, method: str, path: str, payload: object = None, **kwargs
    ) -> tuple[int, dict]:
        status, _, body = self.http(method, path, payload, **kwargs)
        return status, json.loads(body.decode("utf-8"))

    def create_category(
        self, code: str, name: str = ""
    ) -> tuple[int, dict]:
        return self.api_json(
            "POST", "/api/categories", {"code": code, "name": name}
        )

    def create_warehouse(self, label: str = "") -> tuple[int, dict]:
        return self.api_json("POST", "/api/warehouses", {"label": label})

    def create_item(
        self,
        category: str,
        name: str,
        warehouse_id: str,
        *,
        acquired_on: str = "2026-01-15",
        price: str = "1299.50",
    ) -> tuple[int, dict]:
        return self.api_json(
            "POST",
            "/api/items",
            {
                "category_code": category,
                "name": name,
                "acquired_on": acquired_on,
                "price": price,
                "warehouse_id": warehouse_id,
            },
        )

    # ------------------------------------------------------------------ tests

    def test_complete_inventory_flow(self) -> None:
        status, data = self.api_json("GET", "/api/overview")
        self.assertEqual(status, 200)
        self.assertEqual(data["stats"]["item_count"], 0)
        self.assertEqual(data["stats"]["warehouse_count"], 0)
        self.assertEqual(data["warehouses"], [])

        status, category = self.create_category("ele", "电子设备")
        self.assertEqual(status, 201)
        self.assertEqual(category["category"]["code"], "ELE")
        self.assertEqual(category["category"]["name"], "电子设备")
        self.assertEqual(category["category"]["next_id"], "ELE000001")

        status, book = self.create_category("BOO", "")
        self.assertEqual(status, 201)
        self.assertEqual(book["category"]["name"], "BOO")

        status, duplicate = self.create_category("ELE", "重复分类")
        self.assertEqual(status, 409)
        self.assertEqual(duplicate["error"]["code"], "category_exists")

        status, reserved = self.create_category("STR", "仓库")
        self.assertEqual(status, 400)
        self.assertEqual(reserved["error"]["code"], "reserved_category_code")

        status, warehouse_one = self.create_warehouse("书房")
        self.assertEqual(status, 201)
        self.assertEqual(warehouse_one["warehouse"]["id"], "STR000001")
        status, warehouse_two = self.create_warehouse("")
        self.assertEqual(status, 201)
        self.assertEqual(warehouse_two["warehouse"]["id"], "STR000002")

        status, created = self.create_item(
            "ele", "富士相机", "str000001", price="5499.00"
        )
        self.assertEqual(status, 201)
        item = created["item"]
        self.assertEqual(item["id"], "ELE000001")
        self.assertEqual(item["category_code"], "ELE")
        self.assertEqual(item["price_cents"], 549900)
        self.assertEqual(item["status"], "in_stock")
        self.assertEqual(item["warehouse"]["id"], "STR000001")
        self.assertEqual(item["warehouse"]["label"], "书房")
        self.assertEqual(item["movements"][0]["type"], "inbound")

        status, book_item = self.create_item(
            "BOO", "设计中的设计", "STR000001", price="68.00"
        )
        self.assertEqual(status, 201)
        self.assertEqual(book_item["item"]["id"], "BOO000001")

        status, second = self.create_item(
            "ELE", "机械键盘", "STR000001", price="699.00"
        )
        self.assertEqual(status, 201)
        self.assertEqual(second["item"]["id"], "ELE000002")

        status, fetched = self.api_json("GET", "/api/items/ele000001")
        self.assertEqual(status, 200)
        self.assertEqual(fetched["item"]["id"], "ELE000001")

        warehouse_status, warehouse_data = self.api_json(
            "GET", "/api/warehouses/str000001"
        )
        self.assertEqual(warehouse_status, 200)
        warehouse = warehouse_data["warehouse"]
        self.assertEqual(warehouse["item_count"], 3)
        self.assertEqual(len(warehouse["items"]), 3)
        self.assertEqual(warehouse["total_value_cents"], 549900 + 6800 + 69900)

        status, _ = self.api_json(
            "GET", "/api/items?status=in_stock&category=ELE"
        )
        self.assertEqual(status, 200)

        status, outbound = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 200)
        self.assertEqual(outbound["item"]["status"], "out_of_stock")
        self.assertIsNone(outbound["item"]["warehouse"])
        self.assertEqual(outbound["item"]["movements"][0]["type"], "outbound")

        status, warehouse_after = self.api_json(
            "GET", "/api/warehouses/STR000001"
        )
        self.assertEqual(status, 200)
        self.assertEqual(warehouse_after["warehouse"]["item_count"], 2)
        ids_in_warehouse = {
            candidate["id"] for candidate in warehouse_after["warehouse"]["items"]
        }
        self.assertNotIn("ELE000001", ids_in_warehouse)

        status, available = self.api_json(
            "GET", "/api/items?status=out_of_stock"
        )
        self.assertEqual(status, 200)
        self.assertEqual([entry["id"] for entry in available["items"]], ["ELE000001"])

        status, third = self.create_item(
            "ELE", "镜头", "STR000001", price="2100"
        )
        self.assertEqual(status, 201)
        self.assertEqual(third["item"]["id"], "ELE000003")

        status, conflict = self.api_json(
            "POST", "/api/items/ELE000001/inbound", {"warehouse_id": "STR000001"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(conflict["item"]["warehouse"]["id"], "STR000001")
        status, conflict_again = self.api_json(
            "POST", "/api/items/ELE000001/inbound", {"warehouse_id": "STR000002"}
        )
        self.assertEqual(status, 409)
        self.assertEqual(conflict_again["error"]["code"], "item_already_in_stock")

        status, moved = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 200)
        status, moved = self.api_json(
            "POST", "/api/items/ELE000001/inbound", {"warehouse_id": "STR000002"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(moved["item"]["warehouse"]["id"], "STR000002")
        self.assertEqual(
            [movement["type"] for movement in moved["item"]["movements"][:3]],
            ["inbound", "outbound", "inbound"],
        )

        status, conflict_out = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 200)
        status, conflict_out = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 409)
        status, returned = self.api_json(
            "POST", "/api/items/ELE000001/inbound", {"warehouse_id": "STR000002"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(returned["item"]["status"], "in_stock")

        status, updated = self.api_json(
            "PATCH",
            "/api/items/BOO000001",
            {
                "name": "设计中的设计（修订版）",
                "acquired_on": "2026-02-03",
                "price": "88.80",
            },
        )
        self.assertEqual(status, 200)
        self.assertEqual(updated["item"]["name"], "设计中的设计（修订版）")
        self.assertEqual(updated["item"]["acquired_on"], "2026-02-03")
        self.assertEqual(updated["item"]["price_cents"], 8880)

        status, categories = self.api_json("GET", "/api/categories")
        self.assertEqual(status, 200)
        by_code = {entry["code"]: entry for entry in categories["categories"]}
        self.assertEqual(by_code["ELE"]["next_id"], "ELE000004")
        self.assertEqual(by_code["BOO"]["next_id"], "BOO000002")
        self.assertEqual(by_code["ELE"]["item_count"], 3)
        self.assertEqual(by_code["ELE"]["in_stock_count"], 3)

        status, overview = self.api_json("GET", "/api/overview")
        self.assertEqual(status, 200)
        self.assertEqual(overview["stats"]["item_count"], 4)
        self.assertEqual(overview["stats"]["in_stock_count"], 4)
        self.assertEqual(overview["stats"]["out_of_stock_count"], 0)
        self.assertEqual(overview["stats"]["warehouse_count"], 2)
        self.assertEqual(overview["stats"]["category_count"], 2)
        self.assertEqual(
            {entry["id"] for entry in overview["warehouses"]},
            {"STR000001", "STR000002"},
        )
        status, warehouse_two_data = self.api_json(
            "GET", "/api/warehouses/STR000002"
        )
        self.assertEqual(
            [entry["id"] for entry in warehouse_two_data["warehouse"]["items"]],
            ["ELE000001"],
        )

    def test_validation_and_unknown_records(self) -> None:
        status, _ = self.create_category("ELE", "电子设备")
        self.assertEqual(status, 201)
        status, warehouse = self.create_warehouse("书房")
        self.assertEqual(status, 201)
        warehouse_id = warehouse["warehouse"]["id"]

        bad_cases = [
            ("AB", 400),
            ("123", 400),
            ("", 400),
            ("STR", 400),
        ]
        for code, expected in bad_cases:
            with self.subTest(code=code):
                status, _ = self.create_category(code, "无效")
                self.assertEqual(status, expected)

        invalid_items = [
            (
                {
                    "category_code": "ELE",
                    "name": "",
                    "acquired_on": "2026-01-01",
                    "price": "1.00",
                    "warehouse_id": warehouse_id,
                },
                400,
            ),
            (
                {
                    "category_code": "ELE",
                    "name": "测试",
                    "acquired_on": "2999-01-01",
                    "price": "1.00",
                    "warehouse_id": warehouse_id,
                },
                400,
            ),
            (
                {
                    "category_code": "ELE",
                    "name": "测试",
                    "acquired_on": "2026-01-01",
                    "price": "-2",
                    "warehouse_id": warehouse_id,
                },
                400,
            ),
            (
                {
                    "category_code": "ELE",
                    "name": "测试",
                    "acquired_on": "2026-01-01",
                    "price": "1.234",
                    "warehouse_id": warehouse_id,
                },
                400,
            ),
            (
                {
                    "category_code": "NOPE",
                    "name": "测试",
                    "acquired_on": "2026-01-01",
                    "price": "1.00",
                    "warehouse_id": warehouse_id,
                },
                400,
            ),
            (
                {
                    "category_code": "ELE",
                    "name": "测试",
                    "acquired_on": "2026-01-01",
                    "price": "1.00",
                    "warehouse_id": "STR999999",
                },
                404,
            ),
        ]
        for payload, expected in invalid_items:
            with self.subTest(payload=payload):
                status, response = self.api_json("POST", "/api/items", payload)
                self.assertEqual(status, expected)
                self.assertIn("error", response)

        status, response = self.api_json("GET", "/api/items/ZZZ999999")
        self.assertEqual(status, 404)
        self.assertEqual(response["error"]["code"], "item_not_found")
        status, response = self.api_json("GET", "/api/warehouses/STR999999")
        self.assertEqual(status, 404)
        self.assertEqual(response["error"]["code"], "warehouse_not_found")
        status, response = self.api_json("GET", "/api/not-a-route")
        self.assertEqual(status, 404)

        status, _, _ = self.http(
            "POST",
            "/api/categories",
            raw=b'{"code":"ABC"}',
            content_type="text/plain",
        )
        self.assertEqual(status, 415)

        status, _, _ = self.http(
            "POST", "/api/categories", raw=b"{not valid json"
        )
        self.assertEqual(status, 400)

        status, _, _ = self.http("POST", "/api/categories", raw=b"[]")
        self.assertEqual(status, 422)

    def test_unknown_price_and_category_deletion(self) -> None:
        self.assertEqual(self.create_category("ELE", "电子设备")[0], 201)
        self.assertEqual(self.create_category("TMP", "空分类")[0], 201)
        warehouse_id = self.create_warehouse("书房")[1]["warehouse"]["id"]

        status, created = self.create_item(
            "ELE", "旧相机", warehouse_id, price="-1"
        )
        self.assertEqual(status, 201)
        self.assertEqual(created["item"]["price_cents"], -1)

        status, overview = self.api_json("GET", "/api/overview")
        self.assertEqual(status, 200)
        self.assertEqual(overview["stats"]["in_stock_value_cents"], 0)

        status, warehouse = self.api_json(
            "GET", f"/api/warehouses/{warehouse_id}"
        )
        self.assertEqual(status, 200)
        self.assertEqual(warehouse["warehouse"]["total_value_cents"], 0)

        status, updated = self.api_json(
            "PATCH", "/api/items/ELE000001", {"price": "25.50"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(updated["item"]["price_cents"], 2550)
        status, overview = self.api_json("GET", "/api/overview")
        self.assertEqual(overview["stats"]["in_stock_value_cents"], 2550)

        status, updated = self.api_json(
            "PATCH", "/api/items/ELE000001", {"price": "-1"}
        )
        self.assertEqual(status, 200)
        self.assertEqual(updated["item"]["price_cents"], -1)

        status, blocked = self.api_json("DELETE", "/api/categories/ELE")
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "category_not_empty")

        status, deleted = self.api_json("DELETE", "/api/categories/tmp")
        self.assertEqual(status, 200)
        self.assertEqual(deleted["deleted"]["code"], "TMP")
        status, categories = self.api_json("GET", "/api/categories")
        self.assertEqual(status, 200)
        self.assertNotIn(
            "TMP", [entry["code"] for entry in categories["categories"]]
        )

        status, recreated = self.create_category("TMP", "重新创建")
        self.assertEqual(status, 201)
        self.assertEqual(recreated["category"]["next_id"], "TMP000001")

        status, missing = self.api_json("DELETE", "/api/categories/ZZZ")
        self.assertEqual(status, 404)
        self.assertEqual(missing["error"]["code"], "category_not_found")

    def test_archive_items_and_warehouses(self) -> None:
        self.assertEqual(self.create_category("ELE", "电子设备")[0], 201)
        warehouse_id = self.create_warehouse("书房")[1]["warehouse"]["id"]
        status, created = self.create_item("ELE", "旧相机", warehouse_id)
        self.assertEqual(status, 201)
        self.assertFalse(created["item"]["archived"])
        self.assertIsNone(created["item"]["archived_at"])

        status, archived = self.api_json(
            "POST", "/api/items/ELE000001/archive", {}
        )
        self.assertEqual(status, 200)
        self.assertTrue(archived["item"]["archived"])
        self.assertIsNotNone(archived["item"]["archived_at"])
        # Archiving is reversible and does not rewrite the stock ledger.
        self.assertEqual(archived["item"]["status"], "in_stock")
        self.assertEqual(archived["item"]["warehouse"]["id"], warehouse_id)

        status, listing = self.api_json("GET", "/api/items")
        self.assertEqual(status, 200)
        self.assertEqual(listing["items"], [])
        status, archived_listing = self.api_json("GET", "/api/items?archived=1")
        self.assertEqual(
            [entry["id"] for entry in archived_listing["items"]], ["ELE000001"]
        )
        status, archived_status = self.api_json(
            "GET", "/api/items?status=archived"
        )
        self.assertEqual(
            [entry["id"] for entry in archived_status["items"]], ["ELE000001"]
        )
        status, all_listing = self.api_json(
            "GET", "/api/items?include_archived=1"
        )
        self.assertEqual(
            [entry["id"] for entry in all_listing["items"]], ["ELE000001"]
        )

        status, detail = self.api_json("GET", f"/api/warehouses/{warehouse_id}")
        self.assertEqual(status, 200)
        self.assertEqual(detail["warehouse"]["item_count"], 0)
        self.assertEqual(detail["warehouse"]["archived_item_count"], 1)
        self.assertEqual(detail["warehouse"]["items"], [])
        self.assertEqual(detail["warehouse"]["history_count"], 1)
        self.assertFalse(detail["warehouse"]["can_delete"])
        self.assertTrue(detail["warehouse"]["can_archive"])

        status, overview = self.api_json("GET", "/api/overview")
        self.assertEqual(status, 200)
        self.assertEqual(overview["stats"]["item_count"], 0)
        self.assertEqual(overview["stats"]["archived_item_count"], 1)
        self.assertEqual(overview["recent_items"], [])

        status, blocked = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "item_archived")
        status, blocked = self.api_json(
            "POST", "/api/items/ELE000001/inbound", {"warehouse_id": warehouse_id}
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "item_archived")

        status, unarchived = self.api_json(
            "POST", "/api/items/ELE000001/unarchive", {}
        )
        self.assertEqual(status, 200)
        self.assertFalse(unarchived["item"]["archived"])
        status, listing = self.api_json("GET", "/api/items")
        self.assertEqual(
            [entry["id"] for entry in listing["items"]], ["ELE000001"]
        )
        status, detail = self.api_json("GET", f"/api/warehouses/{warehouse_id}")
        self.assertEqual(detail["warehouse"]["item_count"], 1)
        self.assertEqual(
            [entry["id"] for entry in detail["warehouse"]["items"]],
            ["ELE000001"],
        )

        status, patched = self.api_json(
            "PATCH", "/api/items/ELE000001", {"archived": True}
        )
        self.assertEqual(status, 200)
        self.assertTrue(patched["item"]["archived"])
        status, patched = self.api_json(
            "PATCH", "/api/items/ELE000001", {"archived": False}
        )
        self.assertEqual(status, 200)
        self.assertFalse(patched["item"]["archived"])

        status, blocked = self.api_json(
            "POST", f"/api/warehouses/{warehouse_id}/archive", {}
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "warehouse_not_empty")
        status, blocked = self.api_json(
            "PATCH", f"/api/warehouses/{warehouse_id}", {"archived": True}
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "warehouse_not_empty")

        self.assertEqual(
            self.api_json("POST", "/api/items/ELE000001/archive", {})[0], 200
        )
        status, archived_warehouse = self.api_json(
            "POST", f"/api/warehouses/{warehouse_id}/archive", {}
        )
        self.assertEqual(status, 200)
        self.assertTrue(archived_warehouse["warehouse"]["archived"])
        status, active_warehouses = self.api_json("GET", "/api/warehouses")
        self.assertEqual(active_warehouses["warehouses"], [])
        status, archived_warehouses = self.api_json(
            "GET", "/api/warehouses?archived=1"
        )
        self.assertEqual(
            [entry["id"] for entry in archived_warehouses["warehouses"]],
            [warehouse_id],
        )
        status, all_warehouses = self.api_json(
            "GET", "/api/warehouses?include_archived=1"
        )
        self.assertEqual(len(all_warehouses["warehouses"]), 1)

        status, blocked = self.api_json(
            "POST",
            "/api/items",
            {
                "category_code": "ELE",
                "name": "新物品",
                "acquired_on": "2026-01-01",
                "price": "1.00",
                "warehouse_id": warehouse_id,
            },
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "warehouse_archived")

        status, restored = self.api_json(
            "POST", f"/api/warehouses/{warehouse_id}/unarchive", {}
        )
        self.assertEqual(status, 200)
        self.assertFalse(restored["warehouse"]["archived"])
        status, restored = self.api_json(
            "POST", "/api/items/ELE000001/unarchive", {}
        )
        self.assertEqual(status, 200)
        self.assertFalse(restored["item"]["archived"])

    def test_warehouse_deletion_requires_no_history(self) -> None:
        self.assertEqual(self.create_category("ELE", "电子设备")[0], 201)
        used_warehouse = self.create_warehouse("旧仓库")[1]["warehouse"]
        unused_warehouse = self.create_warehouse("空仓库")[1]["warehouse"]

        status, _ = self.create_item("ELE", "台灯", used_warehouse["id"])
        self.assertEqual(status, 201)
        status, outbound = self.api_json(
            "POST", "/api/items/ELE000001/outbound", {}
        )
        self.assertEqual(status, 200)

        status, blocked = self.api_json(
            "DELETE", f"/api/warehouses/{used_warehouse['id']}"
        )
        self.assertEqual(status, 409)
        self.assertEqual(blocked["error"]["code"], "warehouse_in_use")

        status, deleted = self.api_json(
            "DELETE", f"/api/warehouses/{unused_warehouse['id']}"
        )
        self.assertEqual(status, 200)
        self.assertEqual(deleted["deleted"]["id"], unused_warehouse["id"])

        status, missing = self.api_json(
            "GET", f"/api/warehouses/{unused_warehouse['id']}"
        )
        self.assertEqual(status, 404)
        status, listing = self.api_json("GET", "/api/warehouses")
        self.assertEqual(
            [entry["id"] for entry in listing["warehouses"]],
            [used_warehouse["id"]],
        )

        archived_unused = self.create_warehouse("归档后可删")[1]["warehouse"]
        self.assertEqual(
            self.api_json(
                "POST", f"/api/warehouses/{archived_unused['id']}/archive", {}
            )[0],
            200,
        )
        status, deleted = self.api_json(
            "DELETE", f"/api/warehouses/{archived_unused['id']}"
        )
        self.assertEqual(status, 200)
        self.assertEqual(deleted["deleted"]["id"], archived_unused["id"])

        status, missing = self.api_json("DELETE", "/api/warehouses/STR999999")
        self.assertEqual(status, 404)
        self.assertEqual(missing["error"]["code"], "warehouse_not_found")

    def test_closed_stderr_does_not_break_responses(self) -> None:
        class BrokenStream:
            def write(self, *_args, **_kwargs):
                raise OSError("stream closed")

            def flush(self, *_args, **_kwargs):
                raise OSError("stream closed")

        original_stderr = sys.stderr
        sys.stderr = BrokenStream()  # type: ignore[assignment]
        try:
            status, _, body = self.http("GET", "/api/health")
        finally:
            sys.stderr = original_stderr
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body.decode("utf-8"))["status"], "ok")

    def test_pages_assets_and_404s(self) -> None:
        status, headers, body = self.http("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn("藏物 Archive", body.decode("utf-8"))
        self.assertIn("Content-Security-Policy", headers)

        for path in (
            "/items",
            "/warehouses",
            "/categories",
            "/ele000001",
            "/ELE000001",
            "/str000001",
            "/STR000001",
        ):
            with self.subTest(path=path):
                status, headers, _ = self.http("GET", path)
                self.assertEqual(status, 200)
                self.assertIn("text/html", headers["Content-Type"])

        status, headers, body = self.http("GET", "/unknown-page")
        self.assertEqual(status, 404)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn("正在打开档案", body.decode("utf-8"))

        status, headers, body = self.http("GET", "/static/styles.css")
        self.assertEqual(status, 200)
        self.assertIn("text/css", headers["Content-Type"])
        self.assertIn("--paper", body.decode("utf-8"))

        status, headers, body = self.http("GET", "/static/app.js")
        self.assertEqual(status, 200)
        self.assertIn("javascript", headers["Content-Type"])
        self.assertIn("renderRoute", body.decode("utf-8"))

        status, _, _ = self.http("GET", "/static/../database.py")
        self.assertEqual(status, 404)
        status, _, _ = self.http("GET", "/static/%2e%2e/database.py")
        self.assertEqual(status, 404)

        status, headers, _ = self.http("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")

    def test_concurrent_number_allocation_is_unique(self) -> None:
        self.assertEqual(self.create_category("ELE", "电子设备")[0], 201)
        warehouse = self.create_warehouse("书房")[1]["warehouse"]

        def post_one(index: int) -> tuple[int, dict]:
            return self.create_item(
                "ELE", f"并发物品 {index}", warehouse["id"]
            )

        with ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(post_one, range(12)))

        self.assertTrue(all(status == 201 for status, _ in results))
        ids = sorted(response["item"]["id"] for _, response in results)
        self.assertEqual(
            ids,
            [f"ELE{serial:06d}" for serial in range(1, 13)],
        )
        self.assertEqual(
            self.api_json("GET", "/api/categories")[1]["categories"][0][
                "next_id"
            ],
            "ELE000013",
        )


class LegacyDatabaseMigrationTest(unittest.TestCase):
    def test_existing_price_check_is_migrated(self) -> None:
        TEST_DATA_DIR.mkdir(parents=True, exist_ok=True)
        db_path = TEST_DATA_DIR / ("archive-legacy-" + uuid.uuid4().hex + ".db")
        conn = sqlite3.connect(db_path)
        try:
            conn.executescript(
                """
                CREATE TABLE app_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE categories (
                    code TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    next_serial INTEGER NOT NULL DEFAULT 1 CHECK(next_serial >= 1),
                    created_at TEXT NOT NULL
                );
                CREATE TABLE warehouses (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL DEFAULT '',
                    created_at TEXT NOT NULL
                );
                CREATE TABLE items (
                    id TEXT PRIMARY KEY,
                    category_code TEXT NOT NULL REFERENCES categories(code),
                    serial INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    acquired_on TEXT NOT NULL,
                    price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
                    warehouse_id TEXT REFERENCES warehouses(id),
                    status TEXT NOT NULL CHECK(status IN ('in_stock', 'out_of_stock')),
                    outbound_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(category_code, serial)
                );
                CREATE TABLE movements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_id TEXT NOT NULL REFERENCES items(id),
                    type TEXT NOT NULL CHECK(type IN ('inbound', 'outbound')),
                    warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
                    occurred_at TEXT NOT NULL
                );
                INSERT INTO app_meta(key, value) VALUES
                    ('warehouse_next_serial', '2'),
                    ('schema_version', '1');
                INSERT INTO categories(code, name, next_serial, created_at)
                    VALUES ('ELE', '电子设备', 2, '2026-01-01T00:00:00Z');
                INSERT INTO warehouses(id, label, created_at)
                    VALUES ('STR000001', '书房', '2026-01-01T00:00:00Z');
                INSERT INTO items(
                    id, category_code, serial, name, acquired_on, price_cents,
                    warehouse_id, status, outbound_at, created_at, updated_at
                ) VALUES (
                    'ELE000001', 'ELE', 1, '旧相机', '2026-01-15', 100,
                    'STR000001', 'in_stock', NULL,
                    '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'
                );
                INSERT INTO movements(item_id, type, warehouse_id, occurred_at)
                    VALUES ('ELE000001', 'inbound', 'STR000001', '2026-01-15T00:00:00Z');
                """
            )
            conn.commit()
        finally:
            conn.close()

        try:
            database = Database(db_path)
            item = database.update_item("ELE000001", {"price": "-1"})
            self.assertEqual(item["price_cents"], -1)
            self.assertEqual(item["name"], "旧相机")
            self.assertEqual(
                [movement["type"] for movement in item["movements"]],
                ["inbound"],
            )

            check = sqlite3.connect(db_path)
            try:
                schema = check.execute(
                    "SELECT sql FROM sqlite_master "
                    "WHERE type = 'table' AND name = 'items'"
                ).fetchone()[0]
                self.assertIn(
                    "price_cents = -1", " ".join(schema.split())
                )
                self.assertEqual(
                    check.execute("SELECT COUNT(*) FROM items").fetchone()[0],
                    1,
                )
                self.assertEqual(
                    check.execute(
                        "SELECT value FROM app_meta WHERE key = 'schema_version'"
                    ).fetchone()[0],
                    "3",
                )
                item_columns = {
                    row[1]
                    for row in check.execute("PRAGMA table_info(items)").fetchall()
                }
                warehouse_columns = {
                    row[1]
                    for row in check.execute(
                        "PRAGMA table_info(warehouses)"
                    ).fetchall()
                }
                self.assertIn("archived_at", item_columns)
                self.assertIn("archived_at", warehouse_columns)
                self.assertIsNone(
                    check.execute(
                        "SELECT archived_at FROM items WHERE id = 'ELE000001'"
                    ).fetchone()[0]
                )
                self.assertEqual(
                    check.execute("PRAGMA foreign_key_check").fetchall(),
                    [],
                )
            finally:
                check.close()
        finally:
            for suffix in ("", "-wal", "-shm"):
                try:
                    Path(str(db_path) + suffix).unlink(missing_ok=True)
                except OSError:
                    pass


if __name__ == "__main__":
    unittest.main(verbosity=2)
