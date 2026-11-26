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


## 감정 쟁점 코딩 탭 (v2)

판결문에서 감정 항목별 감정액·인정액·오류 유형·법원 판단을 사람이 코딩한 표본입니다.

- 원본 데이터: `data_src/appraisal_cases.csv`, `data_src/appraisal_items.csv` (엑셀에서 열어 행을 추가·수정, UTF-8 저장)
- 변환: `python tools/build_appraisal.py` → `public/data/appraisal.json` 생성
- 후보 문장 추출: `python tools/extract_appraisal_sentences.py <판결문 txt 폴더> <출력.csv>` (라벨은 사람이 붙임)
- `verify` 열: `확정`은 판결문 전문과 직접 대조한 행, `검증필요`는 원문 재대조 전
- 비율은 표본 안에서의 비율이며 시장 전체의 감정 오류율이 아닙니다
