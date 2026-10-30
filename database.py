"""SQLite persistence and business rules for 藏物 Archive."""

from __future__ import annotations

import re
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterator

CATEGORY_CODE_RE = re.compile(r"^[A-Z]{3}$")
ITEM_ID_RE = re.compile(r"^[A-Z]{3}\d{6}$")
WAREHOUSE_ID_RE = re.compile(r"^STR\d{6}$")
MAX_SERIAL = 999_999
MAX_PRICE_CENTS = 9_999_999_999  # ¥99,999,999.99
UNKNOWN_PRICE_CENTS = -1
RESERVED_CATEGORY_CODES = {"STR"}

ITEMS_TABLE_SQL = """
CREATE TABLE {name} (
    id TEXT PRIMARY KEY,
    category_code TEXT NOT NULL REFERENCES categories(code),
    serial INTEGER NOT NULL,
    name TEXT NOT NULL,
    acquired_on TEXT NOT NULL,
    price_cents INTEGER NOT NULL
        CHECK(price_cents >= 0 OR price_cents = -1),
    warehouse_id TEXT REFERENCES warehouses(id),
    status TEXT NOT NULL CHECK(status IN ('in_stock', 'out_of_stock')),
    outbound_at TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(category_code, serial)
)
"""


class AppError(Exception):
    """An expected error that can safely be shown to the user."""

    def __init__(
        self,
        message: str,
        *,
        status: int = 400,
        code: str = "bad_request",
        fields: dict[str, str] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.fields = fields or {}


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def _clean_text(value: Any, field: str, *, required: bool, max_len: int) -> str:
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise AppError(f"{field}格式不正确", fields={field: "请输入文本"})
    text = " ".join(value.strip().split())
    if required and not text:
        raise AppError(f"请填写{field}", fields={field: f"请填写{field}"})
    if len(text) > max_len:
        raise AppError(
            f"{field}最多 {max_len} 个字符",
            fields={field: f"最多 {max_len} 个字符"},
        )
    return text


def normalize_category_code(value: Any) -> str:
    code = str(value or "").strip().upper()
    if not CATEGORY_CODE_RE.fullmatch(code):
        raise AppError(
            "分类代号必须是 3 位英文字母",
            code="invalid_category_code",
            fields={"code": "请输入 3 位英文字母"},
        )
    if code in RESERVED_CATEGORY_CODES:
        raise AppError(
            "分类代号 STR 已保留给仓库编号，请换一个",
            code="reserved_category_code",
            fields={"code": "STR 为仓库专用前缀"},
        )
    return code


def normalize_item_id(value: Any) -> str:
    item_id = str(value or "").strip().upper()
    if not ITEM_ID_RE.fullmatch(item_id) or item_id in RESERVED_CATEGORY_CODES:
        raise AppError("物品编号格式不正确", status=404, code="item_not_found")
    if item_id[:3] == "STR":
        raise AppError("这不是物品编号", status=404, code="item_not_found")
    return item_id


def normalize_warehouse_id(value: Any) -> str:
    warehouse_id = str(value or "").strip().upper()
    if not WAREHOUSE_ID_RE.fullmatch(warehouse_id):
        raise AppError(
            "仓库编号格式应为 STR + 6 位数字",
            status=404,
            code="warehouse_not_found",
        )
    return warehouse_id


def parse_price_cents(value: Any) -> int:
    if isinstance(value, bool) or value is None:
        raise AppError("请填写入手价", fields={"price": "请填写入手价"})
    if isinstance(value, float):
        raw = format(value, ".2f")
    else:
        raw = str(value).strip()
    if not raw:
        raise AppError("请填写入手价", fields={"price": "请填写入手价"})
    if len(raw) > 20:
        raise AppError("入手价格式不正确", fields={"price": "金额过大或格式不正确"})
    try:
        amount = Decimal(raw)
    except InvalidOperation as exc:
        raise AppError("入手价格式不正确", fields={"price": "请输入有效金额"}) from exc
    if not amount.is_finite():
        raise AppError("入手价格式不正确", fields={"price": "请输入有效金额"})
    if amount == Decimal(UNKNOWN_PRICE_CENTS):
        return UNKNOWN_PRICE_CENTS
    if amount < 0:
        raise AppError(
            "入手价不能为负数（-1 表示价格未知）",
            fields={"price": "请输入不小于 0 的金额，或填 -1 表示未知"},
        )
    cents = int(amount * 100)
    if amount != Decimal(cents) / Decimal(100):
        raise AppError("入手价最多保留两位小数", fields={"price": "最多两位小数"})
    if cents > MAX_PRICE_CENTS:
        raise AppError("入手价金额过大", fields={"price": "金额过大"})
    return cents


def parse_archived_flag(value: Any, field: str = "archived") -> bool:
    if isinstance(value, bool):
        return value
    if value in (0, 1):
        return bool(value)
    raise AppError(
        "归档状态值不正确",
        fields={field: "应为 true 或 false"},
    )


def parse_acquired_on(value: Any) -> str:
    raw = str(value or "").strip()
    if not raw:
        raise AppError("请选择入手时间", fields={"acquired_on": "请选择入手时间"})
    try:
        parsed = date.fromisoformat(raw)
    except ValueError as exc:
        raise AppError(
            "入手时间格式不正确",
            fields={"acquired_on": "请选择有效日期"},
        ) from exc
    if len(raw) != 10:
        raise AppError(
            "入手时间格式不正确",
            fields={"acquired_on": "请选择有效日期"},
        )
    if parsed > date.today():
        raise AppError(
            "入手时间不能晚于今天",
            fields={"acquired_on": "日期不能晚于今天"},
        )
    return parsed.isoformat()


class Database:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 8000")
        return conn

    @contextmanager
    def _transaction(self) -> Iterator[sqlite3.Connection]:
        conn = self._connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @contextmanager
    def _reader(self) -> Iterator[sqlite3.Connection]:
        conn = self._connect()
        try:
            yield conn
        finally:
            conn.close()

    def _initialize(self) -> None:
        schema = f"""
        CREATE TABLE IF NOT EXISTS app_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            next_serial INTEGER NOT NULL DEFAULT 1 CHECK(next_serial >= 1),
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS warehouses (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL DEFAULT '',
            archived_at TEXT,
            created_at TEXT NOT NULL
        );

        {ITEMS_TABLE_SQL.format(name="IF NOT EXISTS items")};

        CREATE TABLE IF NOT EXISTS movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id TEXT NOT NULL REFERENCES items(id),
            type TEXT NOT NULL CHECK(type IN ('inbound', 'outbound')),
            warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
            occurred_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_items_warehouse ON items(warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
        CREATE INDEX IF NOT EXISTS idx_movements_item ON movements(item_id, occurred_at);
        """
        conn = self._connect()
        try:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.executescript(schema)
            self._ensure_archive_columns(conn)
            self._ensure_price_schema(conn)
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_items_archived ON items(archived_at)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_warehouses_archived "
                "ON warehouses(archived_at)"
            )
            conn.execute(
                "INSERT OR IGNORE INTO app_meta(key, value) VALUES (?, ?)",
                ("warehouse_next_serial", "1"),
            )
            conn.execute(
                "INSERT OR IGNORE INTO app_meta(key, value) VALUES (?, ?)",
                ("schema_version", "1"),
            )
            conn.execute(
                "UPDATE app_meta SET value = '3' "
                "WHERE key = 'schema_version' AND value <> '3'"
            )
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def _ensure_archive_columns(conn: sqlite3.Connection) -> None:
        """Add the reversible archive flag to databases created before it existed."""
        for table in ("items", "warehouses"):
            columns = {
                row["name"]
                for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
            }
            if columns and "archived_at" not in columns:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN archived_at TEXT")
        conn.commit()

    @staticmethod
    def _ensure_price_schema(conn: sqlite3.Connection) -> None:
        """Rebuild old databases whose price column rejects the -1 sentinel."""
        row = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'items'"
        ).fetchone()
        if row is None:
            return
        table_sql = " ".join((row["sql"] or "").split())
        if "price_cents = -1" in table_sql:
            return

        conn.execute("PRAGMA foreign_keys = OFF")
        try:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(ITEMS_TABLE_SQL.format(name="items_new"))
            conn.execute(
                """
                INSERT INTO items_new(
                    id, category_code, serial, name, acquired_on, price_cents,
                    warehouse_id, status, outbound_at, archived_at,
                    created_at, updated_at
                )
                SELECT
                    id, category_code, serial, name, acquired_on, price_cents,
                    warehouse_id, status, outbound_at, archived_at,
                    created_at, updated_at
                FROM items
                """
            )
            conn.execute("DROP TABLE items")
            conn.execute("ALTER TABLE items_new RENAME TO items")
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_items_warehouse ON items(warehouse_id)"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)"
            )
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.execute("PRAGMA foreign_keys = ON")

    # ------------------------------------------------------------------ reads

    @staticmethod
    def _item_from_row(row: sqlite3.Row) -> dict[str, Any]:
        warehouse = None
        if row["warehouse_id"]:
            warehouse = {
                "id": row["warehouse_id"],
                "label": row["warehouse_label"] or "",
            }
        return {
            "id": row["id"],
            "category_code": row["category_code"],
            "category_name": row["category_name"],
            "name": row["name"],
            "acquired_on": row["acquired_on"],
            "price_cents": row["price_cents"],
            "warehouse": warehouse,
            "status": row["status"],
            "outbound_at": row["outbound_at"],
            "archived": bool(row["archived_at"]),
            "is_archived": bool(row["archived_at"]),
            "archived_at": row["archived_at"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }

    ITEM_SELECT = """
        SELECT
            i.*,
            c.name AS category_name,
            w.label AS warehouse_label
        FROM items i
        JOIN categories c ON c.code = i.category_code
        LEFT JOIN warehouses w ON w.id = i.warehouse_id
    """

    @staticmethod
    def _category_from_row(row: sqlite3.Row) -> dict[str, Any]:
        next_serial = row["next_serial"]
        return {
            "code": row["code"],
            "name": row["name"],
            "item_count": row["item_count"],
            "in_stock_count": row["in_stock_count"],
            "archived_item_count": row["archived_item_count"] or 0,
            "next_serial": next_serial,
            "next_id": (
                f"{row['code']}{next_serial:06d}"
                if next_serial <= MAX_SERIAL
                else None
            ),
            "created_at": row["created_at"],
        }

    @staticmethod
    def _warehouse_from_row(row: sqlite3.Row) -> dict[str, Any]:
        movement_count = row["movement_count"] or 0
        reference_count = row["reference_count"] or 0
        return {
            "id": row["id"],
            "label": row["label"] or "",
            "item_count": row["item_count"] or 0,
            "in_stock_count": row["in_stock_count"] or 0,
            "archived_item_count": row["archived_item_count"] or 0,
            "total_value_cents": row["total_value_cents"] or 0,
            "history_count": movement_count,
            "can_delete": movement_count == 0 and reference_count == 0,
            "can_archive": (row["in_stock_count"] or 0) == 0,
            "archived": bool(row["archived_at"]),
            "is_archived": bool(row["archived_at"]),
            "archived_at": row["archived_at"],
            "created_at": row["created_at"],
        }

    def get_overview(self, recent_limit: int = 5) -> dict[str, Any]:
        with self._reader() as conn:
            stats = conn.execute(
                """
                SELECT
                    COALESCE(SUM(CASE WHEN archived_at IS NULL THEN 1 ELSE 0 END), 0)
                        AS item_count,
                    COALESCE(SUM(
                        CASE WHEN archived_at IS NULL AND status = 'in_stock'
                             THEN 1 ELSE 0 END
                    ), 0) AS in_stock_count,
                    COALESCE(SUM(
                        CASE WHEN archived_at IS NULL AND status = 'out_of_stock'
                             THEN 1 ELSE 0 END
                    ), 0) AS out_of_stock_count,
                    COALESCE(SUM(CASE WHEN archived_at IS NOT NULL THEN 1 ELSE 0 END), 0)
                        AS archived_item_count,
                    COALESCE(SUM(
                        CASE
                            WHEN archived_at IS NULL
                                 AND status = 'in_stock'
                                 AND price_cents >= 0
                            THEN price_cents
                            ELSE 0
                        END
                    ), 0) AS in_stock_value_cents
                FROM items
                """
            ).fetchone()
            warehouse_count = conn.execute(
                "SELECT COUNT(*) FROM warehouses WHERE archived_at IS NULL"
            ).fetchone()[0]
            archived_warehouse_count = conn.execute(
                "SELECT COUNT(*) FROM warehouses WHERE archived_at IS NOT NULL"
            ).fetchone()[0]
            category_count = conn.execute(
                "SELECT COUNT(*) FROM categories"
            ).fetchone()[0]
            recent_rows = conn.execute(
                self.ITEM_SELECT
                + " WHERE i.archived_at IS NULL"
                + " ORDER BY i.created_at DESC, i.id DESC LIMIT ?",
                (recent_limit,),
            ).fetchall()
            warehouse_rows = conn.execute(
                self._warehouse_query()
                + " WHERE w.archived_at IS NULL"
                + " GROUP BY w.id ORDER BY w.id ASC LIMIT 3"
            ).fetchall()
            return {
                "stats": {
                    "item_count": stats["item_count"],
                    "in_stock_count": stats["in_stock_count"],
                    "out_of_stock_count": stats["out_of_stock_count"],
                    "archived_item_count": stats["archived_item_count"],
                    "in_stock_value_cents": stats["in_stock_value_cents"],
                    "warehouse_count": warehouse_count,
                    "archived_warehouse_count": archived_warehouse_count,
                    "category_count": category_count,
                },
                "recent_items": [self._item_from_row(row) for row in recent_rows],
                "warehouses": [
                    self._warehouse_from_row(row) for row in warehouse_rows
                ],
            }

    def list_categories(self) -> list[dict[str, Any]]:
        with self._reader() as conn:
            rows = conn.execute(
                """
                SELECT
                    c.*,
                    COUNT(i.id) AS item_count,
                    COALESCE(SUM(
                        CASE WHEN i.status = 'in_stock' AND i.archived_at IS NULL
                             THEN 1 ELSE 0 END
                    ), 0) AS in_stock_count,
                    COALESCE(SUM(CASE WHEN i.archived_at IS NOT NULL THEN 1 ELSE 0 END), 0)
                        AS archived_item_count
                FROM categories c
                LEFT JOIN items i ON i.category_code = c.code
                GROUP BY c.code
                ORDER BY c.created_at ASC, c.code ASC
                """
            ).fetchall()
            return [self._category_from_row(row) for row in rows]

    @staticmethod
    def _warehouse_query() -> str:
        return """
            SELECT
                w.id,
                w.label,
                w.archived_at,
                w.created_at,
                COUNT(CASE WHEN i.archived_at IS NULL THEN i.id END) AS item_count,
                COALESCE(SUM(
                    CASE WHEN i.status = 'in_stock' AND i.archived_at IS NULL
                         THEN 1 ELSE 0 END
                ), 0) AS in_stock_count,
                COALESCE(SUM(
                    CASE WHEN i.archived_at IS NOT NULL THEN 1 ELSE 0 END
                ), 0) AS archived_item_count,
                COUNT(i.id) AS reference_count,
                COALESCE(SUM(
                    CASE
                        WHEN i.status = 'in_stock'
                             AND i.archived_at IS NULL
                             AND i.price_cents >= 0
                        THEN i.price_cents
                        ELSE 0
                    END
                ), 0) AS total_value_cents,
                (
                    SELECT COUNT(*) FROM movements m
                    WHERE m.warehouse_id = w.id
                ) AS movement_count
            FROM warehouses w
            LEFT JOIN items i ON i.warehouse_id = w.id
        """

    def list_warehouses(self, *, archived: bool | None = False) -> list[dict[str, Any]]:
        condition = ""
        if archived is True:
            condition = " WHERE w.archived_at IS NOT NULL"
        elif archived is False:
            condition = " WHERE w.archived_at IS NULL"
        with self._reader() as conn:
            rows = conn.execute(
                self._warehouse_query()
                + condition
                + " GROUP BY w.id ORDER BY w.id ASC"
            ).fetchall()
            return [self._warehouse_from_row(row) for row in rows]

    def _get_warehouse_with_conn(
        self, conn: sqlite3.Connection, warehouse_id: str
    ) -> dict[str, Any]:
        row = conn.execute(
            self._warehouse_query()
            + " WHERE w.id = ? GROUP BY w.id",
            (warehouse_id,),
        ).fetchone()
        if row is None:
            raise AppError(
                "仓库不存在",
                status=404,
                code="warehouse_not_found",
            )
        items = conn.execute(
            self.ITEM_SELECT
            + " WHERE i.warehouse_id = ? AND i.status = 'in_stock'"
            + " AND i.archived_at IS NULL"
            + " ORDER BY i.updated_at DESC, i.id DESC",
            (warehouse_id,),
        ).fetchall()
        result = self._warehouse_from_row(row)
        result["items"] = [self._item_from_row(item) for item in items]
        return result

    def get_warehouse(self, warehouse_id: Any) -> dict[str, Any]:
        normalized = normalize_warehouse_id(warehouse_id)
        with self._reader() as conn:
            return self._get_warehouse_with_conn(conn, normalized)

    def _get_item_with_conn(
        self, conn: sqlite3.Connection, item_id: str, *, history: bool = True
    ) -> dict[str, Any]:
        row = conn.execute(
            self.ITEM_SELECT + " WHERE i.id = ?", (item_id,)
        ).fetchone()
        if row is None:
            raise AppError("物品不存在", status=404, code="item_not_found")
        item = self._item_from_row(row)
        if history:
            movement_rows = conn.execute(
                """
                SELECT
                    m.type,
                    m.occurred_at,
                    m.warehouse_id,
                    w.label AS warehouse_label
                FROM movements m
                JOIN warehouses w ON w.id = m.warehouse_id
                WHERE m.item_id = ?
                ORDER BY m.occurred_at DESC, m.id DESC
                """,
                (item_id,),
            ).fetchall()
            item["movements"] = [
                {
                    "type": movement["type"],
                    "occurred_at": movement["occurred_at"],
                    "warehouse": {
                        "id": movement["warehouse_id"],
                        "label": movement["warehouse_label"] or "",
                    },
                }
                for movement in movement_rows
            ]
        return item

    def get_item(self, item_id: Any) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        with self._reader() as conn:
            return self._get_item_with_conn(conn, normalized)

    def list_items(
        self,
        *,
        status: str | None = None,
        category: str | None = None,
        query: str | None = None,
        archived: bool | None = False,
    ) -> list[dict[str, Any]]:
        conditions: list[str] = []
        params: list[Any] = []
        if status == "archived":
            archived = True
            status = None
        if status in {"in_stock", "out_of_stock"}:
            conditions.append("i.status = ?")
            params.append(status)
        elif status:
            raise AppError("状态筛选值不正确", fields={"status": "无效状态"})
        if archived is True:
            conditions.append("i.archived_at IS NOT NULL")
        elif archived is False:
            conditions.append("i.archived_at IS NULL")
        if category:
            normalized_category = str(category).strip().upper()
            if not CATEGORY_CODE_RE.fullmatch(normalized_category):
                raise AppError("分类筛选值不正确", fields={"category": "无效分类"})
            conditions.append("i.category_code = ?")
            params.append(normalized_category)
        if query:
            search = str(query).strip()
            if len(search) > 100:
                raise AppError("搜索内容过长", fields={"q": "最多 100 个字符"})
            if search:
                conditions.append("(i.id LIKE ? OR i.name LIKE ?)")
                like = f"%{search}%"
                params.extend([like, like])
        sql = self.ITEM_SELECT
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY i.created_at DESC, i.id DESC"
        with self._reader() as conn:
            rows = conn.execute(sql, params).fetchall()
            return [self._item_from_row(row) for row in rows]

    # ----------------------------------------------------------------- writes

    def create_category(self, payload: dict[str, Any]) -> dict[str, Any]:
        code = normalize_category_code(payload.get("code"))
        name = _clean_text(
            payload.get("name") or code, "分类名称", required=False, max_len=40
        ) or code
        created_at = utc_now()
        with self._transaction() as conn:
            try:
                conn.execute(
                    "INSERT INTO categories(code, name, next_serial, created_at) VALUES (?, ?, 1, ?)",
                    (code, name, created_at),
                )
            except sqlite3.IntegrityError as exc:
                raise AppError(
                    f"分类 {code} 已存在，请换一个代号",
                    status=409,
                    code="category_exists",
                    fields={"code": "该分类代号已被使用"},
                ) from exc
            row = conn.execute(
                """
                SELECT c.*, 0 AS item_count, 0 AS in_stock_count,
                       0 AS archived_item_count
                FROM categories c WHERE c.code = ?
                """,
                (code,),
            ).fetchone()
            return self._category_from_row(row)

    def delete_category(self, code: Any) -> dict[str, Any]:
        normalized = normalize_category_code(code)
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT code FROM categories WHERE code = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError(
                    "分类不存在",
                    status=404,
                    code="category_not_found",
                )
            item_count = conn.execute(
                "SELECT COUNT(*) FROM items WHERE category_code = ?",
                (normalized,),
            ).fetchone()[0]
            if item_count:
                raise AppError(
                    f"分类 {normalized} 下还有 {item_count} 件物品，不能删除",
                    status=409,
                    code="category_not_empty",
                )
            conn.execute("DELETE FROM categories WHERE code = ?", (normalized,))
            return {"code": normalized}

    def create_warehouse(self, payload: dict[str, Any]) -> dict[str, Any]:
        label = _clean_text(
            payload.get("label") or payload.get("name") or "",
            "仓库名称",
            required=False,
            max_len=40,
        )
        created_at = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT value FROM app_meta WHERE key = 'warehouse_next_serial'"
            ).fetchone()
            next_serial = int(row["value"]) if row else 1
            if next_serial > MAX_SERIAL:
                raise AppError(
                    "仓库编号已用尽",
                    status=409,
                    code="warehouse_sequence_exhausted",
                )
            warehouse_id = f"STR{next_serial:06d}"
            conn.execute(
                "UPDATE app_meta SET value = ? WHERE key = 'warehouse_next_serial'",
                (str(next_serial + 1),),
            )
            conn.execute(
                "INSERT INTO warehouses(id, label, created_at) VALUES (?, ?, ?)",
                (warehouse_id, label, created_at),
            )
            return {
                "id": warehouse_id,
                "label": label,
                "item_count": 0,
                "in_stock_count": 0,
                "archived_item_count": 0,
                "total_value_cents": 0,
                "history_count": 0,
                "can_delete": True,
                "can_archive": True,
                "archived": False,
                "is_archived": False,
                "archived_at": None,
                "created_at": created_at,
            }

    def update_warehouse(
        self, warehouse_id: Any, payload: dict[str, Any]
    ) -> dict[str, Any]:
        normalized = normalize_warehouse_id(warehouse_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM warehouses WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError(
                    "仓库不存在", status=404, code="warehouse_not_found"
                )
            label = row["label"]
            if "label" in payload or "name" in payload:
                label = _clean_text(
                    payload.get("label")
                    if "label" in payload
                    else payload.get("name"),
                    "仓库名称",
                    required=False,
                    max_len=40,
                )
            archived_at = row["archived_at"]
            if "archived" in payload:
                wants_archived = parse_archived_flag(payload.get("archived"))
                if wants_archived and not archived_at:
                    in_stock_count = conn.execute(
                        """
                        SELECT COUNT(*) FROM items
                        WHERE warehouse_id = ? AND status = 'in_stock'
                              AND archived_at IS NULL
                        """,
                        (normalized,),
                    ).fetchone()[0]
                    if in_stock_count:
                        raise AppError(
                            f"仓库中还有 {in_stock_count} 件在库物品，"
                            "请先出库或归档这些物品",
                            status=409,
                            code="warehouse_not_empty",
                        )
                archived_at = (archived_at or now) if wants_archived else None
            conn.execute(
                """
                UPDATE warehouses
                SET label = ?, archived_at = ?
                WHERE id = ?
                """,
                (label, archived_at, normalized),
            )
            return self._get_warehouse_with_conn(conn, normalized)

    def archive_warehouse(self, warehouse_id: Any) -> dict[str, Any]:
        normalized = normalize_warehouse_id(warehouse_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM warehouses WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError(
                    "仓库不存在", status=404, code="warehouse_not_found"
                )
            if not row["archived_at"]:
                in_stock_count = conn.execute(
                    """
                    SELECT COUNT(*) FROM items
                    WHERE warehouse_id = ? AND status = 'in_stock'
                          AND archived_at IS NULL
                    """,
                    (normalized,),
                ).fetchone()[0]
                if in_stock_count:
                    raise AppError(
                        f"仓库中还有 {in_stock_count} 件在库物品，"
                        "请先出库或归档这些物品",
                        status=409,
                        code="warehouse_not_empty",
                    )
                conn.execute(
                    """
                    UPDATE warehouses
                    SET archived_at = ?
                    WHERE id = ?
                    """,
                    (now, normalized),
                )
            return self._get_warehouse_with_conn(conn, normalized)

    def unarchive_warehouse(self, warehouse_id: Any) -> dict[str, Any]:
        normalized = normalize_warehouse_id(warehouse_id)
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM warehouses WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError(
                    "仓库不存在", status=404, code="warehouse_not_found"
                )
            if row["archived_at"]:
                conn.execute(
                    "UPDATE warehouses SET archived_at = NULL WHERE id = ?",
                    (normalized,),
                )
            return self._get_warehouse_with_conn(conn, normalized)

    def delete_warehouse(self, warehouse_id: Any) -> dict[str, Any]:
        normalized = normalize_warehouse_id(warehouse_id)
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM warehouses WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError(
                    "仓库不存在", status=404, code="warehouse_not_found"
                )
            movement_count = conn.execute(
                "SELECT COUNT(*) FROM movements WHERE warehouse_id = ?",
                (normalized,),
            ).fetchone()[0]
            item_count = conn.execute(
                "SELECT COUNT(*) FROM items WHERE warehouse_id = ?",
                (normalized,),
            ).fetchone()[0]
            if movement_count or item_count:
                raise AppError(
                    "这个仓库曾有物品进入，不能删除；可以改为归档保留记录",
                    status=409,
                    code="warehouse_in_use",
                )
            conn.execute("DELETE FROM warehouses WHERE id = ?", (normalized,))
            return {"id": normalized, "label": row["label"] or ""}

    def create_item(self, payload: dict[str, Any]) -> dict[str, Any]:
        code = normalize_category_code(payload.get("category_code") or payload.get("category"))
        name = _clean_text(payload.get("name"), "物品名称", required=True, max_len=100)
        acquired_on = parse_acquired_on(payload.get("acquired_on"))
        price_cents = parse_price_cents(payload.get("price"))
        warehouse_id = normalize_warehouse_id(payload.get("warehouse_id"))
        now = utc_now()

        with self._transaction() as conn:
            category = conn.execute(
                "SELECT * FROM categories WHERE code = ?", (code,)
            ).fetchone()
            if category is None:
                raise AppError(
                    "分类不存在，请先创建分类",
                    status=404,
                    code="category_not_found",
                    fields={"category_code": "分类不存在"},
                )
            warehouse_row = conn.execute(
                "SELECT archived_at FROM warehouses WHERE id = ?", (warehouse_id,)
            ).fetchone()
            if warehouse_row is None:
                raise AppError(
                    "仓库不存在",
                    status=404,
                    code="warehouse_not_found",
                    fields={"warehouse_id": "仓库不存在"},
                )
            if warehouse_row["archived_at"]:
                raise AppError(
                    "该仓库已归档，请先取消归档再入库",
                    status=409,
                    code="warehouse_archived",
                    fields={"warehouse_id": "仓库已归档"},
                )
            serial = int(category["next_serial"])
            if serial > MAX_SERIAL:
                raise AppError(
                    f"分类 {code} 的编号已用尽",
                    status=409,
                    code="item_sequence_exhausted",
                )
            item_id = f"{code}{serial:06d}"
            conn.execute(
                "UPDATE categories SET next_serial = ? WHERE code = ?",
                (serial + 1, code),
            )
            conn.execute(
                """
                INSERT INTO items(
                    id, category_code, serial, name, acquired_on, price_cents,
                    warehouse_id, status, outbound_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_stock', NULL, ?, ?)
                """,
                (
                    item_id,
                    code,
                    serial,
                    name,
                    acquired_on,
                    price_cents,
                    warehouse_id,
                    now,
                    now,
                ),
            )
            conn.execute(
                """
                INSERT INTO movements(item_id, type, warehouse_id, occurred_at)
                VALUES (?, 'inbound', ?, ?)
                """,
                (item_id, warehouse_id, now),
            )
            return self._get_item_with_conn(conn, item_id)

    def update_item(self, item_id: Any, payload: dict[str, Any]) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM items WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError("物品不存在", status=404, code="item_not_found")
            name = (
                _clean_text(payload.get("name"), "物品名称", required=True, max_len=100)
                if "name" in payload
                else row["name"]
            )
            acquired_on = (
                parse_acquired_on(payload.get("acquired_on"))
                if "acquired_on" in payload
                else row["acquired_on"]
            )
            price_cents = (
                parse_price_cents(payload.get("price"))
                if "price" in payload
                else row["price_cents"]
            )
            archived_at = row["archived_at"]
            if "archived" in payload:
                if parse_archived_flag(payload.get("archived")):
                    archived_at = archived_at or now
                else:
                    archived_at = None
            conn.execute(
                """
                UPDATE items
                SET name = ?, acquired_on = ?, price_cents = ?,
                    archived_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (name, acquired_on, price_cents, archived_at, now, normalized),
            )
            return self._get_item_with_conn(conn, normalized)

    def archive_item(self, item_id: Any) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM items WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError("物品不存在", status=404, code="item_not_found")
            if not row["archived_at"]:
                conn.execute(
                    """
                    UPDATE items
                    SET archived_at = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (now, now, normalized),
                )
            return self._get_item_with_conn(conn, normalized)

    def unarchive_item(self, item_id: Any) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM items WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError("物品不存在", status=404, code="item_not_found")
            if row["archived_at"]:
                conn.execute(
                    """
                    UPDATE items
                    SET archived_at = NULL, updated_at = ?
                    WHERE id = ?
                    """,
                    (now, normalized),
                )
            return self._get_item_with_conn(conn, normalized)

    def outbound_item(self, item_id: Any) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM items WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError("物品不存在", status=404, code="item_not_found")
            if row["archived_at"]:
                raise AppError(
                    "该物品已归档，请先取消归档再办理出库",
                    status=409,
                    code="item_archived",
                )
            if row["status"] != "in_stock" or not row["warehouse_id"]:
                raise AppError(
                    "该物品当前不在仓库中，无需出库",
                    status=409,
                    code="item_already_out",
                )
            old_warehouse = row["warehouse_id"]
            conn.execute(
                """
                UPDATE items
                SET warehouse_id = NULL, status = 'out_of_stock',
                    outbound_at = ?, updated_at = ?
                WHERE id = ?
                """,
                (now, now, normalized),
            )
            conn.execute(
                """
                INSERT INTO movements(item_id, type, warehouse_id, occurred_at)
                VALUES (?, 'outbound', ?, ?)
                """,
                (normalized, old_warehouse, now),
            )
            return self._get_item_with_conn(conn, normalized)

    def inbound_item(self, item_id: Any, warehouse_id: Any) -> dict[str, Any]:
        normalized = normalize_item_id(item_id)
        normalized_warehouse = normalize_warehouse_id(warehouse_id)
        now = utc_now()
        with self._transaction() as conn:
            row = conn.execute(
                "SELECT * FROM items WHERE id = ?", (normalized,)
            ).fetchone()
            if row is None:
                raise AppError("物品不存在", status=404, code="item_not_found")
            warehouse_row = conn.execute(
                "SELECT archived_at FROM warehouses WHERE id = ?",
                (normalized_warehouse,),
            ).fetchone()
            if warehouse_row is None:
                raise AppError(
                    "仓库不存在",
                    status=404,
                    code="warehouse_not_found",
                    fields={"warehouse_id": "仓库不存在"},
                )
            if warehouse_row["archived_at"]:
                raise AppError(
                    "该仓库已归档，请先取消归档再入库",
                    status=409,
                    code="warehouse_archived",
                    fields={"warehouse_id": "仓库已归档"},
                )
            if row["archived_at"]:
                raise AppError(
                    "该物品已归档，请先取消归档再入库",
                    status=409,
                    code="item_archived",
                )
            if row["status"] == "in_stock":
                raise AppError(
                    f"物品已在仓库 {row['warehouse_id']} 中，请先办理出库",
                    status=409,
                    code="item_already_in_stock",
                )
            conn.execute(
                """
                UPDATE items
                SET warehouse_id = ?, status = 'in_stock',
                    outbound_at = NULL, updated_at = ?
                WHERE id = ?
                """,
                (normalized_warehouse, now, normalized),
            )
            conn.execute(
                """
                INSERT INTO movements(item_id, type, warehouse_id, occurred_at)
                VALUES (?, 'inbound', ?, ?)
                """,
                (normalized, normalized_warehouse, now),
            )
            return self._get_item_with_conn(conn, normalized)
