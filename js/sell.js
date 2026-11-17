/* =========================================================
   앱 등록 페이지
   ========================================================= */

// 로그인한 사람만 등록할 수 있습니다
requireLogin();

// 카테고리 드롭다운 채우기
document.getElementById("category").innerHTML = Object.keys(CATEGORIES)
  .map((c) => `<option value="${esc(c)}">${CATEGORIES[c]} ${esc(c)}</option>`)
  .join("");

const value = (id) => document.getElementById(id).value;

// 입력값 확인 (유효성 검사). 문제가 있으면 안내 문구를, 없으면 빈 문자열을 돌려줍니다.
function validate(f) {
  if (!f.name.trim()) return "앱 이름을 입력해 주세요.";
  if (!f.tagline.trim()) return "한 줄 소개를 입력해 주세요.";
  if (!f.description.trim()) return "상세 설명을 입력해 주세요.";
  const price = Number(f.price);
  if (!Number.isInteger(price) || price < 0 || price > 100000) return "가격은 0~100,000 사이의 정수로 입력해 주세요.";
  if (!/^https?:\/\//i.test(f.url.trim()) || !isSafeUrl(f.url.trim())) return "앱 주소는 http:// 또는 https://로 시작해야 해요.";
  if (f.screenshot.trim() && !/^https?:\/\//i.test(f.screenshot.trim())) return "스크린샷 주소는 http:// 또는 https://로 시작해야 해요.";
  return "";
}

document.getElementById("sell-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const fields = {
    name: value("name"),
    tagline: value("tagline"),
    description: value("description"),
    category: value("category"),
    price: value("price"),
    url: value("url"),
    screenshot: value("screenshot"),
    tool: value("tool"),
  };

  const error = validate(fields);
  document.getElementById("sell-error").textContent = error;
  if (error) return;

  const app = createApp(fields);
  location.href = `detail.html?id=${encodeURIComponent(app.id)}`;
});
