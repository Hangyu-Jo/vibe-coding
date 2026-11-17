/* =========================================================
   메인 페이지: 검색, 카테고리 필터, 정렬, 앱 카드 목록
   ========================================================= */

// 화면의 현재 상태
const state = {
  keyword: "",
  category: "전체",
  sort: "newest",
};

function renderChips() {
  const names = ["전체", ...Object.keys(CATEGORIES)];
  document.getElementById("chips").innerHTML = names
    .map((name) => {
      const active = name === state.category ? "active" : "";
      return `<button class="chip ${active}" type="button" data-category="${esc(name)}">${esc(name)}</button>`;
    })
    .join("");
}

function getVisibleApps() {
  const keyword = state.keyword.trim().toLowerCase();

  let list = db.apps.filter((app) => {
    const matchCategory = state.category === "전체" || app.category === state.category;
    const matchKeyword =
      !keyword ||
      app.name.toLowerCase().includes(keyword) ||
      app.tagline.toLowerCase().includes(keyword);
    return matchCategory && matchKeyword;
  });

  const sorters = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    popular: (a, b) => purchaseCount(b.id) - purchaseCount(a.id),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  return list.sort(sorters[state.sort]);
}

function renderApps() {
  const apps = getVisibleApps();
  const grid = document.getElementById("app-grid");
  document.getElementById("result-count").textContent = `앱 ${apps.length}개`;

  if (apps.length === 0) {
    grid.innerHTML = `<div class="empty" style="grid-column: 1 / -1">조건에 맞는 앱이 없어요.</div>`;
    return;
  }
  grid.innerHTML = apps.map(appCardHTML).join("");
}

// 이벤트 연결
document.getElementById("search").addEventListener("input", (e) => {
  state.keyword = e.target.value;
  renderApps();
});

document.getElementById("sort").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderApps();
});

document.getElementById("chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.category = chip.dataset.category;
  renderChips();
  renderApps();
});

renderChips();
renderApps();
