/* =========================================================
   앱 상세 페이지
   - 주소의 ?id= 값으로 앱 하나를 찾아 보여줍니다
   - 미리 써보기: 60초 동안 iframe으로 앱을 체험
   - 구매: 포인트로 구매하면 [앱 열기] 버튼으로 바뀜
   ========================================================= */

const params = new URLSearchParams(location.search);
const appId = params.get("id");
const root = document.getElementById("detail-root");

let previewTimer = null;

function render() {
  const app = getApp(appId);
  if (!app) {
    root.innerHTML = `<div class="empty">앱을 찾을 수 없어요. <a href="index.html">마켓으로 돌아가기</a></div>`;
    return;
  }
  document.title = `${app.name} · deepsolve`;

  const seller = getUser(app.sellerId);
  const user = getCurrentUser();
  const owned = canOpenApp(user, app);
  const isSeller = user && user.id === app.sellerId;

  root.innerHTML = `
    <div class="detail">
      <section>
        ${thumbHTML(app)}
        <p class="description">${esc(app.description)}</p>

        <div class="preview">
          <div class="preview-head">
            <h2 style="font-size:18px">${owned ? "앱 사용하기" : "미리 써보기"}</h2>
            <span class="countdown" id="countdown"></span>
          </div>
          <div class="preview-frame" id="preview-frame">
            <div class="preview-start">
              <button class="btn btn-primary" id="preview-btn" type="button">
                ▶ ${owned ? "여기서 열기" : `${PREVIEW_SECONDS}초 미리 써보기`}
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside class="side panel">
        <span><span class="tag">${esc(app.category)}</span></span>
        <h1>${esc(app.name)}</h1>
        <p class="muted">${esc(app.tagline)}</p>
        <div class="price">${formatPrice(app.price)}</div>
        <div id="action-area">${actionAreaHTML(app, user, owned, isSeller)}</div>
        <div class="info">
          <div><span class="muted">판매자</span><span>${esc(seller ? seller.name : "알 수 없음")}</span></div>
          <div><span class="muted">만든 도구</span><span>${esc(app.tool || "-")}</span></div>
          <div><span class="muted">구매 수</span><span>${purchaseCount(app.id)}</span></div>
          <div><span class="muted">등록일</span><span>${formatDate(app.createdAt)}</span></div>
        </div>
      </aside>
    </div>`;

  bindEvents(app, owned);
}

// 구매 버튼 영역: 상태에 따라 다른 버튼을 보여줍니다 (조건부 렌더링)
function actionAreaHTML(app, user, owned, isSeller) {
  if (owned) {
    return `
      <div class="owned">
        <strong>${isSeller ? "내가 등록한 앱이에요" : "✅ 구매한 앱이에요"}</strong>
        <a class="btn btn-primary btn-block" href="${esc(app.url)}" target="_blank" rel="noopener">앱 열기 ↗</a>
        <button class="btn btn-block btn-sm" id="copy-btn" type="button">주소 복사</button>
        <code>${esc(absoluteUrl(app.url))}</code>
      </div>`;
  }
  if (!user) {
    return `<a class="btn btn-primary btn-block" href="login.html?next=${encodeURIComponent("detail.html?id=" + app.id)}">로그인하고 구매하기</a>`;
  }
  const label = app.price === 0 ? "무료로 받기" : `${formatPoints(app.price)}로 구매하기`;
  const lack = user.points < app.price;
  return `
    <button class="btn btn-primary btn-block" id="buy-btn" type="button" ${lack ? "disabled" : ""}>${label}</button>
    <p class="muted" style="font-size:13px;margin-top:6px">
      보유 ${formatPoints(user.points)}${lack ? ` · <span style="color:var(--danger)">${formatPoints(app.price - user.points)} 부족</span>` : ""}
    </p>`;
}

function bindEvents(app, owned) {
  const buyBtn = document.getElementById("buy-btn");
  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      const msg = app.price === 0
        ? `'${app.name}'을(를) 무료로 받을까요?`
        : `${formatPoints(app.price)}를 사용해 '${app.name}'을(를) 구매할까요?`;
      if (!confirm(msg)) return;  //confirm은 window 객체에 적용 가능한 브라우저 제공 함수

      const result = purchaseApp(app.id);
      if (!result.ok) {
        showToast(result.message);
        return;
      }
      stopPreview();
      showToast("구매 완료! 이제 앱을 열 수 있어요.");
      renderHeader();   // 헤더의 포인트도 새로 그립니다
      render();
    });
  }

  const copyBtn = document.getElementById("copy-btn");
  if (copyBtn) copyBtn.addEventListener("click", () => copyText(absoluteUrl(app.url)));

  document.getElementById("preview-btn").addEventListener("click", () => startPreview(app, owned));
}

/* ---------- 미리 써보기 ---------- */

function startPreview(app, owned) {
  const frame = document.getElementById("preview-frame");
  const iframe = document.createElement("iframe");
  iframe.src = app.url;
  iframe.title = `${app.name} 미리 써보기`;
  // sandbox: 등록된 앱이 deepsolve의 데이터(로그인, 포인트)에 접근하지 못하게 막습니다
  iframe.setAttribute("sandbox", "allow-scripts allow-forms");
  frame.innerHTML = "";
  frame.appendChild(iframe);

  // 구매했거나 내 앱이면 시간 제한 없이 씁니다
  if (owned) return;

  let left = PREVIEW_SECONDS;
  const countdown = document.getElementById("countdown");
  const update = () => {
    countdown.textContent = `남은 체험 시간 ${left}초`;
    countdown.classList.toggle("warn", left <= 10);
  };
  update();

  stopPreview();
  previewTimer = setInterval(() => {
    left -= 1;
    update();
    if (left <= 0) endPreview(app);
  }, 1000);
}

function endPreview(app) {
  stopPreview();
  const frame = document.getElementById("preview-frame");
  const iframe = frame.querySelector("iframe");
  if (iframe) iframe.src = "about:blank";   // 체험이 끝나면 앱을 멈춥니다

  document.getElementById("countdown").textContent = "체험 종료";
  const cover = document.createElement("div");
  cover.className = "preview-cover";
  cover.innerHTML = `
    <div>
      <strong style="font-size:18px">미리 써보기가 끝났어요</strong>
      <p class="muted">계속 쓰려면 구매해 주세요.</p>
    </div>`;
  frame.appendChild(cover);
}

function stopPreview() {
  clearInterval(previewTimer);
  previewTimer = null;
}

render();
