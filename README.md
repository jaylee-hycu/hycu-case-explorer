# HYCU-G CORE 건설·부동산 판례 탐색기

AI Hub "법률-규정 텍스트 분석 데이터(고도화)" 데이터셋에서 사건명 키워드 기준으로 선별한
건설·부동산 분쟁 판례 3종 목록(건설관련 전체 744건 / 건설(행정·기업·형사) 611건 / 부동산 좁은범위 295건)을
검색·필터링할 수 있는 정적 웹앱입니다. React + Vite로 제작했으며, 데이터는 `public/data/cases.json`에
정적으로 포함되어 있습니다(별도 백엔드 없음).

## 로컬 실행

```
npm install
npm run dev
```

## 빌드

```
npm run build
npm run preview
```

## 배포 (Vercel)

```
npm install -g vercel
vercel login
vercel --prod
```

## 데이터 갱신

`public/data/cases.json`을 교체하면 됩니다. 형식:

```json
{
  "construction_all": { "label": "...", "rows": [ { "category": "...", "caseNoID": "...", ... } ] },
  "construction_subset": { ... },
  "narrow_realestate": { ... }
}
```

## 참고

- 출처: AI Hub(aihub.or.kr), 조회일 2026-09-10
- "원문 검색" 링크는 국가법령정보센터(law.go.kr) 판례 검색 페이지로 연결됩니다. 자바스크립트 기반 검색이라
  자동으로 결과가 뜨지 않으면 사건번호를 검색창에 직접 붙여넣어 주세요.
- 이후 검색 범위를 10개 카테고리 전체(약 55,000건)로 넓히거나 Supabase(apt-insight와 동일 프로젝트) 백엔드로
  전환하는 것은 추후 결정 예정입니다.
