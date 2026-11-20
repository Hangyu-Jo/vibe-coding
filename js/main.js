/* =========================================================
   메인 페이지: 검색, 카테고리 필터, 정렬, 앱 카드 목록
   ========================================================= */

// 화면의 현재 상태
const state = {
  keyword: "",
  category: "전체",
  sort: "newest",
};
//이전에도 이용했듯 innerHTML은 앞서 (보통은 id를 지정해서) 고른 html 객체의 내용을 읽거나 쓸 수 있다.(쓸 때는 '='이용)
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
  const chip = e.target.closest(".chip");  //"click" 의 경우 e.target은 클릭된 가장 안쪽 element를 지칭하는데 .closest(선택자)를 적용하면 자기 자신부터 거슬러 올라가며 해당 선택자에 맞는 첫 요소를 찾아준다. 따라서 버튼 안에 다른 element가 있어도 id="chip"인 버튼 객체를 정확히 지정함.
  if (!chip) return;
  state.category = chip.dataset.category; //html에서 data-category와 같이 data-로 시작하는 속성에 해당하는 값을 읽어올 때 dataset을 이용. dataset은 data-로 시작하는 속성들을 모아둔 객체
  renderChips();
  renderApps();
});

renderChips();
renderApps();
