# 초보가 직접 해보는 API 명세서 작성하기

## 0. 목표와 순서

1. js 파일의 함수마다 서버에 어떤 요청을 해야 하는지 적는다.
2. 그 요청에 필요한 API를 적고, 함수를 수정하거나 삭제한다.
   - 원칙: **원래 함수와 반환값은 최대한 유지하고, 함수 안에서 API를 사용한다.** (코드 수정 최소화)
3. 필요한 API를 한곳에 모은 뒤, 아래 형식으로 명세서를 작성한다. → 이후 진행

```
### 메서드 /경로
- 설명: 무엇을 하는지 한 줄
- 로그인 필요: 예 / 아니요 / 선택
- 요청 본문: (JSON 예시, 없으면 "없음")
- 성공: 상태 코드 + 응답 본문 예시
- 실패: 상태 코드 + 오류 코드 + 언제
```

---

## 1. 표기 규칙

| 표기 | 뜻 |
|---|---|
| 유지 | 고치지 않음 |
| 수정 | 내용을 고침 (무엇을 고치는지 아래에 적음) |
| 삭제 | 함수나 코드를 지움 |
| 서버로 이동 | 프론트에서 지우고 서버 코드에서 만듦 |
| `[async]` | 함수(또는 콜백) 앞에 `async` 추가 |
| `[await X]` | 안에서 부르는 `X` 앞에 `await` 추가 |

콜백은 순서 번호 대신 **"요소 + 이벤트"** 이름으로 적는다. (예: 로그인 form `submit` 콜백)

---

## 2. 파일별 검토

### FILE-1. common.js

**저장소 (DB 관련)**

- **loadDB, createSeedDB, saveDB, resetDB, `db` 변수** — 삭제
  - 브라우저가 DB를 만들거나, 불러오거나, 저장하거나, 초기화하지 않는다. 데이터는 서버에 있다.

**조회**

- **getUser(id)** — 삭제
  - 이유: 아무 사용자 정보나 꺼내 주는 기능은 보안상 서버가 제공하면 안 된다. 사용처마다 따로 요청하면 요청 수도 많아진다(N+1).
  - 사용처와 해결책

    | 사용처 | 쓰던 목적 | 해결책 |
    |---|---|---|
    | getCurrentUser() | 로그인한 사용자 정보 | 내 정보를 주는 API(`GET /api/me`) 사용 |
    | purchaseApp(appId) | 판매자 포인트 증가 | 서버에서 처리하므로 프론트에는 필요 없음 |
    | appCardHTML(app) | 판매자 이름 표시 (main.js) | 앱 목록의 앱마다 `sellerName` 필드 제공 |
    | render() | 판매자 이름 표시 (detail.js) | `getApp`이 주는 앱에 `sellerName` 필드 제공 |

- **getApp(id)** — 수정 `[async]` `[await fetch]`
  - 앱 id를 보내고 앱 하나를 요청한다. → `GET /api/apps/:id`
  - 응답에 `sellerName`, `purchaseCount`, `hasPurchased` 필드를 추가로 받는다.
  - 로그인 **선택**: 로그인하지 않아도 쓸 수 있지만, `hasPurchased`를 정하려면 누가 요청했는지 알아야 한다.
    - fetch에 `credentials: "include"`를 넣어 세션 쿠키를 함께 보낸다.
    - 로그인하지 않았으면 `hasPurchased`는 `false`.

- **getCurrentUser()** — 수정 `[async]` `[await fetch]`
  - 로그인한 사용자가 자기 정보를 요청한다. → `GET /api/me`
  - 응답에서 `password` 필드는 제외한다.
  - 반환값은 지금과 같다: 로그인했으면 사용자 객체, 아니면 `null`.

- **purchaseCount(appId)** — 삭제
  - 앱마다 요청하면 요청이 너무 많아진다. 대신 앱 응답에 `purchaseCount` 필드를 넣는다.
    - `GET /api/apps/:id` — `purchaseCount` 추가
    - `GET /api/apps` — 앱마다 `purchaseCount` 추가

- **hasPurchased(userId, appId)** — 삭제
  - `GET /api/apps/:id`의 `hasPurchased` 필드로 대신한다.

- **canOpenApp** — 수정
  - `hasPurchased(...)` 대신 `app.hasPurchased`를 사용한다.

**계정**

- **signUp({ name, email, password })** — 수정 `[async]` `[await fetch]`
  - 이름, 이메일, 비밀번호를 보내 회원가입하고 바로 로그인 상태가 된다. → `POST /api/auth/signup`

- **logIn({ email, password })** — 수정 `[async]` `[await fetch]`
  - 이메일, 비밀번호를 보내 로그인 상태가 된다. → `POST /api/auth/login`

- **logOut()** — 수정 `[async]` `[await fetch]`
  - 로그인한 사용자가 로그아웃한다. → `POST /api/auth/logout`

- **requireLogin()** — 수정 `[async]` `[await getCurrentUser]`
  - 반환값은 지금과 같다: 로그인했으면 사용자 객체, 아니면 로그인 페이지로 보내고 `null`.

**구매 / 등록**

- **purchaseApp(appId)** — 수정 `[async]` `[await fetch]`
  - 로그인한 사용자가 앱 id를 보내 구매한다. → `POST /api/purchases`
  - 서버가 한 번에 처리: 구매 기록 등록 + 구매자 포인트 차감 + 판매자 포인트 증가.

- **createApp(fields)** — 수정 `[async]` `[await fetch]`
  - 로그인한 사용자가 앱 정보를 보내 등록한다. → `POST /api/apps`
  - 판매자(`sellerId`)는 프론트가 보내지 않고 서버가 세션으로 정한다.

**헤더**

- **renderHeader()** — 수정 `[async]` `[await getCurrentUser]`
  - nav 메뉴 `.map` 콜백 — 유지
  - 로그아웃 버튼 `click` 콜백 — `[async]` `[await logOut]`
    - `await` 없이 바로 페이지를 이동하면 로그아웃 요청이 끝나기 전에 페이지가 바뀔 수 있다.

**화면 조각**

- **thumbHTML(app)** — 유지
- **appCardHTML(app)** — 수정
  - `getUser(app.sellerId).name` 대신 `app.sellerName`
  - `purchaseCount(app.id)` 대신 `app.purchaseCount`

**도우미 함수**

- **esc, formatPoints, formatPrice, formatDate** — 유지
- **copyText(text), showToast(message)** — 유지
- **makeId(prefix)** — 서버로 이동 (id는 서버가 만든다)
- **absoluteUrl(url)** — 유지
  - 이제 상대 주소를 받지 않으므로 사실상 필요 없지만, 코드 수정을 줄이려고 남긴다.
- **isSafeUrl(url)** — 수정, 서버에도 필요
  - 상대 주소를 받지 않으므로 http, https 주소인지만 확인한다.
  - 프론트 검사는 사용자 편의용, 실제 검사는 서버가 한다.

**본문**

- `storage` 이벤트 콜백 — 삭제 (다른 탭에서 로그인/구매한 내용을 이 탭에 반영하는 기능)
- `DOMContentLoaded` 콜백 — `[async]` `[await renderHeader]` (환영 토스트는 유지)

---

### FILE-2. main.js

- **맨 위 변수** — 추가: `let allApps = [];` (서버에서 받은 앱 목록을 담는다)
- **fetchApps()** — 새로 추가 `[async]` `[await fetch]`
  - 앱 목록을 요청한다. → `GET /api/apps`
  - 응답의 앱마다 `sellerName`, `purchaseCount` 필드를 추가로 받는다. `description`, `tool`은 제외.
- **renderChips()** — 유지
- **getVisibleApps()** — 수정
  - `db.apps` 대신 `allApps`를 거른다.
  - 인기순 정렬에서 `purchaseCount(b.id)` 대신 `b.purchaseCount`
  - 검색은 `name`, `tagline`만 찾으므로 목록에 `description`이 없어도 된다.
- **renderApps()** — 유지
- 검색 `input` 콜백, 정렬 `change` 콜백, 카테고리 칩 `click` 콜백 — 유지 (동기 함수 `renderApps`만 부른다)
- **본문** — `async function init()`으로 감싼다
  - `allApps = await fetchApps();` → `renderChips();` → `renderApps();`

---

### FILE-3. detail.js

- **render()** — 수정 `[async]` `[await getApp]` `[await getCurrentUser]`
  - `getUser(...)` 대신 `app.sellerName`
  - `purchaseCount(...)` 대신 `app.purchaseCount`
- **actionAreaHTML(app, user, owned, isSeller)**  — 유지
- **bindEvents(app, owned)** — 함수 자체는 유지 (리스너를 연결만 하므로 async 필요 없음)
  - 구매 버튼 `click` 콜백 — `[async]` `[await purchaseApp]` `[await renderHeader]` `[await render]`
  - 주소 복사 버튼 `click` 콜백 — 유지
  - 미리 써보기 버튼 `click` 콜백 — 유지
- **startPreview, endPreview, stopPreview** — 유지
- **본문** — `async function init()`으로 감싼다 `[await render]`

---

### FILE-4. sell.js

- **카테고리 select 채우기** — 유지 (`CATEGORIES` 사용)
- **validate(f)** — 유지
- **본문** — `async function init()`으로 감싼다 `[await requireLogin]`
- 등록 form `submit` 콜백 — `[async]` `[await createApp]`
- 나머지 모두 유지

---

### FILE-5. mypage.js

- **맨 위 변수** — 수정
  - `const me = requireLogin();` → `let me = null;`
  - `init` 안에서 `const`로 선언하면 `init` 밖의 함수(`renderProfile`, `purchasedHTML`, `sellingHTML`)가 `me`를 못 쓴다. 그래서 맨 위에 선언하고 `init`에서는 `let` 없이 대입만 한다.
  - `currentTab` — 유지

- **renderProfile()** — 유지

- **purchasedHTML()** — 수정 `[async]` `[await fetch]`
  - 로그인한 사용자의 구매 기록을 요청한다. → `GET /api/me/purchases`
  - 구매 기록마다 `app`, `price`, `createdAt` 필드를 받는다.
    - `appId`만 받으면 앱 카드를 그리려고 앱을 다시 조회해야 하므로 `app`을 통째로 받는다.
    - `map` 안에서 `getApp(p.appId)` 대신 `p.app` 사용
  - 주소 복사 버튼: `data-copy="${esc(app.id)}"` → `data-copy="${esc(app.url)}"`
    - 아래 목록 `click` 콜백에서 `getApp`을 다시 부르지 않아도 된다.
    - `esc`를 빼면 안 된다. `isSafeUrl`은 앞부분만 확인하므로, url에 `"`가 있으면 속성이 깨진다.

- **sellingHTML()** — 수정 `[async]` `[await fetch]`
  - 앱 목록을 요청한다. → `GET /api/apps`
  - `app.sellerId === me.id`인 앱만 거른다. (`createdAt` 최신순 정렬은 유지)
  - `sales.length` 대신 `app.purchaseCount`
  - `earned` 대신 `app.purchaseCount * app.price`
    - 전제: 등록 후 가격이 바뀌지 않는다. 가격 수정 기능이 생기면 계산 방법을 다시 정해야 한다.
  - [앱 열기] 버튼 — 유지 (목록에 url이 있으므로)

- **renderList()** — 수정 `[async]` `[await purchasedHTML]` `[await sellingHTML]`
  - 탭을 빠르게 바꾸면 늦게 온 앞 요청의 응답이 화면을 덮어쓸 수 있다. 응답을 받은 뒤 탭이 그대로인지 확인한다.

    ```js
    const tab = currentTab;
    const html = tab === "purchased" ? await purchasedHTML() : await sellingHTML();
    if (tab !== currentTab) return;   // 그 사이 탭이 바뀌었으면 그리지 않음
    ```

- **본문** — `async function init()`으로 감싼다
  - `me = await requireLogin();`
  - `if (!me) return;` (지금의 `if (me) { ... }` 블록을 대신함)
  - `renderProfile();` → `await renderList();` → 리스너 연결
- 탭 `click` 콜백 — `[async]` `[await renderList]`
- 목록 `click` 콜백 (주소 복사) — 수정
  - `getApp(btn.dataset.copy)` 삭제, `btn.dataset.copy`에 담긴 url을 바로 복사
- 데모 초기화 버튼 `click` 콜백 — 삭제 (mypage.html의 버튼도 삭제)

---

### FILE-6. login.js

- **nextPage(), showTab(name), isEmail** — 유지
- **본문** — `async function init()`으로 감싼다 `[await getCurrentUser]`
  - 지금 코드 `if (getCurrentUser())`를 그대로 두면 버그가 생긴다. async 함수는 항상 Promise를 반환하고 Promise는 항상 참이므로, 로그인하지 않아도 다른 페이지로 넘어간다.
- 탭 전환 `click` 콜백 — 유지
- 로그인 form `submit` 콜백 — `[async]` `[await logIn]`
- 회원가입 form `submit` 콜백 — `[async]` `[await signUp]` (환영 표시 sessionStorage 저장은 유지)
- 비밀번호 처리
  - 비밀번호는 요청 본문에 그대로 실려 서버로 간다. HTTPS가 전송 구간을 암호화한다.
  - 내 브라우저의 DevTools Network 탭에서는 보인다.
  - 브라우저에는 저장하지 않고, 서버는 해시만 저장한다.

---

### FILE-7. data.js

- **STARTING_POINTS** — 두 곳에서 사용
  - 회원가입 때 포인트 지급 → 서버로 이동
  - 환영 토스트 문구 (common.js) → 프론트에 유지
  - 값이 두 곳에 있으므로 바꿀 때 둘 다 고쳐야 한다.
- **PREVIEW_SECONDS** — 유지
- **CATEGORIES** — 유지, 서버에도 필요 (등록할 때 카테고리 검사)
  - 같은 목록이 두 곳에 있으므로 바꿀 때 둘 다 고쳐야 한다.
- **SEED_USERS, SEED_APPS, SEED_PURCHASES** — 서버로 이동
  - `SEED_APPS`의 url은 상대 주소(`apps/calculator/` 등)이므로 절대 주소로 바꾼다.

---

## 3. 필요한 API 목록 (간단 정리)

| # | API | 하는 일 | 쓰는 곳 |
|---|---|---|---|
| 1 | `GET /api/apps/:id` | 앱 하나 조회 (+ `sellerName`, `purchaseCount`, `hasPurchased`) | getApp |
| 2 | `GET /api/me` | 내 정보 조회 (`password` 제외) | getCurrentUser |
| 3 | `POST /api/auth/signup` | 회원가입 + 로그인 | signUp |
| 4 | `POST /api/auth/login` | 로그인 | logIn |
| 5 | `POST /api/auth/logout` | 로그아웃 | logOut |
| 6 | `POST /api/purchases` | 앱 구매 | purchaseApp |
| 7 | `POST /api/apps` | 앱 등록 | createApp |
| 8 | `GET /api/apps` | 앱 목록 조회 (url 포함, + `sellerName`, `purchaseCount`, `description`·`tool` 제외) | fetchApps (main), sellingHTML (mypage) |
| 9 | `GET /api/me/purchases` | 내 구매 기록 조회 (`app`, `price`, `createdAt`) | purchasedHTML |

필드별 응답 내용과 오류 처리 방침은 명세를 쓸 때 정한다.

---

## 4. async 규칙

- **직접 서버에 요청하는 함수**: 안에 `await fetch`가 있으므로 `async`
  - getApp, getCurrentUser, signUp, logIn, logOut, purchaseApp, createApp, fetchApps, purchasedHTML, sellingHTML
- **요청하는 함수를 부르는 함수와 콜백**: 안에 `await`가 있으므로 `async`
  - 함수: requireLogin, renderHeader, render (detail), renderList (mypage)
  - 콜백: 로그아웃 click, DOMContentLoaded, 구매 click, 등록 submit, 로그인 submit, 회원가입 submit, 마이페이지 탭 click
  - 각 파일의 본문: `async function init()`으로 감싼다. (일반 script에서는 맨 바깥에 `await`를 쓸 수 없다)
- **async가 되면 안 되는 곳**: `sort`, `map`, `filter`의 콜백. 이 메서드들은 콜백이 반환한 값을 바로 쓰는데, async 콜백은 Promise를 반환한다.

---

## 5. 결정 사항과 알려진 한계

- **앱 목록에 url 포함 (MVP)**
  - 한계: 구매하지 않아도 목록 요청 한 번으로 모든 앱의 주소를 볼 수 있다.
  - 상세 화면의 미리 써보기(iframe)도 url이 필요하므로 이미 같은 한계가 있다.
  - 제대로 막으려면 서버 프록시나 임시 토큰이 필요하다. MVP에서는 다루지 않는다.
- **판매 수익 = 판매 수 × 현재 가격**: 가격이 바뀌지 않는다는 전제
- **같은 값이 프론트와 서버 두 곳에 있음**: `STARTING_POINTS`, `CATEGORIES`, `isSafeUrl`
- **쿠키 인증은 교차 출처 설정이 필요**
  - 프론트(github.io)와 서버(Render)의 주소가 다르다.
  - 서버에 CORS와 쿠키 설정(`SameSite=None; Secure`)이 필요하다. (4단계, 6단계에서 다룸)

---

## 6. 궁금했던 점 메모

- **로그인/로그아웃 상태는 서버에 어떻게 저장할까?**
  - sessions 테이블에 `id`, `userId`, `expiresAt`를 저장하고, 브라우저에는 세션 id를 쿠키로 준다.
  - 로그인 = 세션 행 만들기, 로그아웃 = 세션 행 지우기
- **구매처럼 여러 테이블을 함께 바꾸는 일은 API를 어떻게 나눌까?**
  - 나누지 않는다. API 하나(`POST /api/purchases`)로 요청하고, 서버가 한 번에(트랜잭션) 처리한다.
  - 프론트가 "포인트 차감", "구매 기록 등록"을 따로 요청하면 중간에 실패하거나 값을 조작할 수 있다.

---

## 7. 다음에 할 일

- [ ] API 1–9의 응답 필드를 표로 정리
- [ ] 함수별 오류 처리 방침 정하기
- [ ] 위 형식으로 명세서 작성
