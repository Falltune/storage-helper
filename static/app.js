(function () {
  "use strict";

  // ------------------------------------------------------------------ basics

  const app = document.getElementById("app");
  const dialogLayer = document.getElementById("dialog-layer");
  const toastLayer = document.getElementById("toast-layer");

  const NAV_ITEMS = [
    { href: "/", label: "总览", key: "home" },
    { href: "/items", label: "物品", key: "items" },
    { href: "/warehouses", label: "仓库", key: "warehouses" },
    { href: "/categories", label: "分类", key: "categories" },
  ];

  const ICONS = {
    archive:
      '<rect x="3.5" y="4" width="17" height="4.5" rx="1.2"/><path d="M5.2 8.5V19a1.5 1.5 0 0 0 1.5 1.5h10.6a1.5 1.5 0 0 0 1.5-1.5V8.5"/><path d="M9.5 12.5h5"/>',
    restore:
      '<path d="M4.5 10a7.6 7.6 0 1 1 2.2 6.2"/><path d="M4.5 4.5V10h5.5"/><path d="M12 8.5v4.2l2.8 1.6"/>',
    box:
      '<path d="m12 3 8.2 4.5v9L12 21l-8.2-4.5v-9L12 3Z"/><path d="m3.8 7.5 8.2 4.4 8.2-4.4"/><path d="M12 11.9v9.1"/>',
    layers:
      '<path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    tag:
      '<path d="M20.6 13.4 11 3.8H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z"/><circle cx="7.6" cy="7.6" r="1.15"/>',
    search:
      '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 4.7 4.7"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    arrowRight: '<path d="M4 12h15"/><path d="m13.5 6 6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    chevronLeft: '<path d="m14.5 5-7 7 7 7"/>',
    chevronRight: '<path d="m9.5 5 7 7-7 7"/>',
    calendar:
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M7.5 3v4"/><path d="M16.5 3v4"/><path d="M3.5 9.5h17"/>',
    coin:
      '<circle cx="12" cy="12" r="8.5"/><path d="M9 8.5l3 3.2 3-3.2"/><path d="M12 11.7V17"/><path d="M9.2 13.3H15"/><path d="M9.2 15.4H15"/>',
    pin:
      '<path d="M19 10.4c0 5-7 10.1-7 10.1s-7-5.1-7-10.1a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10.2" r="2.4"/>',
    edit:
      '<path d="m4 20 4.2-.9L19.4 7.9a2.1 2.1 0 0 0 0-3l-.3-.3a2.1 2.1 0 0 0-3 0L5 15.8 4 20Z"/><path d="m14.8 6.2 3 3"/>',
    close: '<path d="m6 6 12 12"/><path d="M18 6 6 18"/>',
    check: '<path d="m4.5 12.5 4.7 4.7L19.8 6.5"/>',
    alert:
      '<path d="M10.3 4.2 2.8 17.1A1.8 1.8 0 0 0 4.4 20h15.2a1.8 1.8 0 0 0 1.6-2.9L13.7 4.2a1.95 1.95 0 0 0-3.4 0Z"/><path d="M12 9v4.6"/><path d="M12 17.1h.01"/>',
    outbound:
      '<path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5"/><path d="M2.8 6.5 4.4 4h15.2l1.6 2.5V9H2.8V6.5Z"/><path d="M12 17V11"/><path d="m8.8 14 3.2-3.2L15.2 14"/>',
    inbound:
      '<path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5"/><path d="M2.8 6.5 4.4 4h15.2l1.6 2.5V9H2.8V6.5Z"/><path d="M12 11v6"/><path d="m8.8 13.8 3.2 3.2 3.2-3.2"/>',
    clock:
      '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.5 2"/>',
    home:
      '<path d="m3 10.5 9-7.2 9 7.2"/><path d="M5.2 9.2V20h13.6V9.2"/><path d="M9.4 20v-6.3h5.2V20"/>',
    hash: '<path d="M9.5 3.5 7.8 20.5"/><path d="M16.2 3.5l-1.7 17"/><path d="M4 8.5h16"/><path d="M3.5 15.5h16"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    warningTriangle:
      '<path d="M10.3 4.2 2.8 17.1A1.8 1.8 0 0 0 4.4 20h15.2a1.8 1.8 0 0 0 1.6-2.9L13.7 4.2a1.95 1.95 0 0 0-3.4 0Z"/><path d="M12 9v4.6"/><path d="M12 17.1h.01"/>',
    arrowDown: '<path d="M12 4v15"/><path d="m6 13.5 6 6 6-6"/>',
    trash:
      '<path d="M4 7h16"/><path d="M9.5 7V4.8h5V7"/><path d="M6.5 7 7.4 20h9.2l.9-13"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  };

  let uidCounter = 0;
  let routeRun = 0;
  let pageAbort = null;

  function uid(prefix) {
    uidCounter += 1;
    return prefix + "-" + uidCounter;
  }

  function icon(name, className) {
    const paths = ICONS[name] || ICONS.box;
    return (
      '<svg class="' +
      (className || "icon") +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      paths +
      "</svg>"
    );
  }

  function h(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  }

  function formatPrice(cents) {
    if (Number(cents) === -1) return "未知价格";
    const amount = Number(cents || 0) / 100;
    return (
      "¥" +
      amount.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function formatDate(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "—";
    const parts = isoDate.split("-");
    return parts[0] + "." + parts[1] + "." + parts[2];
  }

  function formatDateLong(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "—";
    const parts = isoDate.split("-");
    return parts[0] + " 年 " + Number(parts[1]) + " 月 " + Number(parts[2]) + " 日";
  }

  function formatDateTime(isoValue) {
    if (!isoValue) return "—";
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) return "—";
    const pad = function (value) {
      return String(value).padStart(2, "0");
    };
    return (
      date.getFullYear() +
      "." +
      pad(date.getMonth() + 1) +
      "." +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function todayISO() {
    const date = new Date();
    const pad = function (value) {
      return String(value).padStart(2, "0");
    };
    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate())
    );
  }

  function itemPath(id) {
    return "/" + String(id).toLowerCase();
  }

  function warehousePath(id) {
    return "/" + String(id).toLowerCase();
  }

  function categoryTone(code) {
    return (
      1 +
      (String(code)
        .split("")
        .reduce(function (sum, char) {
          return sum + char.charCodeAt(0);
        }, 0) %
        4)
    );
  }

  function statusBadge(item) {
    if (item.archived) {
      return (
        '<span class="status-badge is-archived"><span class="status-pip"></span>已归档</span>'
      );
    }
    const inStock = item.status === "in_stock";
    return (
      '<span class="status-badge ' +
      (inStock ? "is-in-stock" : "is-out") +
      '"><span class="status-pip"></span>' +
      (inStock ? "在库" : "已出库") +
      "</span>"
    );
  }

  function warehouseLabel(warehouse) {
    return warehouse && warehouse.label ? String(warehouse.label).trim() : "";
  }

  function warehouseTitle(warehouse) {
    return warehouseLabel(warehouse) || (warehouse ? warehouse.id : "");
  }

  function currentLocationText(item) {
    if (!item.warehouse) return "已出库";
    const label = warehouseLabel(item.warehouse);
    return label ? label + " · " + item.warehouse.id : item.warehouse.id;
  }

  function pluralItems(count) {
    return String(count) + " 件物品";
  }

  // ------------------------------------------------------------------ api

  class ApiError extends Error {
    constructor(message, options) {
      super(message);
      this.name = "ApiError";
      this.status = (options && options.status) || 0;
      this.code = (options && options.code) || "request_failed";
      this.fields = (options && options.fields) || {};
    }
  }

  async function api(path, options) {
    const settings = options || {};
    const headers = { Accept: "application/json" };
    const method = settings.method || "GET";
    const sendsBody = method !== "GET" && method !== "DELETE";
    if (sendsBody) {
      headers["Content-Type"] = "application/json";
    }
    let response;
    try {
      response = await fetch(path, {
        method: method,
        headers: headers,
        body: sendsBody
          ? JSON.stringify(settings.body === undefined ? {} : settings.body)
          : undefined,
        signal: settings.signal,
      });
    } catch (error) {
      if (error && error.name === "AbortError") throw error;
      throw new ApiError("无法连接到后端服务，请确认本地服务正在运行。");
    }
    let payload = null;
    const raw = await response.text();
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        throw new ApiError("服务器返回了无法识别的内容。", {
          status: response.status,
        });
      }
    }
    if (!response.ok) {
      const apiError = (payload && payload.error) || {};
      throw new ApiError(apiError.message || "请求没有完成，请稍后再试。", {
        status: response.status,
        code: apiError.code,
        fields: apiError.fields,
      });
    }
    return payload || {};
  }

  function isAbort(error) {
    return error && error.name === "AbortError";
  }

  function setItemArchived(itemId, archived) {
    return api(
      "/api/items/" +
        encodeURIComponent(itemId) +
        (archived ? "/archive" : "/unarchive"),
      { method: "POST", body: {} }
    );
  }

  function setWarehouseArchived(warehouseId, archived) {
    return api(
      "/api/warehouses/" +
        encodeURIComponent(warehouseId) +
        (archived ? "/archive" : "/unarchive"),
      { method: "POST", body: {} }
    );
  }

  // ------------------------------------------------------------------ shell

  function siteHeader(active) {
    const nav = NAV_ITEMS.map(function (item) {
      const isActive = item.key === active;
      return (
        '<a class="nav-link' +
        (isActive ? " is-active" : "") +
        '" href="' +
        item.href +
        '" data-link' +
        (isActive ? ' aria-current="page"' : "") +
        ">" +
        item.label +
        "</a>"
      );
    }).join("");
    return (
      '<header class="site-header">' +
      '<div class="header-inner">' +
      '<a class="brand" href="/" data-link aria-label="藏物 Archive 首页">' +
      '<span class="brand-seal">藏</span>' +
      '<span class="brand-words"><span class="brand-name">藏物</span><span class="brand-sub">PERSONAL ARCHIVE</span></span>' +
      "</a>" +
      '<nav class="site-nav" aria-label="主导航">' +
      nav +
      "</nav>" +
      '<div class="header-status"><span class="header-status-dot"></span><span>本机档案</span></div>' +
      "</div>" +
      "</header>"
    );
  }

  function siteFooter() {
    return (
      '<footer class="site-footer">' +
      '<div class="footer-inner">' +
      '<span class="footer-brand">藏物 <span>ARCHIVE</span></span>' +
      '<span class="footer-note">一物一档 · 数据保存在本机</span>' +
      '<span class="footer-year">' +
      new Date().getFullYear() +
      "</span>" +
      "</div>" +
      "</footer>"
    );
  }

  function renderShell(active, content, options) {
    const opts = options || {};
    app.innerHTML =
      '<a class="skip-link" href="#main-content">跳到主要内容</a>' +
      siteHeader(active) +
      '<main id="main-content" class="site-main' +
      (opts.wide ? " site-main-wide" : "") +
      '" tabindex="-1">' +
      content +
      "</main>" +
      siteFooter();
  }

  function setTitle(parts) {
    document.title = parts
      ? parts + " · 藏物 Archive"
      : "藏物 Archive · 个人物品档案";
  }

  function navigate(path, options) {
    const opts = options || {};
    const current = window.location.pathname + window.location.search + window.location.hash;
    if (path === current) {
      renderRoute({ scroll: opts.scroll !== false });
      return;
    }
    if (opts.replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    renderRoute({ scroll: opts.scroll !== false });
  }

  function refreshCurrentPage(options) {
    const opts = options || {};
    renderRoute({ scroll: opts.scroll === true, refresh: true });
  }

  function parseRoute(pathname) {
    const path = pathname.replace(/\/+$/, "") || "/";
    if (path === "/") return { type: "home" };
    if (path === "/items") return { type: "items" };
    if (path === "/warehouses") return { type: "warehouses" };
    if (path === "/categories") return { type: "categories" };
    const match = /^\/([A-Za-z]{3})(\d{6})$/.exec(path);
    if (match) {
      const prefix = match[1].toUpperCase();
      const id = prefix + match[2];
      if (prefix === "STR") {
        return { type: "warehouse", id: id };
      }
      return { type: "item", id: id };
    }
    return { type: "notfound", path: path };
  }

  function activeForRoute(route) {
    if (route.type === "item") return "items";
    if (route.type === "warehouse") return "warehouses";
    if (route.type === "home") return "home";
    if (route.type === "items") return "items";
    if (route.type === "warehouses") return "warehouses";
    if (route.type === "categories") return "categories";
    return "";
  }

  function activeTabForPath() {
    return activeForRoute(parseRoute(window.location.pathname));
  }

  // ---------------------------------------------------------------- loading

  function loadingPage(active, variant) {
    const cards =
      variant === "detail"
        ? '<div class="skeleton skeleton-detail"></div>'
        : Array.from({ length: 4 })
            .map(function () {
              return '<div class="skeleton skeleton-card"></div>';
            })
            .join("");
    renderShell(
      active,
      '<div class="page page-loading" aria-busy="true">' +
        '<div class="skeleton skeleton-eyebrow"></div>' +
        '<div class="skeleton skeleton-title"></div>' +
        (variant === "detail" ? "" : '<div class="skeleton skeleton-meta"></div>') +
        '<div class="skeleton-grid">' +
        cards +
        "</div>" +
        '<span class="sr-only">正在加载档案</span>' +
        "</div>"
    );
  }

  function renderLoadError(active, error, retry) {
    const message =
      error && error.message ? error.message : "加载档案时发生了一个错误。";
    renderShell(
      active,
      '<section class="state-page">' +
        '<div class="state-emblem is-error">' +
        icon("alert") +
        "</div>" +
        '<p class="eyebrow">SOMETHING WENT WRONG</p>' +
        "<h1>档案暂时打不开</h1>" +
        '<p class="state-copy">' +
        h(message) +
        "</p>" +
        '<div class="state-actions">' +
        '<button class="button button-primary" type="button" id="retry-page">重新加载</button>' +
        '<a class="button button-secondary" href="/" data-link>回到总览</a>' +
        "</div>" +
        "</section>"
    );
    const retryButton = document.getElementById("retry-page");
    if (retryButton) {
      retryButton.addEventListener("click", retry || function () { renderRoute(); });
    }
  }

  function renderRecordNotFound(active, kind, recordId) {
    const isWarehouse = kind === "warehouse";
    const categoryCode = isWarehouse
      ? ""
      : String(recordId || "").slice(0, 3).toUpperCase();
    renderShell(
      active,
      '<section class="state-page">' +
        '<div class="state-code">' +
        (isWarehouse ? "STR" : "ID") +
        "</div>" +
        '<p class="eyebrow">RECORD NOT FOUND</p>' +
        "<h1>" +
        (isWarehouse ? "没有找到这个仓库" : "没有找到这件物品") +
        "</h1>" +
        '<p class="state-copy">编号 <span class="mono">' +
        h(recordId || "") +
        "</span> 不在现有档案中。" +
        (isWarehouse
          ? "请检查链接，或从目录重新进入。"
          : "请检查链接，也可以直接补录一件物品；若分类 " +
            h(categoryCode) +
            " 尚未建立，会先引导你创建分类。") +
        "</p>" +
        '<div class="state-actions">' +
        (isWarehouse
          ? '<a class="button button-primary" href="/warehouses" data-link>查看所有仓库</a>'
          : '<button class="button button-primary" type="button" id="add-missing-item">' +
            icon("plus") +
            "添加物品</button>" +
            '<a class="button button-secondary" href="/items" data-link>查看物品目录</a>') +
        (isWarehouse
          ? '<a class="button button-secondary" href="/" data-link>回到总览</a>'
          : '<a class="button button-quiet" href="/" data-link>回到总览</a>') +
        "</div>" +
        "</section>"
    );
    if (!isWarehouse) {
      const addButton = document.getElementById("add-missing-item");
      if (addButton) {
        addButton.addEventListener("click", function () {
          openItemCreateModal({ categoryCode: categoryCode });
        });
      }
    }
  }

  function renderRouteNotFound(route) {
    setTitle("页面不存在");
    renderShell(
      "",
      '<section class="state-page">' +
        '<div class="state-code">404</div>' +
        '<p class="eyebrow">OFF THE RECORD</p>' +
        "<h1>这一页不在档案里</h1>" +
        '<p class="state-copy">地址 <span class="mono">' +
        h(route.path || "") +
        "</span> 没有对应的页面。</p>" +
        '<div class="state-actions"><a class="button button-primary" href="/" data-link>回到总览</a></div>' +
        "</section>"
    );
  }

  // ------------------------------------------------------------------- home

  function homeEmptyLedger() {
    return (
      '<div class="ledger-empty">' +
      '<div class="ledger-empty-mark">' +
      icon("archive") +
      "</div>" +
      '<p class="ledger-empty-title">等待第一份档案</p>' +
      '<p class="ledger-empty-copy">建立仓库、创建分类，然后把第一件物品收入档案。</p>' +
      '<a class="text-arrow" href="/warehouses" data-link>从仓库开始 ' +
      icon("arrowRight") +
      "</a>" +
      "</div>"
    );
  }

  function homeLatestTicket(item) {
    return (
      '<article class="ledger-ticket">' +
      '<div class="ticket-head"><span>LATEST RECORD</span>' +
      statusBadge(item) +
      "</div>" +
      '<a class="ticket-id" href="' +
      itemPath(item.id) +
      '" data-link>' +
      h(item.id) +
      "</a>" +
      '<h2 class="ticket-name">' +
      h(item.name) +
      "</h2>" +
      '<div class="ticket-facts">' +
      '<div><span>类别</span><strong>' +
      h(item.category_name) +
      "</strong></div>" +
      '<div><span>入手</span><strong>' +
      formatDate(item.acquired_on) +
      "</strong></div>" +
      '<div><span>位置</span><strong' +
      (item.warehouse && warehouseLabel(item.warehouse) ? "" : ' class="mono"') +
      ">" +
      h(item.warehouse ? warehouseTitle(item.warehouse) : "已出库") +
      "</strong>" +
      (item.warehouse && warehouseLabel(item.warehouse)
        ? '<i class="ticket-code mono">' + h(item.warehouse.id) + "</i>"
        : "") +
      "</div>" +
      "</div>" +
      '<div class="ticket-rule"><span></span></div>' +
      '<a class="ticket-link" href="' +
      itemPath(item.id) +
      '" data-link>查看完整档案 ' +
      icon("arrowUpRight") +
      "</a>" +
      '<div class="ticket-barcode" aria-hidden="true">' +
      Array.from({ length: 28 })
        .map(function (_, index) {
          return '<i style="--w:' + (index % 4 === 0 ? 3 : index % 3 === 0 ? 1 : 2) + 'px"></i>';
        })
        .join("") +
      "</div>" +
      "</article>"
    );
  }

  function homeMetric(index, value, label, note) {
    return (
      '<div class="metric-card">' +
      '<span class="metric-index">' +
      String(index).padStart(2, "0") +
      "</span>" +
      '<div class="metric-value">' +
      value +
      "</div>" +
      '<div class="metric-label">' +
      label +
      "</div>" +
      '<div class="metric-note">' +
      note +
      "</div>" +
      "</div>"
    );
  }

  function recentItemRow(item) {
    return (
      '<a class="recent-row" href="' +
      itemPath(item.id) +
      '" data-link>' +
      '<span class="recent-category tone-' +
      categoryTone(item.category_code) +
      '">' +
      h(item.category_code) +
      "</span>" +
      '<span class="recent-main"><strong>' +
      h(item.name) +
      '</strong><small class="mono">' +
      h(item.id) +
      " · " +
      h(item.category_name) +
      "</small></span>" +
      '<span class="recent-date">' +
      formatDate(item.acquired_on) +
      "</span>" +
      '<span class="recent-place">' +
      icon("pin") +
      h(item.warehouse ? warehouseTitle(item.warehouse) : "已出库") +
      "</span>" +
      '<span class="recent-arrow">' +
      icon("arrowUpRight") +
      "</span>" +
      "</a>"
    );
  }

  function homeWarehouseRow(warehouse) {
    return (
      '<a class="mini-warehouse" href="' +
      warehousePath(warehouse.id) +
      '" data-link>' +
      '<span class="mini-warehouse-icon">' +
      icon("box") +
      "</span>" +
      '<span class="mini-warehouse-main"><strong>' +
      h(warehouseTitle(warehouse)) +
      "</strong>" +
      (warehouseLabel(warehouse)
        ? '<small class="mono">' + h(warehouse.id) + "</small>"
        : "") +
      "</span>" +
      '<span class="mini-warehouse-count">' +
      pluralItems(warehouse.item_count) +
      "</span>" +
      '<span class="mini-warehouse-arrow">' +
      icon("arrowRight") +
      "</span>" +
      "</a>"
    );
  }

  function renderHome(data) {
    const stats = data.stats;
    const recent = data.recent_items || [];
    const latest = recent[0] || null;
    const hasWarehouse = stats.warehouse_count > 0;
    const hasCategory = stats.category_count > 0;
    let primaryHref = "/warehouses";
    let primaryLabel = "前往仓库办理入库";
    let primaryIcon = "inbound";
    if (!hasWarehouse) {
      primaryHref = "/warehouses";
      primaryLabel = "建立第一个仓库";
      primaryIcon = "plus";
    } else if (!hasCategory) {
      primaryHref = "/categories";
      primaryLabel = "先创建一个分类";
      primaryIcon = "tag";
    }

    const heroAction =
      '<a class="button button-primary button-large" href="' +
      primaryHref +
      '" data-link>' +
      icon(primaryIcon) +
      primaryLabel +
      "</a>";

    const ledger = latest ? homeLatestTicket(latest) : homeEmptyLedger();
    const archivedItemCount = Number(stats.archived_item_count || 0);
    const archivedWarehouseCount = Number(stats.archived_warehouse_count || 0);
    const metrics =
      homeMetric(
        1,
        String(stats.in_stock_count),
        "在库物品",
        stats.item_count
          ? "累计入档 " +
            stats.item_count +
            " 件" +
            (archivedItemCount ? " · 已归档 " + archivedItemCount + " 件" : "")
          : archivedItemCount
            ? "档案都在归档中 · " + archivedItemCount + " 件"
            : "还没有入档物品"
      ) +
      homeMetric(
        2,
        String(stats.warehouse_count),
        "仓库",
        hasWarehouse
          ? "以名称相称，各有编号"
          : archivedWarehouseCount
            ? "当前仓库都已归档"
            : "建立一个存放位置"
      ) +
      homeMetric(
        3,
        String(stats.category_count),
        "分类",
        hasCategory ? "不同大类，独立计数" : "用三位字母区分大类"
      ) +
      homeMetric(
        4,
        formatPrice(stats.in_stock_value_cents),
        "在库总值",
        "按已知入手价估算"
      );

    const recentContent = recent.length
      ? '<div class="recent-list">' + recent.map(recentItemRow).join("") + "</div>"
      : '<div class="panel-empty home-empty-state">' +
        '<div class="empty-line-icon">' +
        icon("box") +
        "</div>" +
        '<div><strong>还没有入档记录</strong><p>完成仓库与分类设置后，就可以办理第一次入库。</p></div>' +
        '<a class="button button-secondary button-small" href="/warehouses" data-link>去仓库</a>' +
        "</div>";

    const warehouseContent = (data.warehouses || []).length
      ? (data.warehouses || []).map(homeWarehouseRow).join("")
      : '<div class="mini-empty">' +
        '<span>还没有仓库</span>' +
        '<a href="/warehouses" data-link>建立仓库 ' +
        icon("arrowRight") +
        "</a>" +
        "</div>";

    renderShell(
      "home",
      '<div class="page home-page">' +
        '<section class="home-hero">' +
        '<div class="hero-copy">' +
        '<p class="eyebrow"><span class="eyebrow-rule"></span>PRIVATE ARCHIVE · 私人藏物</p>' +
        '<h1>每件物品，<br><span class="serif-accent">都有迹可循。</span></h1>' +
        '<p class="hero-description">给它们一个编号，记住入手的那天，也始终知道此刻放在哪里。</p>' +
        '<div class="hero-actions">' +
        heroAction +
        '<a class="text-arrow hero-secondary" href="/items" data-link>翻看物品目录 ' +
        icon("arrowRight") +
        "</a>" +
        "</div>" +
        '<div class="hero-principle"><span class="mini-seal">藏</span><span>三位分类 · 六位序号 · 一物一档</span></div>' +
        "</div>" +
        '<aside class="ledger" aria-label="最新档案">' +
        '<div class="ledger-top"><span>' +
        new Date().getFullYear() +
        " / COLLECTION LEDGER</span><span>" +
        String(stats.item_count).padStart(3, "0") +
        "</span></div>" +
        ledger +
        "</aside>" +
        "</section>" +
        '<section class="metrics" aria-label="档案概览">' +
        metrics +
        "</section>" +
        '<section class="home-lower">' +
        '<div class="panel recent-panel">' +
        '<header class="section-header">' +
        "<div><p class=\"section-kicker\">RECENT RECORDS</p><h2>最近入档</h2></div>" +
        '<a class="text-link" href="/items" data-link>全部物品 ' +
        icon("arrowRight") +
        "</a>" +
        "</header>" +
        recentContent +
        "</div>" +
        '<div class="home-side">' +
        '<div class="panel warehouse-panel">' +
        '<header class="section-header compact">' +
        "<div><p class=\"section-kicker\">LOCATIONS</p><h2>我的仓库</h2></div>" +
        '<a class="icon-link" href="/warehouses" data-link aria-label="所有仓库">' +
        icon("arrowUpRight") +
        "</a>" +
        "</header>" +
        '<div class="mini-warehouse-list">' +
        warehouseContent +
        "</div>" +
        "</div>" +
        '<div class="principle-card">' +
        '<span class="principle-label">ARCHIVE RULE / 编号规则</span>' +
        '<p>每个编号对应一件物品。<br>按分类归档，随时可查。</p>' +
        '<div class="number-spec"><span>ABC</span><span>000001</span></div>' +
        '<small>不同分类，独立计数</small>' +
        "</div>" +
        "</div>" +
        "</section>" +
        "</div>"
    );
  }

  async function showHome(signal) {
    loadingPage("home");
    setTitle("总览");
    try {
      const data = await api("/api/overview", { signal: signal });
      if (signal.aborted) return;
      renderHome(data);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      renderLoadError("home", error);
    }
  }

  // ------------------------------------------------------------ item cards

  function itemCard(item, options) {
    const opts = options || {};
    const inStock = item.status === "in_stock";
    const archived = Boolean(item.archived);
    const actionButtons = [];
    if (opts.canOutbound && !archived) {
      actionButtons.push(
        '<button class="button button-outbound button-small" type="button" data-outbound="' +
          h(item.id) +
          '">' +
          icon("outbound") +
          "出库</button>"
      );
    }
    if (opts.canArchive && !archived) {
      actionButtons.push(
        '<button class="button button-outbound button-small" type="button" data-item-archive="' +
          h(item.id) +
          '">' +
          icon("archive") +
          "归档</button>"
      );
    }
    if (archived && opts.canUnarchive) {
      actionButtons.push(
        '<button class="button button-secondary button-small" type="button" data-item-unarchive="' +
          h(item.id) +
          '">' +
          icon("restore") +
          "取消归档</button>"
      );
    }
    const footer =
      '<div class="item-card-footer">' +
      '<a class="card-detail" href="' +
      itemPath(item.id) +
      '" data-link>查看档案 ' +
      icon("arrowRight") +
      "</a>" +
      (actionButtons.length
        ? '<div class="item-card-actions">' + actionButtons.join("") + "</div>"
        : "") +
      "</div>";
    return (
      '<article class="item-card tone-' +
      categoryTone(item.category_code) +
      (inStock ? "" : " is-out-of-stock") +
      (archived ? " is-archived" : "") +
      '">' +
      '<a class="item-card-body" href="' +
      itemPath(item.id) +
      '" data-link aria-label="查看 ' +
      h(item.name) +
      ' 的档案">' +
      '<div class="item-card-top"><span class="category-stamp">' +
      h(item.category_code) +
      '<i>·</i>' +
      h(item.category_name) +
      "</span>" +
      statusBadge(item) +
      "</div>" +
      '<div class="item-id mono">' +
      h(item.id) +
      "</div>" +
      '<h3 class="item-name">' +
      h(item.name) +
      "</h3>" +
      '<div class="item-facts">' +
      '<span>' +
      icon("calendar") +
      formatDate(item.acquired_on) +
      "</span>" +
      '<span class="item-price' +
      (Number(item.price_cents) === -1 ? " is-unknown" : "") +
      '">' +
      formatPrice(item.price_cents) +
      "</span>" +
      "</div>" +
      '<div class="item-location">' +
      icon("pin") +
      (item.warehouse && warehouseLabel(item.warehouse)
        ? (archived ? '<span class="item-location-prefix">归档前</span>' : "") +
          '<span class="item-location-name">' +
          h(warehouseLabel(item.warehouse)) +
          '</span><span class="item-location-code mono">' +
          h(item.warehouse.id) +
          "</span>"
        : "<span>" +
          h(
            item.warehouse
              ? item.warehouse.id
              : archived
                ? "已归档 · 当前不在库"
                : "已离开仓库"
          ) +
          "</span>") +
      "</div>" +
      "</a>" +
      footer +
      "</article>"
    );
  }

  function emptyInline(title, copy, actionHtml) {
    return (
      '<div class="empty-inline">' +
      '<div class="empty-inline-icon">' +
      icon("box") +
      "</div>" +
      "<strong>" +
      h(title) +
      "</strong>" +
      "<p>" +
      h(copy) +
      "</p>" +
      (actionHtml || "") +
      "</div>"
    );
  }

  // ------------------------------------------------------------------ items

  function getInitialCategoryFilter() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    return category ? category.toUpperCase() : "";
  }

  async function showItems(signal) {
    loadingPage("items");
    setTitle("物品目录");
    try {
      const results = await Promise.all([
        api("/api/items?include_archived=1", { signal: signal }),
        api("/api/categories", { signal: signal }),
      ]);
      if (signal.aborted) return;
      const items = results[0].items || [];
      const categories = results[1].categories || [];
      renderItems(items, categories);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      renderLoadError("items", error);
    }
  }

  function renderItems(items, categories) {
    const requestedCategory = getInitialCategoryFilter();
    const hasRequestedCategory = categories.some(function (category) {
      return category.code === requestedCategory;
    });
    const initialCategory = hasRequestedCategory ? requestedCategory : "";

    const categoryOptions =
      '<option value="">全部分类</option>' +
      categories
        .map(function (category) {
          return (
            '<option value="' +
            h(category.code) +
            '"' +
            (category.code === initialCategory ? " selected" : "") +
            ">" +
            h(category.code + " · " + category.name) +
            "</option>"
          );
        })
        .join("");

    const activeItems = items.filter(function (item) {
      return !item.archived;
    });
    const archivedItems = items.filter(function (item) {
      return Boolean(item.archived);
    });
    const inStockCount = activeItems.filter(function (item) {
      return item.status === "in_stock";
    }).length;
    const outOfStockCount = activeItems.filter(function (item) {
      return item.status === "out_of_stock";
    }).length;

    const heading =
      '<section class="page-intro">' +
      '<div class="page-intro-copy">' +
      '<p class="eyebrow"><span class="eyebrow-rule"></span>ITEM CATALOGUE</p>' +
      "<h1>物品目录</h1>" +
      '<p class="intro-copy">每一件入档物品，都有自己的编号与位置；不再常用的记录可以归档收起。</p>' +
      "</div>" +
      '<div class="page-actions">' +
      '<button class="button button-primary" type="button" id="add-item">' +
      icon("plus") +
      "添加物品</button>" +
      '<a class="button button-secondary" href="/warehouses" data-link>' +
      icon("inbound") +
      "入库</a></div>" +
      "</section>";

    const content =
      '<div class="page items-page">' +
      heading +
      '<div class="catalogue-toolbar">' +
      '<label class="search-box"><span class="sr-only">搜索物品</span>' +
      icon("search") +
      '<input id="item-search" type="search" placeholder="搜索名称或编号…" autocomplete="off">' +
      "</label>" +
      '<div class="filter-group" role="group" aria-label="按状态筛选">' +
      '<button class="filter-chip is-active" type="button" data-status-filter="all" aria-pressed="true">全部 <span class="filter-count" data-filter-count="all">' +
      activeItems.length +
      "</span></button>" +
      '<button class="filter-chip" type="button" data-status-filter="in_stock" aria-pressed="false">在库 <span class="filter-count" data-filter-count="in_stock">' +
      inStockCount +
      "</span></button>" +
      '<button class="filter-chip" type="button" data-status-filter="out_of_stock" aria-pressed="false">已出库 <span class="filter-count" data-filter-count="out_of_stock">' +
      outOfStockCount +
      "</span></button>" +
      '<button class="filter-chip" type="button" data-status-filter="archived" aria-pressed="false">已归档 <span class="filter-count" data-filter-count="archived">' +
      archivedItems.length +
      "</span></button>" +
      "</div>" +
      '<label class="select-box"><span class="sr-only">按分类筛选</span><select id="item-category-filter">' +
      categoryOptions +
      "</select>" +
      icon("chevronRight", "icon select-chevron") +
      "</label>" +
      "</div>" +
      '<div class="catalogue-status"><span id="item-result-count">显示 ' +
      activeItems.length +
      " 件物品</span><span>编号是每件物品唯一的身份</span></div>" +
      '<div id="items-grid" class="item-grid"></div>' +
      "</div>";

    renderShell("items", content);

    const grid = document.getElementById("items-grid");
    const searchInput = document.getElementById("item-search");
    const categorySelect = document.getElementById("item-category-filter");
    const statusButtons = Array.from(
      document.querySelectorAll("[data-status-filter]")
    );
    const countLabel = document.getElementById("item-result-count");
    let statusFilter = "all";
    let query = "";
    let categoryFilter = initialCategory;

    const addItemButton = document.getElementById("add-item");
    if (addItemButton) {
      addItemButton.addEventListener("click", function () {
        openItemCreateModal({ categoryCode: categoryFilter });
      });
    }

    function matchesArchiveFilter(item) {
      if (statusFilter === "archived") return Boolean(item.archived);
      if (item.archived) return false;
      if (statusFilter === "all") return true;
      return item.status === statusFilter;
    }

    function filteredItems() {
      const normalizedQuery = query.trim().toLowerCase();
      return items.filter(function (item) {
        if (!matchesArchiveFilter(item)) return false;
        if (categoryFilter && item.category_code !== categoryFilter) return false;
        if (!normalizedQuery) return true;
        const haystack = [
          item.id,
          item.name,
          item.category_code,
          item.category_name,
          item.archived ? "已归档 archive" : "",
          item.warehouse ? item.warehouse.id : "",
          item.warehouse ? item.warehouse.label : "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(normalizedQuery) !== -1;
      });
    }

    function totalForFilter() {
      return statusFilter === "archived" ? archivedItems.length : activeItems.length;
    }

    function switchStatusFilter(next) {
      statusFilter = next;
      statusButtons.forEach(function (button) {
        const active = button.getAttribute("data-status-filter") === next;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      draw();
    }

    function clearAllFilters() {
      query = "";
      categoryFilter = "";
      searchInput.value = "";
      categorySelect.value = "";
      if (window.location.search) {
        window.history.replaceState({}, "", "/items");
      }
      switchStatusFilter("all");
    }

    function draw() {
      const visible = filteredItems();
      const total = totalForFilter();
      countLabel.textContent =
        "显示 " +
        visible.length +
        " 件物品" +
        (total !== visible.length ? " / 共 " + total + " 件" : "");
      if (!items.length) {
        grid.innerHTML =
          '<div class="catalogue-empty">' +
          '<div class="empty-illustration">' +
          '<span class="illustration-box">' +
          icon("archive") +
          "</span>" +
          '<span class="illustration-dot"></span>' +
          "</div>" +
          "<h2>档案还是空的</h2>" +
          "<p>添加第一件物品，系统会自动为它生成唯一编号并写入存放位置。</p>" +
          '<button class="button button-primary" type="button" data-add-item>' +
          icon("plus") +
          "添加物品</button>" +
          "</div>";
      } else if (!visible.length) {
        const archivedEmpty =
          statusFilter === "all" &&
          !query.trim() &&
          !categoryFilter &&
          archivedItems.length > 0;
        grid.innerHTML =
          '<div class="catalogue-empty">' +
          '<div class="empty-inline-icon">' +
          icon(archivedEmpty ? "archive" : "search") +
          "</div>" +
          "<h2>" +
          (archivedEmpty ? "目录里没有使用中的物品" : "没有匹配的记录") +
          "</h2>" +
          "<p>" +
          (archivedEmpty
            ? "所有物品都已经归档。归档记录会保留档案，可随时取消归档。"
            : "换一个关键词或筛选条件试试。") +
          "</p>" +
          (archivedEmpty
            ? '<button class="button button-secondary button-small" type="button" id="show-archived">查看已归档物品</button>'
            : '<button class="button button-secondary button-small" type="button" id="clear-filters">清除筛选</button>') +
          "</div>";
        if (archivedEmpty) {
          const archivedButton = document.getElementById("show-archived");
          if (archivedButton) {
            archivedButton.addEventListener("click", function () {
              switchStatusFilter("archived");
            });
          }
        } else {
          const clearButton = document.getElementById("clear-filters");
          if (clearButton) clearButton.addEventListener("click", clearAllFilters);
        }
      } else {
        grid.innerHTML = visible
          .map(function (item) {
            return itemCard(item, { canArchive: true, canUnarchive: true });
          })
          .join("");
      }
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        query = searchInput.value;
        draw();
      });
    }
    if (categorySelect) {
      categorySelect.addEventListener("change", function () {
        categoryFilter = categorySelect.value;
        draw();
      });
    }
    statusButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        switchStatusFilter(button.getAttribute("data-status-filter"));
      });
    });
    grid.addEventListener("click", async function (event) {
      const addButton = event.target.closest("[data-add-item]");
      if (addButton) {
        openItemCreateModal({ categoryCode: categoryFilter });
        return;
      }
      const archiveButton = event.target.closest("[data-item-archive]");
      const unarchiveButton = event.target.closest("[data-item-unarchive]");
      const button = archiveButton || unarchiveButton;
      if (!button) return;
      const itemId =
        button.getAttribute("data-item-archive") ||
        button.getAttribute("data-item-unarchive");
      const item = items.find(function (candidate) {
        return candidate.id === itemId;
      });
      if (!item) return;
      const archiving = Boolean(archiveButton);
      setButtonBusy(button, archiving ? "归档中…" : "恢复中…");
      try {
        const data = await setItemArchived(item.id, archiving);
        toast(
          data.item.id + (archiving ? " 已归档" : " 已取消归档"),
          "success"
        );
        refreshCurrentPage({ scroll: false });
      } catch (error) {
        if (isAbort(error)) return;
        toast(error.message || "操作没有完成，请稍后再试。", "error");
        restoreButton(button);
      }
    });
    draw();
  }

  // ------------------------------------------------------------- warehouses

  function warehouseCard(warehouse, index) {
    const archived = Boolean(warehouse.archived);
    return (
      '<a class="warehouse-card' +
      (archived ? " is-archived" : "") +
      '" href="' +
      warehousePath(warehouse.id) +
      '" data-link>' +
      '<div class="warehouse-card-top"><span class="warehouse-index">' +
      String(index + 1).padStart(2, "0") +
      "</span>" +
      (archived
        ? '<span class="warehouse-state">已归档</span>'
        : '<span class="warehouse-open">' + icon("arrowUpRight") + "</span>") +
      "</div>" +
      '<div class="warehouse-card-icon">' +
      icon(archived ? "archive" : "layers") +
      "</div>" +
      '<div class="warehouse-card-name' +
      (warehouseLabel(warehouse) ? "" : " mono") +
      '">' +
      h(warehouseTitle(warehouse)) +
      "</div>" +
      (warehouseLabel(warehouse)
        ? '<div class="warehouse-code mono">' + h(warehouse.id) + "</div>"
        : "") +
      '<div class="warehouse-card-footer"><span>' +
      (archived
        ? "档案已收起"
        : warehouse.can_delete
          ? "从未使用 · 可删除"
          : pluralItems(warehouse.item_count)) +
      "</span><span>" +
      (archived ? "可取消归档" : formatPrice(warehouse.total_value_cents)) +
      "</span></div>" +
      "</a>"
    );
  }

  async function showWarehouses(signal) {
    loadingPage("warehouses");
    setTitle("仓库");
    try {
      const data = await api("/api/warehouses?include_archived=1", {
        signal: signal,
      });
      if (signal.aborted) return;
      renderWarehouses(data.warehouses || []);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      renderLoadError("warehouses", error);
    }
  }

  function renderWarehouses(warehouses) {
    const activeWarehouses = warehouses.filter(function (warehouse) {
      return !warehouse.archived;
    });
    const archivedWarehouses = warehouses.filter(function (warehouse) {
      return Boolean(warehouse.archived);
    });
    const activeContent = activeWarehouses.length
      ? '<div class="warehouse-grid">' +
        activeWarehouses
          .map(function (warehouse, index) {
            return warehouseCard(warehouse, index);
          })
          .join("") +
        "</div>"
      : '<div class="large-empty">' +
        '<div class="large-empty-art"><span>' +
        icon("layers") +
        '</span><i></i><i></i></div>' +
        '<p class="eyebrow">NO LOCATIONS YET</p>' +
        "<h2>先为物品安一个家</h2>" +
        "<p>建立第一个仓库，进入后点击右上角「入库」，把第一件物品收进来。</p>" +
        '<button class="button button-primary" type="button" id="create-warehouse-empty">' +
        icon("plus") +
        "建立第一个仓库</button>" +
        "</div>";
    const archivedContent = archivedWarehouses.length
      ? '<section class="archive-section" aria-label="已归档仓库">' +
        '<header class="archive-section-header">' +
        '<div><p class="section-kicker">ARCHIVED LOCATIONS</p><h2>已归档仓库 <span class="heading-count">' +
        archivedWarehouses.length +
        "</span></h2></div>" +
        '<p class="archive-section-note">归档会收起仓库，但保留编号与流转记录；随时可以取消归档。</p>' +
        "</header>" +
        '<div class="warehouse-grid">' +
        archivedWarehouses
          .map(function (warehouse, index) {
            return warehouseCard(warehouse, index);
          })
          .join("") +
        "</div>" +
        "</section>"
      : "";

    const content =
      '<div class="page warehouses-page">' +
      '<section class="page-intro">' +
      '<div class="page-intro-copy"><p class="eyebrow"><span class="eyebrow-rule"></span>STORAGE LOCATIONS</p>' +
      "<h1>仓库</h1>" +
      '<p class="intro-copy">每个存放位置，先有名字，再自动获得编号；不用的仓库可以归档或删除。</p></div>' +
      '<div class="page-actions"><button class="button button-primary" type="button" id="create-warehouse">' +
      icon("plus") +
      "新建仓库</button></div>" +
      "</section>" +
      '<div class="info-strip"><span class="info-strip-icon">' +
      icon("info") +
      "</span><p>仓库以名称为主，编号由 <strong>STR + 六位序号</strong> 自动生成。从未有物品进入的仓库可以删除，用过的仓库可以归档保留记录。</p></div>" +
      activeContent +
      archivedContent +
      "</div>";

    renderShell("warehouses", content);
    const openButtons = [
      document.getElementById("create-warehouse"),
      document.getElementById("create-warehouse-empty"),
    ].filter(Boolean);
    openButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openWarehouseCreateModal();
      });
    });
  }

  // ------------------------------------------------------------- categories

  async function showCategories(signal) {
    loadingPage("categories");
    setTitle("分类");
    try {
      const data = await api("/api/categories", { signal: signal });
      if (signal.aborted) return;
      renderCategories(data.categories || []);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      renderLoadError("categories", error);
    }
  }

  function categoryRow(category) {
    const isEmpty = Number(category.item_count) === 0;
    const archivedCount = Number(category.archived_item_count || 0);
    const meta = isEmpty
      ? "还没有物品入档 · 可删除"
      : category.item_count +
        " 件物品入档 · " +
        category.in_stock_count +
        " 件在库" +
        (archivedCount ? " · " + archivedCount + " 件已归档" : "");
    return (
      '<article class="category-row tone-' +
      categoryTone(category.code) +
      '">' +
      '<div class="category-code"><span>' +
      h(category.code) +
      "</span><small>PREFIX</small></div>" +
      '<div class="category-main"><h2>' +
      h(category.name) +
      "</h2><p>" +
      meta +
      "</p></div>" +
      '<div class="category-next"><span>下一个编号</span><strong class="mono">' +
      (category.next_id ? h(category.next_id) : "编号已用尽") +
      "</strong></div>" +
      '<div class="category-actions">' +
      '<a class="category-link" href="/items?category=' +
      encodeURIComponent(category.code) +
      '" data-link>查看物品 ' +
      icon("arrowRight") +
      "</a>" +
      '<button class="category-delete" type="button" data-delete-category="' +
      h(category.code) +
      '"' +
      (isEmpty
        ? ' title="删除这个分类"'
        : ' disabled title="分类下还有物品，不能删除"') +
      ">" +
      icon("trash") +
      "删除</button>" +
      "</div>" +
      "</article>"
    );
  }

  function renderCategories(categories) {
    const content =
      '<div class="page categories-page">' +
      '<section class="page-intro">' +
      '<div class="page-intro-copy"><p class="eyebrow"><span class="eyebrow-rule"></span>CLASSIFICATION</p>' +
      "<h1>分类</h1>" +
      '<p class="intro-copy">用三位字母区分大类，每个大类拥有独立的编号序列。</p></div>' +
      '<div class="page-actions"><button class="button button-primary" type="button" id="create-category">' +
      icon("plus") +
      "新建分类</button></div>" +
      "</section>" +
      '<div class="category-rule-card">' +
      '<div class="rule-sample"><span>ABC</span><i>+</i><span>000001</span></div>' +
      '<div class="rule-copy"><strong>分类独立计数</strong><p>每个分类从 000001 开始编号。分类下没有物品时，可以删除该分类。</p></div>' +
      '<span class="rule-warning">' +
      icon("info") +
      " STR 保留给仓库</span>" +
      "</div>" +
      (categories.length
        ? '<div class="category-list">' +
          categories.map(categoryRow).join("") +
          "</div>"
        : '<div class="large-empty">' +
          '<div class="large-empty-art is-category"><span>' +
          icon("tag") +
          '</span><i></i><i></i></div>' +
          '<p class="eyebrow">NO CATEGORIES YET</p>' +
          "<h2>从一个三位字母开始</h2>" +
          "<p>比如书籍用 BOO、电子设备用 ELE。创建分类后，入库时就能给物品分配编号。</p>" +
          '<button class="button button-primary" type="button" id="create-category-empty">' +
          icon("plus") +
          "建立第一个分类</button>" +
          "</div>") +
      "</div>";
    renderShell("categories", content);
    [document.getElementById("create-category"), document.getElementById("create-category-empty")]
      .filter(Boolean)
      .forEach(function (button) {
        button.addEventListener("click", function () {
          openCategoryModal({});
        });
      });
    Array.from(document.querySelectorAll("[data-delete-category]")).forEach(
      function (button) {
        button.addEventListener("click", function () {
          if (button.disabled) return;
          const code = button.getAttribute("data-delete-category");
          const category = categories.find(function (candidate) {
            return candidate.code === code;
          });
          if (category) openCategoryDeleteModal(category);
        });
      }
    );
  }

  // ------------------------------------------------------------------- item

  function timelineItem(movement) {
    const isInbound = movement.type === "inbound";
    return (
      '<li class="timeline-item ' +
      (isInbound ? "is-inbound" : "is-outbound") +
      '">' +
      '<span class="timeline-node">' +
      icon(isInbound ? "inbound" : "outbound") +
      "</span>" +
      '<div class="timeline-content"><div class="timeline-heading"><strong>' +
      (isInbound ? "入库" : "出库") +
      "</strong><time>" +
      formatDateTime(movement.occurred_at) +
      "</time></div>" +
      '<a class="timeline-place' +
      (warehouseLabel(movement.warehouse) ? "" : " mono") +
      '" href="' +
      warehousePath(movement.warehouse.id) +
      '" data-link>' +
      h(warehouseTitle(movement.warehouse)) +
      "</a>" +
      (warehouseLabel(movement.warehouse)
        ? '<span class="timeline-code mono">' +
          h(movement.warehouse.id) +
          "</span>"
        : "") +
      "</div>" +
      "</li>"
    );
  }

  function renderItemDetail(item) {
    const inStock = item.status === "in_stock";
    const archived = Boolean(item.archived);
    const warehouse = item.warehouse;
    const locationValue = warehouse
      ? '<a class="inline-warehouse-link' +
        (warehouseLabel(warehouse) ? "" : " mono") +
        '" href="' +
        warehousePath(warehouse.id) +
        '" data-link>' +
        h(warehouseTitle(warehouse)) +
        (warehouseLabel(warehouse)
          ? ' <span class="mono">' + h(warehouse.id) + "</span>"
          : "") +
        "</a>"
      : '<span class="muted-value">' +
        (archived ? "归档时不在库" : "已出库，暂不在库") +
        "</span>";

    let statusMessage = "";
    if (archived) {
      statusMessage =
        '<div class="status-banner is-archived">' +
        '<span class="status-banner-icon">' +
        icon("archive") +
        "</span>" +
        '<div class="status-banner-copy"><strong>这件物品已归档</strong><p>档案与流转记录仍完整保留。取消归档后，它会重新回到物品目录' +
        (warehouse ? "，并恢复原来的位置。" : "。") +
        "</p></div>" +
        '<button class="button button-secondary button-small" type="button" id="unarchive-item-banner">' +
        icon("restore") +
        "取消归档</button>" +
        "</div>";
    } else if (!inStock) {
      statusMessage =
        '<div class="status-banner">' +
        '<span class="status-banner-icon">' +
        icon("outbound") +
        "</span>" +
        '<div class="status-banner-copy"><strong>这件物品暂未在库</strong><p>编号和档案仍完整保留。到任意仓库页面右上角办理入库，就能重新归位。</p></div>' +
        '<a class="button button-secondary button-small" href="/warehouses" data-link>前往仓库</a>' +
        "</div>";
    }

    const archiveAction = archived
      ? '<button class="button button-secondary" type="button" id="unarchive-item">' +
        icon("restore") +
        "取消归档</button>"
      : '<button class="button button-secondary" type="button" id="archive-item">' +
        icon("archive") +
        "归档</button>";

    renderShell(
      "items",
      '<div class="page item-detail-page">' +
        '<div class="record-topbar"><a class="back-link" href="/items" data-link>' +
        icon("chevronLeft") +
        '物品目录</a><div class="record-actions">' +
        '<button class="button button-secondary" type="button" id="edit-item">' +
        icon("edit") +
        "编辑资料</button>" +
        archiveAction +
        "</div></div>" +
        '<section class="item-record-hero">' +
        '<div class="item-record-main">' +
        '<p class="eyebrow"><span class="eyebrow-rule"></span>ITEM RECORD · 物品档案</p>' +
        '<div class="record-id mono">' +
        h(item.id) +
        "</div>" +
        "<h1>" +
        h(item.name) +
        "</h1>" +
        '<div class="record-tags"><span class="category-pill tone-' +
        categoryTone(item.category_code) +
        '">' +
        h(item.category_code) +
        " · " +
        h(item.category_name) +
        "</span>" +
        statusBadge(item) +
        "</div>" +
        "</div>" +
        '<aside class="current-location-card' +
        (inStock && !archived ? "" : " is-out") +
        '">' +
        '<div class="location-card-top"><span>' +
        (archived ? (warehouse ? "归档前位置" : "已归档") : "当前位置") +
        "</span>" +
        icon(archived ? "archive" : "pin") +
        "</div>" +
        (warehouse
          ? '<a class="location-code' +
            (warehouseLabel(warehouse) ? " is-name" : "") +
            '" href="' +
            warehousePath(warehouse.id) +
            '" data-link>' +
            h(warehouseTitle(warehouse)) +
            "</a>" +
            (warehouseLabel(warehouse)
              ? '<p class="location-label mono">' + h(warehouse.id) + "</p>"
              : "") +
            '<a class="location-link" href="' +
            warehousePath(warehouse.id) +
            '" data-link>打开仓库 ' +
            icon("arrowRight") +
            "</a>"
          : '<div class="location-code is-empty">' +
            (archived ? "已归档" : "已出库") +
            "</div>" +
            '<p class="location-label">' +
            (archived ? "档案已收起，可随时取消归档" : "等待重新入库") +
            "</p>" +
            '<a class="location-link" href="/warehouses" data-link>前往仓库 ' +
            icon("arrowRight") +
            "</a>") +
        "</aside>" +
        "</section>" +
        statusMessage +
        '<div class="detail-columns">' +
        '<section class="detail-panel">' +
        '<header class="section-header compact"><div><p class="section-kicker">DETAILS</p><h2>详细信息</h2></div><span class="detail-id mono">' +
        h(item.id) +
        "</span></header>" +
        '<dl class="detail-list">' +
        '<div class="detail-row"><dt>名称</dt><dd>' +
        h(item.name) +
        "</dd></div>" +
        '<div class="detail-row"><dt>入手时间</dt><dd>' +
        formatDateLong(item.acquired_on) +
        "</dd></div>" +
        '<div class="detail-row"><dt>入手价</dt><dd class="price-value">' +
        formatPrice(item.price_cents) +
        "</dd></div>" +
        '<div class="detail-row"><dt>' +
        (archived ? "归档前位置" : "当前位置") +
        "</dt><dd>" +
        locationValue +
        "</dd></div>" +
        (archived
          ? '<div class="detail-row"><dt>归档时间</dt><dd>' +
            formatDateTime(item.archived_at) +
            "</dd></div>"
          : "") +
        "</dl>" +
        "</section>" +
        '<aside class="history-panel">' +
        '<header class="section-header compact"><div><p class="section-kicker">MOVEMENTS</p><h2>流转记录</h2></div><span class="history-count">' +
        (item.movements || []).length +
        " 条</span></header>" +
        ((item.movements || []).length
          ? '<ol class="timeline">' + item.movements.map(timelineItem).join("") + "</ol>"
          : '<p class="timeline-empty">暂无流转记录。</p>') +
        "</aside>" +
        "</div>" +
        "</div>"
    );

    const editButton = document.getElementById("edit-item");
    if (editButton) editButton.addEventListener("click", function () {
      openItemEditModal(item);
    });
    const archiveButton = document.getElementById("archive-item");
    if (archiveButton) {
      archiveButton.addEventListener("click", function () {
        toggleItemArchive(item, true, archiveButton);
      });
    }
    [
      document.getElementById("unarchive-item"),
      document.getElementById("unarchive-item-banner"),
    ]
      .filter(Boolean)
      .forEach(function (button) {
        button.addEventListener("click", function () {
          toggleItemArchive(item, false, button);
        });
      });
    setTitle(item.name + " · " + item.id);
  }

  async function toggleItemArchive(item, archived, button) {
    setButtonBusy(button, archived ? "归档中…" : "恢复中…");
    try {
      const data = await setItemArchived(item.id, archived);
      toast(data.item.id + (archived ? " 已归档" : " 已取消归档"), "success");
      refreshCurrentPage({ scroll: false });
    } catch (error) {
      if (isAbort(error)) return;
      toast(error.message || "操作没有完成，请稍后再试。", "error");
      restoreButton(button);
    }
  }

  async function showItem(id, signal) {
    loadingPage("items", "detail");
    setTitle("物品档案");
    try {
      const data = await api("/api/items/" + encodeURIComponent(id), {
        signal: signal,
      });
      if (signal.aborted) return;
      renderItemDetail(data.item);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      if (error.status === 404) {
        setTitle("物品不存在");
        renderRecordNotFound("items", "item", id);
        return;
      }
      renderLoadError("items", error);
    }
  }

  // -------------------------------------------------------------- warehouse

  async function showWarehouse(id, signal) {
    loadingPage("warehouses", "detail");
    setTitle("仓库");
    try {
      const data = await api("/api/warehouses/" + encodeURIComponent(id), {
        signal: signal,
      });
      if (signal.aborted) return;
      renderWarehouse(data.warehouse);
    } catch (error) {
      if (isAbort(error) || signal.aborted) return;
      if (error.status === 404) {
        setTitle("仓库不存在");
        renderRecordNotFound("warehouses", "warehouse", id);
        return;
      }
      renderLoadError("warehouses", error);
    }
  }

  function renderWarehouse(warehouse) {
    const items = warehouse.items || [];
    const archived = Boolean(warehouse.archived);
    const canArchive = Boolean(warehouse.can_archive);
    const canDelete = Boolean(warehouse.can_delete);
    const archiveButton = archived
      ? '<button class="button button-secondary" type="button" id="unarchive-warehouse">' +
        icon("restore") +
        "取消归档</button>"
      : '<button class="button button-secondary" type="button" id="archive-warehouse"' +
        (canArchive ? "" : ' disabled title="仓库中还有物品，不能归档"') +
        ">" +
        icon("archive") +
        "归档</button>";
    const deleteButton = canDelete
      ? '<button class="button button-secondary archive-delete-button" type="button" id="delete-warehouse">' +
        icon("trash") +
        "删除仓库</button>"
      : "";
    const archivedBanner = archived
      ? '<div class="status-banner is-archived">' +
        '<span class="status-banner-icon">' +
        icon("archive") +
        "</span>" +
        '<div class="status-banner-copy"><strong>这个仓库已归档</strong><p>仓库会从日常列表中收起，编号与流转记录仍会保留。取消归档后可以继续入库。</p></div>' +
        '<button class="button button-secondary button-small" type="button" id="unarchive-warehouse-banner">' +
        icon("restore") +
        "取消归档</button>" +
        "</div>"
      : "";
    const deleteNote =
      !archived && !canDelete
        ? '<div class="archive-hint">' +
          icon("info") +
          "<p>这个仓库曾有物品进入，不能删除。可以先将物品出库或归档，再归档仓库以保留记录。</p>" +
          "</div>"
        : "";
    const emptyState = archived
      ? '<div class="large-empty warehouse-empty">' +
        '<div class="empty-illustration"><span class="illustration-box">' +
        icon("archive") +
        '</span><span class="illustration-dot"></span></div>' +
        "<h2>仓库已归档</h2>" +
        "<p>归档不会删除编号、物品和流转记录。取消归档后即可继续办理入库。</p>" +
        '<button class="button button-secondary" type="button" id="unarchive-warehouse-empty">' +
        icon("restore") +
        "取消归档</button>" +
        "</div>"
      : '<div class="large-empty warehouse-empty">' +
        '<div class="empty-illustration"><span class="illustration-box">' +
        icon("inbound") +
        '</span><span class="illustration-dot"></span></div>' +
        "<h2>这个仓库还空着</h2>" +
        "<p>点击右上角「入库」，把一件新物品或已出库物品收进这里。</p>" +
        '<button class="button button-primary" type="button" id="warehouse-inbound-empty">' +
        icon("plus") +
        "第一次入库</button>" +
        "</div>";

    const content =
      '<div class="page warehouse-detail-page">' +
      '<div class="record-topbar warehouse-topbar"><a class="back-link" href="/warehouses" data-link>' +
      icon("chevronLeft") +
      '全部仓库</a><div class="record-actions">' +
      (archived
        ? ""
        : '<button class="button button-primary inbound-primary" type="button" id="warehouse-inbound">' +
          icon("inbound") +
          "入库</button>") +
      archiveButton +
      deleteButton +
      "</div></div>" +
      '<section class="warehouse-hero' +
      (archived ? " is-archived" : "") +
      '">' +
      '<div class="warehouse-hero-symbol"><span>WH</span>' +
      icon(archived ? "archive" : "layers") +
      "</div>" +
      '<div class="warehouse-hero-main">' +
      '<p class="eyebrow"><span class="eyebrow-rule"></span>WAREHOUSE RECORD</p>' +
      '<div class="warehouse-title-line"><h1' +
      (warehouseLabel(warehouse) ? "" : ' class="mono"') +
      ">" +
      h(warehouseTitle(warehouse)) +
      '</h1><span class="warehouse-pill' +
      (archived ? " is-archived" : "") +
      '">' +
      (archived ? "已归档" : "使用中") +
      "</span></div>" +
      (warehouseLabel(warehouse)
        ? '<p class="warehouse-title-code mono">' + h(warehouse.id) + "</p>"
        : "") +
      '<p class="warehouse-since">建立于 ' +
      formatDateTime(warehouse.created_at).slice(0, 10) +
      " · 编号由系统分配，不可更改</p>" +
      "</div>" +
      '<div class="warehouse-summary">' +
      '<div><span>在库物品</span><strong>' +
      warehouse.item_count +
      "<i>件</i></strong></div>" +
      '<div><span>在库总值</span><strong class="summary-price">' +
      formatPrice(warehouse.total_value_cents) +
      "</strong></div>" +
      (Number(warehouse.history_count || 0) > 0
        ? '<div><span>流转记录</span><strong>' +
          warehouse.history_count +
          "<i>条</i></strong></div>"
        : "") +
      "</div>" +
      "</section>" +
      archivedBanner +
      deleteNote +
      '<section class="warehouse-inventory">' +
      '<header class="inventory-header"><div><p class="section-kicker">INVENTORY</p><h2>在库物品 <span class="heading-count">' +
      items.length +
      "</span></h2></div>" +
      (items.length
        ? '<p class="inventory-note">每一件物品都有一个出库按钮</p>'
        : "") +
      "</header>" +
      (items.length
        ? '<div class="item-grid warehouse-item-grid">' +
          items
            .map(function (item) {
              return itemCard(item, { canOutbound: true });
            })
            .join("") +
          "</div>"
        : emptyState) +
      "</section>" +
      "</div>";
    renderShell("warehouses", content);
    setTitle(warehouseTitle(warehouse) + " · 仓库");

    const inboundButtons = [
      document.getElementById("warehouse-inbound"),
      document.getElementById("warehouse-inbound-empty"),
    ].filter(Boolean);
    inboundButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openInboundModal(warehouse);
      });
    });

    Array.from(document.querySelectorAll("[data-outbound]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const itemId = button.getAttribute("data-outbound");
        const item = items.find(function (candidate) {
          return candidate.id === itemId;
        });
        if (item) openOutboundModal(item);
      });
    });

    const archiveAction = document.getElementById("archive-warehouse");
    if (archiveAction && !archiveAction.disabled) {
      archiveAction.addEventListener("click", function () {
        toggleWarehouseArchive(warehouse, true, archiveAction);
      });
    }
    [
      document.getElementById("unarchive-warehouse"),
      document.getElementById("unarchive-warehouse-banner"),
      document.getElementById("unarchive-warehouse-empty"),
    ]
      .filter(Boolean)
      .forEach(function (button) {
        button.addEventListener("click", function () {
          toggleWarehouseArchive(warehouse, false, button);
        });
      });
    const deleteAction = document.getElementById("delete-warehouse");
    if (deleteAction) {
      deleteAction.addEventListener("click", function () {
        openWarehouseDeleteModal(warehouse);
      });
    }
  }

  async function toggleWarehouseArchive(warehouse, archived, button) {
    setButtonBusy(button, archived ? "归档中…" : "恢复中…");
    try {
      const data = await setWarehouseArchived(warehouse.id, archived);
      toast(
        warehouseTitle(data.warehouse) + (archived ? " 已归档" : " 已取消归档"),
        "success"
      );
      refreshCurrentPage({ scroll: false });
    } catch (error) {
      if (isAbort(error)) return;
      toast(error.message || "操作没有完成，请稍后再试。", "error");
      restoreButton(button);
    }
  }

  function openWarehouseDeleteModal(warehouse) {
    const modal = openModal({
      eyebrow: "DELETE WAREHOUSE",
      title: "删除仓库 " + warehouseTitle(warehouse),
      description: "只有从未有物品进入的仓库可以删除。",
      size: "sm",
      initialFocus: null,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<div class="callout callout-attention">' +
        icon("alert") +
        '<div><strong>' +
        h(warehouseTitle(warehouse)) +
        " · " +
        h(warehouse.id) +
        "</strong><p>这个仓库还没有任何物品进入过，可以安全删除。删除后编号不会重新分配，操作无法撤销。</p></div></div>" +
        formActions({
          submitLabel: "删除仓库",
          submitIcon: "trash",
          danger: true,
        }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    bindForm(form, async function () {
      await api("/api/warehouses/" + encodeURIComponent(warehouse.id), {
        method: "DELETE",
      });
      modal.close();
      toast("仓库 " + warehouseTitle(warehouse) + " 已删除", "success");
      navigate("/warehouses");
    });
  }

  // ----------------------------------------------------------------- modals

  function syncModalLock() {
    const hasOpenDialog = Boolean(document.querySelector("dialog[open]"));
    document.documentElement.classList.toggle("modal-open", hasOpenDialog);
  }

  function openModal(options) {
    const titleId = uid("dialog-title");
    const dialog = document.createElement("dialog");
    dialog.className = "modal modal-" + (options.size || "md");
    dialog.setAttribute("aria-labelledby", titleId);
    if (options.description) dialog.setAttribute("aria-describedby", titleId + "-desc");
    const eyebrow = options.eyebrow
      ? '<p class="eyebrow modal-eyebrow">' + h(options.eyebrow) + "</p>"
      : "";
    const description = options.description
      ? '<p class="modal-description" id="' +
        titleId +
        '-desc">' +
        h(options.description) +
        "</p>"
      : "";
    dialog.innerHTML =
      '<div class="modal-card">' +
      '<header class="modal-header">' +
      "<div>" +
      eyebrow +
      '<h2 id="' +
      titleId +
      '">' +
      h(options.title) +
      "</h2>" +
      description +
      "</div>" +
      '<button class="modal-close" type="button" data-modal-close aria-label="关闭">' +
      icon("close") +
      "</button>" +
      "</header>" +
      '<div class="modal-body">' +
      options.body +
      "</div>" +
      "</div>";
    dialogLayer.appendChild(dialog);

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      if (dialog.open) {
        dialog.close();
      } else {
        dialog.remove();
      }
    }

    dialog.addEventListener("click", function (event) {
      const closer = event.target.closest("[data-modal-close]");
      if (closer) {
        close();
        return;
      }
      if (event.target === dialog) close();
    });
    dialog.addEventListener("close", function () {
      dialog.remove();
      syncModalLock();
    });
    dialog.showModal();
    syncModalLock();

    const focusTarget = dialog.querySelector(options.initialFocus || "[autofocus]");
    if (focusTarget) {
      window.setTimeout(function () {
        if (dialog.open) focusTarget.focus();
      }, 30);
    }
    return {
      dialog: dialog,
      close: close,
      body: dialog.querySelector(".modal-body"),
    };
  }

  function formErrorMarkup() {
    return (
      '<div class="form-error" role="alert" hidden>' +
      icon("alert") +
      '<span class="form-error-text"></span></div>'
    );
  }

  function formActions(options) {
    const opts = options || {};
    return (
      '<div class="modal-actions">' +
      '<button class="button button-quiet" type="button" data-modal-close>' +
      h(opts.cancelLabel || "取消") +
      "</button>" +
      '<button class="button ' +
      (opts.danger ? "button-danger" : "button-primary") +
      '" type="submit">' +
      icon(opts.submitIcon || "check") +
      h(opts.submitLabel || "保存") +
      "</button>" +
      "</div>"
    );
  }

  function clearFormError(form) {
    const box = form.querySelector(".form-error");
    if (box) {
      box.hidden = true;
      box.querySelector(".form-error-text").textContent = "";
    }
    form.querySelectorAll(".is-invalid").forEach(function (element) {
      element.classList.remove("is-invalid");
      element.removeAttribute("aria-invalid");
    });
  }

  function showFormError(form, message, fields) {
    const box = form.querySelector(".form-error");
    if (box) {
      box.querySelector(".form-error-text").textContent = message;
      box.hidden = false;
    }
    if (fields) {
      Object.keys(fields).forEach(function (name) {
        const element = form.querySelector('[name="' + name + '"]');
        if (element) {
          element.classList.add("is-invalid");
          element.setAttribute("aria-invalid", "true");
        }
      });
    }
    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) firstInvalid.focus();
    if (box) {
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function setButtonBusy(button, label) {
    if (!button) return;
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.disabled = true;
    button.classList.add("is-busy");
    button.innerHTML =
      '<span class="button-spinner"></span><span>' + h(label || "处理中…") + "</span>";
  }

  function restoreButton(button) {
    if (!button || !button.isConnected) return;
    button.disabled = false;
    button.classList.remove("is-busy");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }

  function bindForm(form, submitAction) {
    if (!form) return;
    form.addEventListener("input", function () {
      clearFormError(form);
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      clearFormError(form);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const button = form.querySelector('[type="submit"]');
      setButtonBusy(button);
      try {
        await submitAction(form);
      } catch (error) {
        if (isAbort(error)) return;
        showFormError(
          form,
          error && error.message ? error.message : "操作没有完成，请再试一次。",
          error && error.fields
        );
      } finally {
        restoreButton(button);
      }
    });
  }

  function openWarehouseCreateModal(options) {
    const opts = options || {};
    const labelField = "warehouse-label";
    const modal = openModal({
      eyebrow: "NEW WAREHOUSE",
      title: "新建仓库",
      description: "先给仓库起一个名字，编号由系统自动分配。",
      size: "sm",
      initialFocus: "#" + labelField,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<label class="field"><span class="field-label">仓库名称 <em>可选</em></span>' +
        '<input id="' +
        labelField +
        '" class="input" type="text" name="label" maxlength="40" placeholder="例如：书房 / 主仓库 / 父母家" autofocus>' +
        '<span class="field-hint">名称是这个仓库的称呼；留空时，会以编号来称呼它。</span></label>' +
        '<div class="field-readonly"><span>将自动分配编号</span><strong class="mono">STR —— ——</strong></div>' +
        formActions({ submitLabel: "建立仓库", submitIcon: "plus" }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    bindForm(form, async function () {
      const formData = new FormData(form);
      const data = await api("/api/warehouses", {
        method: "POST",
        body: { label: String(formData.get("label") || "") },
      });
      modal.close();
      toast("仓库 " + warehouseTitle(data.warehouse) + " 已建立", "success");
      if (opts.onCreated) {
        opts.onCreated(data.warehouse);
      } else {
        navigate(warehousePath(data.warehouse.id));
      }
    });
  }

  function openCategoryModal(options) {
    const opts = options || {};
    const codeField = "category-code";
    const presetCode = String(opts.code || "").trim().toUpperCase();
    const hasPresetCode = /^[A-Z]{3}$/.test(presetCode);
    const lockCode = Boolean(opts.lockCode && hasPresetCode);
    const modal = openModal({
      eyebrow: "NEW CATEGORY",
      title: hasPresetCode ? "新建分类 " + presetCode : "新建分类",
      description: lockCode
        ? "分类代号来自物品地址；先建立这个分类，才能继续添加物品。"
        : "三位英文字母会成为该大类所有物品的编号开头。",
      size: "sm",
      initialFocus: lockCode ? "#category-name" : "#" + codeField,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<div class="field-grid"><label class="field"><span class="field-label">分类代号 <em>必填</em></span>' +
        '<input id="' +
        codeField +
        '" class="input input-code" type="text" name="code" maxlength="3" pattern="[A-Za-z]{3}" placeholder="ELE" value="' +
        h(hasPresetCode ? presetCode : "") +
        '" required autocomplete="off" spellcheck="false"' +
        (lockCode ? ' readonly aria-readonly="true"' : "") +
        ">" +
        '<span class="field-hint">' +
        (lockCode
          ? "从物品编号识别出的分类代号，不能在这里修改。"
          : "3 位英文字母，例如 ELE、BOO。STR 已被系统保留。") +
        "</span></label>" +
        '<label class="field"><span class="field-label">显示名称 <em>可选</em></span>' +
        '<input id="category-name" class="input" type="text" name="name" maxlength="40" placeholder="例如：电子设备"></label></div>' +
        '<div class="callout callout-quiet">' +
        icon("info") +
        "<p>分类下没有物品时，可以在分类页删除它。已有物品的分类会保留。</p></div>" +
        formActions({ submitLabel: "创建分类", submitIcon: "plus" }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    const codeInput = form.querySelector('[name="code"]');
    if (codeInput && !lockCode) {
      codeInput.addEventListener("input", function () {
        const start = codeInput.selectionStart;
        const cleaned = codeInput.value
          .replace(/[^a-zA-Z]/g, "")
          .toUpperCase()
          .slice(0, 3);
        if (codeInput.value !== cleaned) {
          codeInput.value = cleaned;
          const end = Math.min(start == null ? cleaned.length : start, cleaned.length);
          codeInput.setSelectionRange(end, end);
        }
      });
    }
    bindForm(form, async function () {
      const formData = new FormData(form);
      const code = String(formData.get("code") || "").trim().toUpperCase();
      if (!/^[A-Za-z]{3}$/.test(code)) {
        throw new ApiError("分类代号必须是 3 位英文字母。", {
          fields: { code: "请输入 3 位英文字母" },
        });
      }
      if (code === "STR") {
        throw new ApiError("STR 已保留给仓库编号，请换一个分类代号。", {
          fields: { code: "STR 为仓库专用前缀" },
        });
      }
      const data = await api("/api/categories", {
        method: "POST",
        body: {
          code: code,
          name: String(formData.get("name") || ""),
        },
      });
      modal.close();
      toast("分类 " + data.category.code + " 已创建", "success");
      if (opts.onCreated) {
        opts.onCreated(data.category);
      } else if (parseRoute(window.location.pathname).type === "categories") {
        refreshCurrentPage();
      }
    });
  }

  function openCategoryDeleteModal(category) {
    const modal = openModal({
      eyebrow: "DELETE CATEGORY",
      title: "删除分类 " + category.code,
      description: "只有还没有物品的分类可以删除。",
      size: "sm",
      initialFocus: null,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<div class="callout callout-attention">' +
        icon("alert") +
        '<div><strong>' +
        h(category.code + " · " + category.name) +
        "</strong><p>该分类下还没有入档物品。删除后分类会从列表移除，之后仍可重新创建。</p></div></div>" +
        formActions({
          submitLabel: "删除分类",
          submitIcon: "trash",
          danger: true,
        }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    bindForm(form, async function () {
      await api("/api/categories/" + encodeURIComponent(category.code), {
        method: "DELETE",
      });
      modal.close();
      toast("分类 " + category.code + " 已删除", "success");
      refreshCurrentPage();
    });
  }

  function categoryOptionMarkup(categories, selectedCode) {
    if (!categories.length) {
      return '<option value="" disabled selected>还没有分类，请先新建</option>';
    }
    return categories
      .map(function (category) {
        return (
          '<option value="' +
          h(category.code) +
          '"' +
          (category.code === selectedCode ? " selected" : "") +
          ">" +
          h(category.code + " · " + category.name) +
          "</option>"
        );
      })
      .join("");
  }

  function warehouseOptionMarkup(warehouses, selectedId) {
    if (!warehouses.length) {
      return '<option value="" disabled selected>还没有可用仓库，请先新建</option>';
    }
    return warehouses
      .map(function (warehouse) {
        const label = warehouseLabel(warehouse);
        return (
          '<option value="' +
          h(warehouse.id) +
          '"' +
          (warehouse.id === selectedId ? " selected" : "") +
          ">" +
          h(label ? label + " · " + warehouse.id : warehouse.id) +
          "</option>"
        );
      })
      .join("");
  }

  async function openItemCreateModal(options) {
    const opts = options || {};
    const requiredCode = String(opts.categoryCode || "").trim().toUpperCase();
    const hasRequiredCode = /^[A-Z]{3}$/.test(requiredCode);
    let categories = [];
    let warehouses = [];
    try {
      const result = await Promise.all([
        api("/api/categories"),
        api("/api/warehouses"),
      ]);
      categories = result[0].categories || [];
      warehouses = result[1].warehouses || [];
    } catch (error) {
      toast(error.message || "未能读取分类与仓库信息", "error");
      return;
    }

    const categorySelectId = uid("item-create-category");
    const warehouseSelectId = uid("item-create-warehouse");
    const nameId = uid("item-create-name");
    const alertsId = uid("item-create-alerts");
    const previewId = uid("item-create-preview");

    function hasRequiredCategory() {
      return (
        !hasRequiredCode ||
        categories.some(function (category) {
          return category.code === requiredCode;
        })
      );
    }

    function categoryIsBlocked() {
      return hasRequiredCode && !hasRequiredCategory();
    }

    function alertsMarkup() {
      const blocks = [];
      if (categoryIsBlocked()) {
        blocks.push(
          '<div class="callout callout-attention">' +
            icon("tag") +
            "<div><strong>分类 " +
            h(requiredCode) +
            " 尚未建立</strong><p>添加物品前，需要先添加分类 " +
            h(requiredCode) +
            "。分类代号会成为物品编号的前三位。</p></div>" +
            '<button class="inline-create-category" type="button" data-create-category>' +
            icon("plus") +
            "添加分类 " +
            h(requiredCode) +
            "</button></div>"
        );
      } else if (!categories.length) {
        blocks.push(
          '<div class="callout callout-attention">' +
            icon("tag") +
            "<div><strong>先添加一个分类</strong><p>分类会决定物品编号的前三位，添加物品前需要先建立分类。</p></div>" +
            '<button class="inline-create-category" type="button" data-create-category>' +
            icon("plus") +
            "添加分类</button></div>"
        );
      }
      if (!warehouses.length) {
        blocks.push(
          '<div class="callout callout-attention">' +
            icon("layers") +
            "<div><strong>还没有可用的仓库</strong><p>物品需要直接入库到一个仓库。可以先新建仓库，或到仓库页取消归档后再试。</p></div>" +
            '<button class="inline-create-category" type="button" data-create-warehouse>' +
            icon("plus") +
            "新建仓库</button></div>"
        );
      }
      return blocks.join("");
    }

    const body =
      '<form class="modal-form item-create-form" novalidate>' +
      formErrorMarkup() +
      '<div id="' +
      alertsId +
      '">' +
      alertsMarkup() +
      "</div>" +
      '<div class="field-grid">' +
      '<div class="field"><div class="field-label-row">' +
      '<label class="field-label" for="' +
      categorySelectId +
      '">分类 <em>必填</em></label>' +
      '<button class="inline-text-button" type="button" data-create-category>新建分类 ' +
      icon("plus") +
      "</button></div>" +
      '<select id="' +
      categorySelectId +
      '" class="input select-input" name="category_code" required>' +
      categoryOptionMarkup(categories, "") +
      "</select></div>" +
      '<div class="field"><div class="field-label-row">' +
      '<label class="field-label" for="' +
      warehouseSelectId +
      '">存放仓库 <em>必填</em></label>' +
      '<button class="inline-text-button" type="button" data-create-warehouse>新建仓库 ' +
      icon("plus") +
      "</button></div>" +
      '<select id="' +
      warehouseSelectId +
      '" class="input select-input" name="warehouse_id" required>' +
      warehouseOptionMarkup(warehouses, "") +
      "</select></div>" +
      "</div>" +
      '<label class="field"><span class="field-label">物品名称 <em>必填</em></span>' +
      '<input id="' +
      nameId +
      '" class="input" type="text" name="name" maxlength="100" placeholder="例如：米白色羊毛围巾" required autofocus></label>' +
      '<div class="field-grid"><label class="field"><span class="field-label">入手时间 <em>必填</em></span>' +
      '<div class="input-with-icon">' +
      icon("calendar") +
      '<input class="input" type="date" name="acquired_on" max="' +
      todayISO() +
      '" value="' +
      todayISO() +
      '" required></div></label>' +
      '<label class="field"><span class="field-label">入手价 <em>必填</em></span>' +
      '<div class="input-prefix"><span>¥</span><input class="input" type="number" name="price" min="-1" step="0.01" inputmode="decimal" placeholder="0.00 或 -1" required></div>' +
      '<span class="field-hint">价格未知时填 -1。</span></label></div>' +
      '<div class="number-preview"><span>系统将分配编号</span><strong class="mono" id="' +
      previewId +
      '">选择分类后预览</strong></div>' +
      '<div class="modal-actions"><button class="button button-quiet" type="button" data-modal-close>取消</button>' +
      '<button class="button button-primary" type="submit">' +
      icon("plus") +
      "添加物品</button></div>" +
      "</form>";

    let focusSelector = "#" + categorySelectId;
    if (categoryIsBlocked() || !categories.length) {
      focusSelector = "#" + alertsId + " [data-create-category]";
    } else if (!warehouses.length) {
      focusSelector = "#" + alertsId + " [data-create-warehouse]";
    }

    const modal = openModal({
      eyebrow: "NEW ITEM",
      title: "添加物品",
      description: "选择分类与存放仓库，系统会分配新的物品编号并直接入库。",
      size: "lg",
      initialFocus: focusSelector,
      body: body,
    });

    const form = modal.dialog.querySelector("form");
    const categorySelect = modal.dialog.querySelector('[name="category_code"]');
    const warehouseSelect = modal.dialog.querySelector('[name="warehouse_id"]');
    const preview = modal.dialog.querySelector("#" + previewId);
    const alerts = modal.dialog.querySelector("#" + alertsId);
    const submitButton = form.querySelector('[type="submit"]');

    function updatePreview() {
      if (!preview) return;
      const selected = categories.find(function (category) {
        return category.code === (categorySelect ? categorySelect.value : "");
      });
      if (selected) {
        preview.textContent = selected.next_id
          ? selected.next_id
          : "该分类编号已用尽";
      } else if (categoryIsBlocked()) {
        preview.textContent = "请先建立分类 " + requiredCode;
      } else {
        preview.textContent = "选择分类后预览";
      }
    }

    function updateSubmitState() {
      if (!submitButton) return;
      submitButton.disabled =
        !categories.length || !warehouses.length || categoryIsBlocked();
    }

    function updateCategorySelect(preferredCode) {
      if (!categorySelect) return;
      if (categoryIsBlocked()) {
        categorySelect.innerHTML =
          '<option value="" disabled selected>分类 ' +
          h(requiredCode) +
          " 尚未建立</option>";
        categorySelect.disabled = true;
      } else if (!categories.length) {
        categorySelect.innerHTML = categoryOptionMarkup(categories, "");
        categorySelect.disabled = true;
      } else {
        let selected =
          preferredCode ||
          (hasRequiredCode ? requiredCode : "") ||
          categorySelect.value ||
          "";
        const exists = categories.some(function (category) {
          return category.code === selected;
        });
        if (!exists) {
          selected = hasRequiredCode ? requiredCode : categories[0].code;
        }
        categorySelect.innerHTML = categoryOptionMarkup(categories, selected);
        categorySelect.disabled = false;
      }
      updatePreview();
      updateSubmitState();
    }

    function updateWarehouseSelect(preferredId) {
      if (!warehouseSelect) return;
      if (!warehouses.length) {
        warehouseSelect.innerHTML = warehouseOptionMarkup(warehouses, "");
        warehouseSelect.disabled = true;
        updateSubmitState();
        return;
      }
      let selected = preferredId || warehouseSelect.value || "";
      const exists = warehouses.some(function (warehouse) {
        return warehouse.id === selected;
      });
      if (!exists) selected = warehouses[0].id;
      warehouseSelect.innerHTML = warehouseOptionMarkup(warehouses, selected);
      warehouseSelect.disabled = false;
      updateSubmitState();
    }

    function updateAlerts() {
      if (!alerts) return;
      alerts.innerHTML = alertsMarkup();
    }

    function focusNextRequirement() {
      if (categoryIsBlocked() || !categories.length) {
        const button = alerts && alerts.querySelector("[data-create-category]");
        if (button) {
          button.focus();
          return;
        }
      }
      if (!warehouses.length) {
        const button = alerts && alerts.querySelector("[data-create-warehouse]");
        if (button) {
          button.focus();
          return;
        }
      }
      if (categorySelect && !categorySelect.disabled) categorySelect.focus();
    }

    updateCategorySelect("");
    updateWarehouseSelect("");
    if (categorySelect) {
      categorySelect.addEventListener("change", updatePreview);
    }

    form.addEventListener("click", function (event) {
      if (event.target.closest("[data-create-category]")) {
        event.preventDefault();
        const locking = categoryIsBlocked();
        openCategoryModal({
          code: locking ? requiredCode : "",
          lockCode: locking,
          onCreated: function (category) {
            const index = categories.findIndex(function (candidate) {
              return candidate.code === category.code;
            });
            if (index === -1) {
              categories.push(category);
            } else {
              categories[index] = category;
            }
            updateAlerts();
            updateCategorySelect(category.code);
            focusNextRequirement();
          },
        });
        return;
      }
      if (event.target.closest("[data-create-warehouse]")) {
        event.preventDefault();
        openWarehouseCreateModal({
          onCreated: function (warehouse) {
            const exists = warehouses.some(function (candidate) {
              return candidate.id === warehouse.id;
            });
            if (!exists) warehouses.push(warehouse);
            updateAlerts();
            updateWarehouseSelect(warehouse.id);
            focusNextRequirement();
          },
        });
      }
    });

    bindForm(form, async function () {
      if (categoryIsBlocked()) {
        throw new ApiError(
          "请先添加分类 " + requiredCode + "，再添加物品。"
        );
      }
      if (!categories.length) {
        throw new ApiError("请先添加一个分类，再添加物品。");
      }
      if (!warehouses.length) {
        throw new ApiError("请先新建一个仓库，再添加物品。");
      }
      const formData = new FormData(form);
      const data = await api("/api/items", {
        method: "POST",
        body: {
          category_code: String(formData.get("category_code") || ""),
          name: String(formData.get("name") || ""),
          acquired_on: String(formData.get("acquired_on") || ""),
          price: String(formData.get("price") || ""),
          warehouse_id: String(formData.get("warehouse_id") || ""),
        },
      });
      modal.close();
      toast(data.item.id + " 已添加", "success");
      if (opts.onCreated) {
        opts.onCreated(data.item);
      } else if (parseRoute(window.location.pathname).type === "items") {
        const params = new URLSearchParams(window.location.search);
        const filteredCategory = String(params.get("category") || "").toUpperCase();
        if (filteredCategory && filteredCategory !== data.item.category_code) {
          window.history.replaceState({}, "", "/items");
        }
        refreshCurrentPage({ scroll: false });
      } else {
        navigate(itemPath(data.item.id));
      }
    });
  }

  async function openInboundModal(warehouse) {
    let categories = [];
    let outOfStock = [];
    try {
      const result = await Promise.all([
        api("/api/categories"),
        api("/api/items?status=out_of_stock"),
      ]);
      categories = result[0].categories || [];
      outOfStock = result[1].items || [];
    } catch (error) {
      toast(error.message || "未能读取分类与物品信息", "error");
      return;
    }

    const newPanelId = uid("inbound-new-panel");
    const existingPanelId = uid("inbound-existing-panel");
    const newTabId = uid("inbound-new-tab");
    const existingTabId = uid("inbound-existing-tab");
    const categorySelectId = uid("inbound-category");

    function existingRows() {
      if (!outOfStock.length) {
        return (
          '<div class="pick-empty">' +
          '<div class="empty-line-icon">' +
          icon("box") +
          "</div>" +
          "<strong>没有等待入库的物品</strong>" +
          "<p>出库后的物品会保留编号，可以在这里重新入库。也可以切换到「新物品」录入一件。</p>" +
          "</div>"
        );
      }
      return (
        '<div class="existing-search">' +
        icon("search") +
        '<input type="search" id="existing-search-input" placeholder="搜索已出库物品…" autocomplete="off">' +
        "</div>" +
        '<div class="pick-list" id="existing-pick-list">' +
        outOfStock
          .map(function (item) {
            const searchText = [item.id, item.name, item.category_name]
              .join(" ")
              .toLowerCase();
            return (
              '<label class="pick-row" data-pick-search="' +
              h(searchText) +
              '">' +
              '<input class="pick-radio" type="radio" name="item_id" value="' +
              h(item.id) +
              '">' +
              '<span class="pick-check">' +
              icon("check") +
              "</span>" +
              '<span class="pick-main"><strong>' +
              h(item.name) +
              '</strong><small class="mono">' +
              h(item.id) +
              " · " +
              h(item.category_name) +
              "</small></span>" +
              '<span class="pick-meta">' +
              icon("calendar") +
              formatDate(item.acquired_on) +
              "</span>" +
              "</label>"
            );
          })
          .join("") +
        "</div>" +
        '<p class="pick-no-result" id="pick-no-result" hidden>没有匹配的物品，换个关键词试试。</p>'
      );
    }

    const body =
      '<div class="inbound-target"><span class="inbound-target-icon">' +
      icon("pin") +
      '</span><div><span>目标仓库</span><strong' +
      (warehouseLabel(warehouse) ? "" : ' class="mono"') +
      ">" +
      h(warehouseTitle(warehouse)) +
      "</strong>" +
      (warehouseLabel(warehouse)
        ? '<small class="mono">' + h(warehouse.id) + "</small>"
        : "") +
      "</div></div>" +
      '<div class="tab-switcher" role="tablist" aria-label="入库方式">' +
      '<button class="tab-button is-active" type="button" role="tab" id="' +
      newTabId +
      '" aria-selected="true" aria-controls="' +
      newPanelId +
      '" data-inbound-tab="new">' +
      icon("plus") +
      "新物品</button>" +
      '<button class="tab-button" type="button" role="tab" id="' +
      existingTabId +
      '" aria-selected="false" aria-controls="' +
      existingPanelId +
      '" tabindex="-1" data-inbound-tab="existing">' +
      icon("archive") +
      "已有物品" +
      (outOfStock.length
        ? '<span class="tab-count">' + outOfStock.length + "</span>"
        : "") +
      "</button></div>" +
      '<section class="tab-panel" id="' +
      newPanelId +
      '" role="tabpanel" aria-labelledby="' +
      newTabId +
      '" data-inbound-panel="new">' +
      '<form class="modal-form inbound-form" id="inbound-new-form" novalidate>' +
      formErrorMarkup() +
      (!categories.length
        ? '<div class="callout callout-attention">' +
          icon("tag") +
          "<div><strong>先创建一个分类</strong><p>分类会决定编号的前三位。</p></div>" +
          '<button class="inline-create-category" type="button" data-create-category>' +
          icon("plus") +
          "新建分类</button></div>"
        : "") +
      '<div class="field"><div class="field-label-row"><label class="field-label" for="' +
      categorySelectId +
      '">分类 <em>必填</em></label>' +
      '<button class="inline-text-button" type="button" data-create-category>新建分类 ' +
      icon("plus") +
      "</button></div>" +
      '<select id="' +
      categorySelectId +
      '" class="input select-input" name="category_code" required' +
      (categories.length ? "" : " disabled") +
      ">" +
      categoryOptionMarkup(categories, "") +
      "</select></div>" +
      '<label class="field"><span class="field-label">物品名称 <em>必填</em></span>' +
      '<input class="input" type="text" name="name" maxlength="100" placeholder="例如：米白色羊毛围巾" required autofocus>' +
      "</label>" +
      '<div class="field-grid"><label class="field"><span class="field-label">入手时间 <em>必填</em></span>' +
      '<div class="input-with-icon">' +
      icon("calendar") +
      '<input class="input" type="date" name="acquired_on" max="' +
      todayISO() +
      '" value="' +
      todayISO() +
      '" required></div></label>' +
      '<label class="field"><span class="field-label">入手价 <em>必填</em></span>' +
      '<div class="input-prefix"><span>¥</span><input class="input" type="number" name="price" min="-1" step="0.01" inputmode="decimal" placeholder="0.00 或 -1" required></div>' +
      '<span class="field-hint">价格未知时填 -1。</span></label></div>' +
      '<div class="field-readonly"><span>当前位置 / 自动写入</span><strong' +
      (warehouseLabel(warehouse) ? "" : ' class="mono"') +
      ">" +
      h(warehouseTitle(warehouse)) +
      (warehouseLabel(warehouse)
        ? '<em class="readonly-code mono">' + h(warehouse.id) + "</em>"
        : "") +
      "</strong></div>" +
      '<div class="number-preview"><span>系统将生成编号</span><strong class="mono" id="new-item-preview">选择分类后预览</strong></div>' +
      '<div class="modal-actions"><button class="button button-quiet" type="button" data-modal-close>取消</button>' +
      '<button class="button button-primary" type="submit">' +
      icon("inbound") +
      "生成编号并入库</button></div>" +
      "</form></section>" +
      '<section class="tab-panel" id="' +
      existingPanelId +
      '" role="tabpanel" aria-labelledby="' +
      existingTabId +
      '" data-inbound-panel="existing" hidden>' +
      '<form class="modal-form inbound-form" id="inbound-existing-form" novalidate>' +
      formErrorMarkup() +
      existingRows() +
      '<div class="modal-actions"><button class="button button-quiet" type="button" data-modal-close>取消</button>' +
      '<button class="button button-primary" type="submit" id="existing-submit"' +
      (outOfStock.length ? " disabled" : "") +
      ">" +
      icon("inbound") +
      "确认入库</button></div>" +
      "</form></section>";

    const modal = openModal({
      eyebrow: "INBOUND",
      title: "办理入库",
      description:
        "把一件新物品或已出库物品，收进" +
        (warehouseLabel(warehouse) ? "「" + warehouseLabel(warehouse) + "」。" : " " + warehouse.id + "。"),
      size: "lg",
      initialFocus: categories.length
        ? "#" + categorySelectId
        : ".inbound-form [name=name]",
      body: body,
    });

    const tabs = Array.from(modal.dialog.querySelectorAll("[data-inbound-tab]"));
    const panels = Array.from(modal.dialog.querySelectorAll("[data-inbound-panel]"));

    function switchTab(target) {
      tabs.forEach(function (tab) {
        const active = tab.getAttribute("data-inbound-tab") === target;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-inbound-panel") !== target;
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchTab(tab.getAttribute("data-inbound-tab"));
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const index = tabs.indexOf(tab);
        const nextIndex =
          event.key === "ArrowRight"
            ? (index + 1) % tabs.length
            : (index - 1 + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        switchTab(tabs[nextIndex].getAttribute("data-inbound-tab"));
      });
    });

    const newForm = modal.dialog.querySelector("#inbound-new-form");
    const existingForm = modal.dialog.querySelector("#inbound-existing-form");
    const categorySelect = modal.dialog.querySelector('[name="category_code"]');
    const preview = modal.dialog.querySelector("#new-item-preview");

    function refreshCategoryViews() {
      if (!categorySelect) return;
      const selected = categorySelect.value;
      categorySelect.innerHTML = categoryOptionMarkup(categories, selected);
      categorySelect.disabled = !categories.length;
      const selectedCategory = categories.find(function (category) {
        return category.code === categorySelect.value;
      });
      if (preview) {
        preview.textContent = selectedCategory
          ? selectedCategory.next_id
            ? selectedCategory.next_id
            : "该分类编号已用尽"
          : "选择分类后预览";
      }
      const callout = newForm.querySelector(".callout-attention");
      if (categories.length && callout) callout.remove();
    }

    refreshCategoryViews();
    if (categorySelect) {
      categorySelect.addEventListener("change", refreshCategoryViews);
    }

    Array.from(modal.dialog.querySelectorAll("[data-create-category]")).forEach(
      function (button) {
        button.addEventListener("click", function () {
          openCategoryModal({
            onCreated: function (category) {
              categories.push(category);
              if (categorySelect) categorySelect.value = category.code;
              refreshCategoryViews();
              if (categorySelect) categorySelect.focus();
            },
          });
        });
      }
    );

    bindForm(newForm, async function () {
      const formData = new FormData(newForm);
      if (!categories.length) {
        throw new ApiError("请先创建一个分类，再办理入库。", {
          fields: { category_code: "请先创建分类" },
        });
      }
      if (!String(formData.get("category_code") || "")) {
        throw new ApiError("请选择物品所属的分类。");
      }
      const data = await api("/api/items", {
        method: "POST",
        body: {
          category_code: String(formData.get("category_code") || ""),
          name: String(formData.get("name") || ""),
          acquired_on: String(formData.get("acquired_on") || ""),
          price: String(formData.get("price") || ""),
          warehouse_id: warehouse.id,
        },
      });
      modal.close();
      toast(data.item.id + " 已收入 " + warehouseTitle(warehouse), "success");
      refreshCurrentPage();
    });

    if (existingForm) {
      bindForm(existingForm, async function () {
        const formData = new FormData(existingForm);
        const itemId = String(formData.get("item_id") || "");
        if (!itemId) {
          throw new ApiError("请选择一件要入库的物品。");
        }
        const data = await api(
          "/api/items/" + encodeURIComponent(itemId) + "/inbound",
          {
            method: "POST",
            body: { warehouse_id: warehouse.id },
          }
        );
        modal.close();
        toast(data.item.id + " 已收入 " + warehouseTitle(warehouse), "success");
        refreshCurrentPage();
      });

      const existingSubmit = modal.dialog.querySelector("#existing-submit");
      existingForm.addEventListener("change", function (event) {
        if (event.target && event.target.name === "item_id") {
          if (existingSubmit) existingSubmit.disabled = false;
        }
      });

      const existingSearch = modal.dialog.querySelector("#existing-search-input");
      if (existingSearch) {
        existingSearch.addEventListener("input", function () {
          const needle = existingSearch.value.trim().toLowerCase();
          let visibleCount = 0;
          Array.from(modal.dialog.querySelectorAll("[data-pick-search]")).forEach(
            function (row) {
              const matches =
                !needle ||
                row.getAttribute("data-pick-search").indexOf(needle) !== -1;
              row.hidden = !matches;
              if (matches) visibleCount += 1;
            }
          );
          const noResult = modal.dialog.querySelector("#pick-no-result");
          if (noResult) noResult.hidden = visibleCount !== 0;
        });
      }
    }
  }

  function openOutboundModal(item) {
    const modal = openModal({
      eyebrow: "OUTBOUND",
      title: "确认出库",
      description: "出库不会删除档案，之后可以重新入库。",
      size: "sm",
      initialFocus: null,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<div class="outbound-card"><span class="outbound-card-icon">' +
        icon("outbound") +
        '</span><div><span class="mono">' +
        h(item.id) +
        "</span><strong>" +
        h(item.name) +
        "</strong><p>当前位于 " +
        h(item.warehouse ? warehouseTitle(item.warehouse) : "仓库") +
        "。出库后，它会进入「已出库」状态，可随时重新入库。</p></div></div>" +
        '<div class="callout callout-quiet">' +
        icon("info") +
        "<p>物品编号 <span class=\"mono\">" +
        h(item.id) +
        "</span> 的档案与流转记录都会保留，之后可以随时重新入库。</p></div>" +
        formActions({
          submitLabel: "确认出库",
          submitIcon: "outbound",
          danger: true,
          cancelLabel: "留在库中",
        }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    bindForm(form, async function () {
      const data = await api(
        "/api/items/" + encodeURIComponent(item.id) + "/outbound",
        { method: "POST", body: {} }
      );
      modal.close();
      toast(data.item.id + " 已出库", "success");
      refreshCurrentPage();
    });
  }

  function openItemEditModal(item) {
    const nameId = uid("edit-name");
    const modal = openModal({
      eyebrow: "EDIT RECORD",
      title: "编辑物品资料",
      description: "编号、分类与当前位置不在这里修改。",
      initialFocus: "#" + nameId,
      body:
        '<form class="modal-form" novalidate>' +
        formErrorMarkup() +
        '<div class="locked-record"><span class="locked-id mono">' +
        h(item.id) +
        "</span><span>" +
        h(item.category_code + " · " + item.category_name) +
        "</span></div>" +
        '<label class="field"><span class="field-label">名称 <em>必填</em></span>' +
        '<input id="' +
        nameId +
        '" class="input" type="text" name="name" maxlength="100" value="' +
        h(item.name) +
        '" required autofocus></label>' +
        '<div class="field-grid"><label class="field"><span class="field-label">入手时间 <em>必填</em></span>' +
        '<div class="input-with-icon">' +
        icon("calendar") +
        '<input class="input" type="date" name="acquired_on" max="' +
        todayISO() +
        '" value="' +
        h(item.acquired_on) +
        '" required></div></label>' +
        '<label class="field"><span class="field-label">入手价 <em>必填</em></span>' +
        '<div class="input-prefix"><span>¥</span><input class="input" type="number" name="price" min="-1" step="0.01" inputmode="decimal" placeholder="0.00 或 -1" value="' +
        h(Number(item.price_cents) === -1 ? "-1" : (item.price_cents / 100).toFixed(2)) +
        '" required></div>' +
        '<span class="field-hint">价格未知时填 -1。</span></label></div>' +
        '<div class="field-readonly"><span>当前位置 / 只读</span><strong' +
        (item.warehouse && warehouseLabel(item.warehouse) ? "" : ' class="mono"') +
        ">" +
        h(item.warehouse ? warehouseTitle(item.warehouse) : "已出库") +
        (item.warehouse && warehouseLabel(item.warehouse)
          ? '<em class="readonly-code mono">' + h(item.warehouse.id) + "</em>"
          : "") +
        "</strong></div>" +
        formActions({ submitLabel: "保存修改", submitIcon: "check" }) +
        "</form>",
    });
    const form = modal.dialog.querySelector("form");
    bindForm(form, async function () {
      const formData = new FormData(form);
      const data = await api("/api/items/" + encodeURIComponent(item.id), {
        method: "PATCH",
        body: {
          name: String(formData.get("name") || ""),
          acquired_on: String(formData.get("acquired_on") || ""),
          price: String(formData.get("price") || ""),
        },
      });
      modal.close();
      toast(data.item.id + " 的资料已更新", "success");
      refreshCurrentPage({ scroll: false });
    });
  }

  // ---------------------------------------------------------------- toasts

  function toast(message, type) {
    while (toastLayer.children.length >= 3) {
      toastLayer.firstElementChild.remove();
    }
    const element = document.createElement("div");
    element.className = "toast " + (type === "error" ? "is-error" : "is-success");
    element.setAttribute("role", type === "error" ? "alert" : "status");
    element.innerHTML =
      '<span class="toast-icon">' +
      icon(type === "error" ? "alert" : "check") +
      "</span>" +
      '<span class="toast-message"></span>' +
      '<button class="toast-close" type="button" aria-label="关闭提示">' +
      icon("close") +
      "</button>";
    element.querySelector(".toast-message").textContent = message;
    toastLayer.appendChild(element);
    const dismiss = function () {
      if (!element.isConnected) return;
      element.classList.add("is-leaving");
      window.setTimeout(function () {
        element.remove();
      }, 220);
    };
    element.querySelector(".toast-close").addEventListener("click", dismiss);
    window.setTimeout(dismiss, type === "error" ? 5200 : 3600);
  }

  // ------------------------------------------------------------- navigation

  async function renderRoute(options) {
    const opts = options || {};
    routeRun += 1;
    const runId = routeRun;
    if (pageAbort) pageAbort.abort();
    const controller = new AbortController();
    pageAbort = controller;
    const route = parseRoute(window.location.pathname);
    const active = activeForRoute(route);

    if (opts.scroll !== false) {
      window.scrollTo(0, 0);
    }

    if (route.type !== "item" && route.type !== "warehouse") {
      setTitle(
        route.type === "home"
          ? null
          : route.type === "items"
            ? "物品目录"
            : route.type === "warehouses"
              ? "仓库"
              : route.type === "categories"
                ? "分类"
                : null
      );
    }

    try {
      if (route.type === "home") {
        await showHome(controller.signal);
      } else if (route.type === "items") {
        await showItems(controller.signal);
      } else if (route.type === "warehouses") {
        await showWarehouses(controller.signal);
      } else if (route.type === "categories") {
        await showCategories(controller.signal);
      } else if (route.type === "item") {
        await showItem(route.id, controller.signal);
      } else if (route.type === "warehouse") {
        await showWarehouse(route.id, controller.signal);
      } else {
        renderRouteNotFound(route);
      }
    } catch (error) {
      if (!isAbort(error) && runId === routeRun) {
        renderLoadError(active, error);
      }
    }
  }

  // ---------------------------------------------------------------- handlers

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[data-link]");
    if (!link) return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    const href = link.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    event.preventDefault();
    navigate(href);
  });

  window.addEventListener("popstate", function () {
    renderRoute();
  });

  // Expose a tiny hook for debugging in the browser console.
  window.archiveApp = {
    refresh: function () {
      renderRoute();
    },
  };

  renderRoute();
})();
