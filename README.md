# 감사 바구니 🧺

싱어팀 추수감사절 감사 일기 (2026.10.19 ~ 10.25)

- 평일(10/19~23) 하루 3개씩 감사 → 개수(0~15)에 따라 열매 결정
  - 0~3 밤 · 4~6 귤 · 7~9 감 · 10~12 배 · 13~15 사과
- 평일에는 지난 평일도 채울 수 있음, 주말에는 평일 기록 잠금
- 주말(10/24~25)에는 보너스 감사만 가능 → 1개 이상이면 열매가 황금색
- 토요일부터 팀 공동 바구니에 열매 넣기
- 익명 감사 게시판, 관리자 화면(`/admin`)

## 로컬 실행

```bash
npm install
npm run dev
```

`DATABASE_URL`이 없으면 내장 DB(`.pglite/`)를 씁니다. `.env.local`의 `FAKE_NOW`로 날짜를 바꿔 테스트할 수 있습니다.

## 배포 (Vercel + Supabase)

1. Supabase 프로젝트 생성 → Connect → **Transaction pooler** 연결 문자열 복사
2. GitHub에 이 저장소 올리기 → Vercel에서 Import
3. Vercel 환경 변수: `DATABASE_URL`, `ADMIN_PASSWORD` (`FAKE_NOW`는 넣지 않기)
4. 테이블은 첫 요청 때 자동 생성됩니다.
