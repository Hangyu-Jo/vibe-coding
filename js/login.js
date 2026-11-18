/* =========================================================
   로그인 / 회원가입 페이지
   ========================================================= */

// 로그인 후 돌아갈 페이지 (예: login.html?next=sell.html)
function nextPage() {
  const next = new URLSearchParams(location.search).get("next");
  // 이 사이트 안의 페이지로만 돌아가도록 확인합니다
  if (next && /^[a-z]+\.html(\?.*)?$/i.test(next)) return next;
  return "index.html";
}

// 이미 로그인했다면 바로 돌려보냅니다
if (getCurrentUser()) location.replace(nextPage());

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// 탭 전환
function showTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  loginForm.classList.toggle("hidden", name !== "login");
  signupForm.classList.toggle("hidden", name !== "signup");
}
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
if (location.hash === "#signup") showTab("signup");

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// 로그인
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");

  if (!isEmail(email)) return (errorEl.textContent = "이메일 형식을 확인해 주세요.");
  if (!password) return (errorEl.textContent = "비밀번호를 입력해 주세요.");

  const result = logIn({ email, password });
  if (!result.ok) return (errorEl.textContent = result.message);
  location.href = nextPage();
});

// 회원가입 (유효성 검사 후 가입)
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const errorEl = document.getElementById("signup-error");

  if (!name.trim()) return (errorEl.textContent = "이름을 입력해 주세요.");
  if (!isEmail(email)) return (errorEl.textContent = "이메일 형식을 확인해 주세요.");
  if (password.length < 4) return (errorEl.textContent = "비밀번호는 4자 이상이어야 해요.");

  const result = signUp({ name, email, password });
  if (!result.ok) return (errorEl.textContent = result.message);
  sessionStorage.setItem("deepsolve:welcome", "1");
  location.href = nextPage();
});
