/* =========================================================
   마이페이지
   - 보유 포인트
   - 구매한 앱: [앱 열기], [주소 복사]
   - 내가 등록한 앱: 판매 수, 번 포인트
   ========================================================= */

const me = requireLogin();
let currentTab = "purchased";

function renderProfile() {
  document.getElementById("user-name").textContent = `${me.name} 님`;
  document.getElementById("user-email").textContent = me.email;
  document.getElementById("user-points").textContent = formatPoints(me.points);
}

function purchasedHTML() {
  const mine = db.purchases
    .filter((p) => p.buyerId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (mine.length === 0) {
    return `<div class="empty">아직 구매한 앱이 없어요. <a href="index.html">마켓 둘러보기</a></div>`;
  }
  return mine
    .map((p) => {
      const app = getApp(p.appId);
      if (!app) return "";
      return `
        <div class="item">
          ${thumbHTML(app)}
          <div class="item-body">
            <a href="detail.html?id=${encodeURIComponent(app.id)}">${esc(app.name)}</a>
            <p class="muted">${formatPrice(p.price)} · ${formatDate(p.createdAt)} 구매</p>
          </div>
          <div class="item-actions">
            <a class="btn btn-primary btn-sm" href="${esc(app.url)}" target="_blank" rel="noopener">앱 열기 ↗</a>
            <button class="btn btn-sm" type="button" data-copy="${esc(app.id)}">주소 복사</button>
          </div>
        </div>`;
    })
    .join("");
}

function sellingHTML() {
  const mine = db.apps
    .filter((a) => a.sellerId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (mine.length === 0) {
    return `<div class="empty">아직 등록한 앱이 없어요. <a href="sell.html">앱 등록하기</a></div>`;
  }
  return mine
    .map((app) => {
      const sales = db.purchases.filter((p) => p.appId === app.id);
      const earned = sales.reduce((sum, p) => sum + p.price, 0);
      return `
        <div class="item">
          ${thumbHTML(app)}
          <div class="item-body">
            <a href="detail.html?id=${encodeURIComponent(app.id)}">${esc(app.name)}</a>
            <p class="muted">${formatPrice(app.price)} · 판매 ${sales.length}건 · 수익 ${formatPoints(earned)}</p>
          </div>
          <div class="item-actions">
            <a class="btn btn-sm" href="${esc(app.url)}" target="_blank" rel="noopener">앱 열기 ↗</a>
          </div>
        </div>`;
    })
    .join("");
}

function renderList() {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === currentTab));
  document.getElementById("list").innerHTML = currentTab === "purchased" ? purchasedHTML() : sellingHTML();
}

if (me) {
  renderProfile();
  renderList();

  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      currentTab = t.dataset.tab;
      renderList();
    })
  );

  // [주소 복사] 버튼들
  document.getElementById("list").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const app = getApp(btn.dataset.copy);
    if (app) copyText(absoluteUrl(app.url));
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("모든 계정, 등록한 앱, 구매 기록을 지우고 처음 상태로 되돌릴까요?")) return;
    resetDB();
    location.href = "index.html";
  });
}
