/* =========================================================
   목 데이터 (Mock Data)
   처음 접속했을 때 마켓에 보여줄 기본 사용자와 앱입니다.
   브라우저에 저장된 데이터가 없을 때만 사용됩니다.
   ========================================================= */

// 가입하면 받는 포인트
const STARTING_POINTS = 1000;

// 미리 써보기 시간 (초)
const PREVIEW_SECONDS = 60;

// 카테고리 목록과 썸네일 아이콘
const CATEGORIES = {
  "생산성": "📝",
  "유틸리티": "🧮",
  "게임": "🎮",
  "교육": "📚",
  "AI": "🤖",
  "기타": "✨",
};

// 기본 판매자들 (데모용 계정이라 로그인은 할 수 없습니다)
const SEED_USERS = [
  { id: "u-minji", name: "김민지", email: "minji@deepsolve.demo", password: null, points: 1000 },
  { id: "u-doyun", name: "이도윤", email: "doyun@deepsolve.demo", password: null, points: 1000 },
  { id: "u-seoyeon", name: "박서연", email: "seoyeon@deepsolve.demo", password: null, points: 1000 },
];

// 기본 앱들: 앱 주소는 이 폴더의 apps/ 안에 있는 샘플 앱입니다
const SEED_APPS = [
  {
    id: "a-calculator",
    name: "심플 계산기",
    tagline: "사칙연산을 빠르게 하는 깔끔한 계산기",
    description:
      "더하기, 빼기, 곱하기, 나누기를 지원하는 계산기예요.\n키보드 숫자 입력도 지원해서 빠르게 계산할 수 있어요.\nClaude Code에게 \"간단한 계산기 만들어줘\"라고 요청해서 30분 만에 만들었어요.",
    category: "유틸리티",
    price: 200,
    url: "apps/calculator/",
    screenshot: "",
    tool: "Claude Code",
    sellerId: "u-minji",
    createdAt: "2026-11-10T09:00:00.000Z",
  },
  {
    id: "a-timer",
    name: "포커스 타이머",
    tagline: "25분 집중, 5분 휴식. 뽀모도로 타이머",
    description:
      "뽀모도로 기법으로 집중력을 높여 주는 타이머예요.\n집중 25분과 휴식 5분을 버튼 하나로 전환할 수 있고, 시간을 직접 정할 수도 있어요.\n공부하거나 일할 때 탭 하나 열어 두고 쓰기 좋아요.",
    category: "생산성",
    price: 300,
    url: "apps/timer/",
    screenshot: "",
    tool: "Cursor",
    sellerId: "u-doyun",
    createdAt: "2026-11-12T09:00:00.000Z",
  },
  {
    id: "a-memo",
    name: "한 줄 메모장",
    tagline: "떠오른 생각을 바로 적어 두는 가벼운 메모장",
    description:
      "메모를 쓰고, 목록으로 보고, 필요 없으면 지울 수 있는 메모장이에요.\n메모는 내 브라우저에 저장돼서 다시 열어도 남아 있어요.\n(미리 써보기에서는 저장되지 않아요.)",
    category: "생산성",
    price: 0,
    url: "apps/memo/",
    screenshot: "",
    tool: "Claude Code",
    sellerId: "u-seoyeon",
    createdAt: "2026-11-14T09:00:00.000Z",
  },
];

// 기본 구매 기록: 인기순 정렬을 확인할 수 있도록 몇 건 넣어 둡니다
const SEED_PURCHASES = [
  { id: "p-1", buyerId: "u-doyun", appId: "a-calculator", price: 200, createdAt: "2026-11-13T10:00:00.000Z" },
  { id: "p-2", buyerId: "u-seoyeon", appId: "a-calculator", price: 200, createdAt: "2026-11-14T10:00:00.000Z" },
  { id: "p-3", buyerId: "u-minji", appId: "a-timer", price: 300, createdAt: "2026-11-15T10:00:00.000Z" },
];
