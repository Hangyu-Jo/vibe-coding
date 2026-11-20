/* =========================================================
   공통 기능
   - 데이터 저장/불러오기 (localStorage)
   - 로그인 상태 관리
   - 공통 헤더 그리기
   - 구매 처리 (포인트 이동)
   - 자잘한 도우미 함수
   ========================================================= */

const STORAGE_KEY = "deepsolve:v1";

/* ---------- 1. 데이터 저장소 ---------- */

// 브라우저에 저장된 데이터를 불러옵니다. 없으면 목 데이터로 시작합니다.
function loadDB() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("저장된 데이터를 읽지 못해 기본 데이터로 시작합니다.", e);
  }
  return createSeedDB();
}

function createSeedDB() {
  // 원본 목 데이터가 바뀌지 않도록 복사해서 씁니다
  return {
    users: structuredClone(SEED_USERS),
    apps: structuredClone(SEED_APPS),
    purchases: structuredClone(SEED_PURCHASES),
    currentUserId: null,
  };
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    showToast("브라우저에 저장하지 못했어요. 새로고침하면 변경 내용이 사라질 수 있어요.");
  }
}

// 데모 데이터를 처음 상태로 되돌립니다
function resetDB() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* 무시 */ }
  db = createSeedDB();
}

// 페이지가 열릴 때 한 번 불러와서 계속 사용합니다
let db = loadDB();

/* ---------- 2. 조회 도우미 ---------- */

function getUser(id) {
  return db.users.find((u) => u.id === id) || null;
}
function getApp(id) {
  return db.apps.find((a) => a.id === id) || null;
}
function getCurrentUser() {
  return db.currentUserId ? getUser(db.currentUserId) : null;
}
function purchaseCount(appId) {
  return db.purchases.filter((p) => p.appId === appId).length;
}
function hasPurchased(userId, appId) {
  return db.purchases.some((p) => p.buyerId === userId && p.appId === appId);
}
// 이 사용자가 앱을 열 수 있는가? (구매했거나 본인이 판매자)
function canOpenApp(user, app) {
  if (!user) return false;
  return app.sellerId === user.id || hasPurchased(user.id, app.id);
}

/* ---------- 3. 로그인 / 회원가입 ---------- */
// ⚠️ 데모용입니다. 비밀번호를 브라우저에 그대로 저장하므로 실제 비밀번호를 쓰면 안 됩니다.

function signUp({ name, email, password }) {
  email = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) {
    return { ok: false, message: "이미 가입된 이메일이에요." };
  }
  const user = {
    id: makeId("u"),
    name: name.trim(),
    email, //축약표현(키와 변수명이 같은 경우 사용)
    password,
    points: STARTING_POINTS,
  };
  db.users.push(user);
  db.currentUserId = user.id;
  saveDB();
  return { ok: true, user };
}

function logIn({ email, password }) {
  email = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email === email);
  if (!user || user.password === null || user.password !== password) {
    return { ok: false, message: "이메일 또는 비밀번호가 맞지 않아요." };
  }
  db.currentUserId = user.id;
  saveDB();
  return { ok: true, user };
}

function logOut() {
  db.currentUserId = null;
  saveDB();
}

// 로그인이 필요한 페이지에서 호출합니다. 로그인 안 했으면 로그인 페이지로 보냅니다.
function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    const next = location.pathname.split("/").pop() + location.search;
    location.href = "login.html?next=" + encodeURIComponent(next);
    return null;
  }
  return user;
}

/* ---------- 4. 구매 (포인트 이동) ---------- */
// 확인 → 구매자 포인트 차감 → 판매자 포인트 증가 → 구매 기록 추가
// 네 가지가 모두 끝난 뒤 한 번에 저장합니다.

function purchaseApp(appId) {
  const buyer = getCurrentUser();
  const app = getApp(appId);

  if (!buyer) return { ok: false, message: "로그인이 필요해요." };
  if (!app) return { ok: false, message: "앱을 찾을 수 없어요." };
  if (app.sellerId === buyer.id) return { ok: false, message: "내가 등록한 앱은 구매할 수 없어요." };
  if (hasPurchased(buyer.id, app.id)) return { ok: false, message: "이미 구매한 앱이에요." };
  if (buyer.points < app.price) {
    return { ok: false, message: `포인트가 ${formatPoints(app.price - buyer.points)} 부족해요.` };
  }

  const seller = getUser(app.sellerId);
  buyer.points -= app.price;
  if (seller) seller.points += app.price;
  db.purchases.push({
    id: makeId("p"),
    buyerId: buyer.id,
    appId: app.id,
    price: app.price,
    createdAt: new Date().toISOString(),
  });
  saveDB();
  return { ok: true };
}

/* ---------- 5. 앱 등록 ---------- */

function createApp(fields) {
  const user = getCurrentUser();
  const app = {
    id: makeId("a"),
    name: fields.name.trim(),
    tagline: fields.tagline.trim(),
    description: fields.description.trim(),
    category: fields.category,
    price: Number(fields.price),
    url: fields.url.trim(),
    screenshot: fields.screenshot.trim(),
    tool: fields.tool.trim(),
    sellerId: user.id,
    createdAt: new Date().toISOString(),
  };
  db.apps.push(app);
  saveDB();
  return app;
}

/* ---------- 6. 공통 헤더 ---------- */
// 각 페이지의 <header id="site-header"></header> 자리에 헤더를 그립니다.

function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;

  const page = location.pathname.split("/").pop() || "index.html";
  const user = getCurrentUser();
  const navItems = [
    { href: "index.html", label: "마켓", match: ["index.html", "detail.html", ""] },
    { href: "sell.html", label: "앱 등록", match: ["sell.html"] },
    { href: "mypage.html", label: "마이페이지", match: ["mypage.html"] },
  ];

  const nav = navItems
    .map((item) => {
      const active = item.match.includes(page) ? "active" : "";
      return `<a class="${active}" href="${item.href}">${item.label}</a>`;
    })
    .join("");

  const right = user
    ? `<span class="points-badge" title="보유 포인트">${formatPoints(user.points)}</span>
       <span class="user-name">${esc(user.name)} 님</span>
       <button class="btn-link" id="logout-btn" type="button">로그아웃</button>`
    : `<a class="btn btn-primary btn-sm" href="login.html">로그인</a>`;

  el.className = "site-header";
  el.innerHTML = `
    <div class="container">
      <a class="logo" href="index.html">deep<span>solve</span></a>
      <nav class="nav">${nav}</nav>
      <div class="header-user">${right}</div>
    </div>`;

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logOut();
      location.href = "index.html";
    });
  }
}

/* ---------- 7. 앱 카드 / 썸네일 ---------- */

function thumbHTML(app) {
  if (app.screenshot) {
    return `<div class="thumb"><img src="${esc(app.screenshot)}" alt="${esc(app.name)} 스크린샷" loading="lazy"></div>`;
  }
  return `<div class="thumb" aria-hidden="true">${CATEGORIES[app.category] || "✨"}</div>`;
}

function appCardHTML(app) {
  const seller = getUser(app.sellerId);
  return `
    <a class="app-card" href="detail.html?id=${encodeURIComponent(app.id)}">
      ${thumbHTML(app)}
      <div class="app-card-body">
        <span><span class="tag">${esc(app.category)}</span></span>
        <h3 class="app-card-title">${esc(app.name)}</h3>
        <p class="app-card-tagline">${esc(app.tagline)}</p>
        <div class="app-card-meta">
          <span>${esc(seller ? seller.name : "알 수 없음")} · 구매 ${purchaseCount(app.id)}</span>
          <span class="price">${formatPrice(app.price)}</span>
        </div>
      </div>
    </a>`;
}

/* ---------- 8. 도우미 함수 ---------- */

// 사용자가 입력한 글자를 HTML로 해석하지 않도록 바꿉니다 (보안)
function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPoints(n) {
  return n.toLocaleString("ko-KR") + "P";
}
function formatPrice(n) {
  return n === 0 ? "무료" : formatPoints(n);
}
function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 앱 주소를 완전한 주소(https://...)로 바꿉니다. 샘플 앱처럼 상대 주소인 경우에 필요합니다.
function absoluteUrl(url) {
  return new URL(url, location.href).href;
}

// http/https 주소이거나 이 사이트 안의 상대 주소인지 확인합니다 (javascript: 같은 위험한 주소 차단)
function isSafeUrl(url) {
  try {
    const u = new URL(url, location.href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (e) {
    return false;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("주소를 복사했어요.");
  } catch (e) {
    window.prompt("아래 주소를 복사하세요.", text);
  }
}

let toastTimer;
function showToast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2500);
}

/* ---------- 9. 시작 ---------- */
// 다른 탭에서 로그인/구매하면 이 탭에도 반영되도록 합니다
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  // 회원가입 직후 한 번만 환영 메시지를 보여줍니다
  if (sessionStorage.getItem("deepsolve:welcome")) {
    sessionStorage.removeItem("deepsolve:welcome");
    showToast(`가입을 환영해요! ${formatPoints(STARTING_POINTS)}를 드렸어요 🎁`);
  }
});
