import { useEffect, useMemo, useState } from 'react'

const TABS = [
  { key: 'construction_all', label: '건설관련 전체' },
  { key: 'construction_subset', label: '건설(행정·기업·형사)' },
  { key: 'narrow_realestate', label: '부동산 좁은범위' },
]

function lawSearchUrl(caseNo) {
  const base = 'https://www.law.go.kr/precSc.do?menuId=7&subMenuId=47&tabMenuId=213&query='
  return base + encodeURIComponent(caseNo || '')
}

const PAGE_SIZE = 20
const SUMMARY_MAX = 40

function truncate(text, n) {
  if (!text) return ''
  return text.length > n ? text.slice(0, n) + '…' : text
}

// 현재 페이지 주변 + 처음/끝만 보여주고 나머지는 "..." 로 생략
function buildPageList(current, total) {
  const pages = []
  const add = (p) => { if (!pages.includes(p)) pages.push(p) }
  add(1)
  for (let p = current - 1; p <= current + 1; p++) {
    if (p > 1 && p < total) add(p)
  }
  if (total > 1) add(total)
  pages.sort((a, b) => a - b)
  const withGaps = []
  let prev = 0
  for (const p of pages) {
    if (prev && p - prev > 1) withGaps.push('...')
    withGaps.push(p)
    prev = p
  }
  return withGaps
}

export default function App() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState(TABS[0].key)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [courtType, setCourtType] = useState('전체')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetch('/data/cases.json')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => console.error('데이터 로드 실패', e))
  }, [])

  const rows = data?.[activeTab]?.rows ?? []

  const categories = useMemo(() => {
    const set = new Set(rows.map((r) => r.category).filter(Boolean))
    return ['전체', ...Array.from(set).sort()]
  }, [rows])

  const courtTypes = useMemo(() => {
    const set = new Set(rows.map((r) => r.courtType).filter(Boolean))
    return ['전체', ...Array.from(set).sort()]
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = rows.filter((r) => {
      if (category !== '전체' && r.category !== category) return false
      if (courtType !== '전체' && r.courtType !== courtType) return false
      if (!q) return true
      const hay = [r.caseNm, r.jdgmn, r.keyword, r.caseNoID, r.reference_rules]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    list = [...list].sort((a, b) => {
      const da = a.judmnAdjuDe || ''
      const db = b.judmnAdjuDe || ''
      return sortDir === 'desc' ? db.localeCompare(da) : da.localeCompare(db)
    })
    return list
  }, [rows, query, category, courtType, sortDir])

  useEffect(() => {
    setPage(1)
  }, [activeTab, query, category, courtType, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const pageList = buildPageList(currentPage, totalPages)

  return (
    <div className="app">
      <header className="app-header">
        <h1>HYCU-G CORE 건설·부동산 판례 탐색기</h1>
        <p>
          AI Hub &quot;법률-규정 텍스트 분석 데이터(고도화)&quot; 판례 중 건설·부동산 분쟁 관련 사건을 사건명 키워드 기준으로
          선별한 목록입니다. (조회 기준일: 2026-09-10, 사건명 키워드 매칭 — 실제 활용 전 원문 확인 권장)
        </p>
      </header>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'tab-btn' + (activeTab === t.key ? ' active' : '')}
            onClick={() => {
              setActiveTab(t.key)
              setCategory('전체')
              setCourtType('전체')
            }}
          >
            {t.label} ({data?.[t.key]?.rows.length ?? '…'})
          </button>
        ))}
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="사건명·판시사항·키워드·사건번호 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === '전체' ? '카테고리 전체' : c}
            </option>
          ))}
        </select>
        <select value={courtType} onChange={(e) => setCourtType(e.target.value)}>
          {courtTypes.map((c) => (
            <option key={c} value={c}>
              {c === '전체' ? '심급 전체' : c}
            </option>
          ))}
        </select>
        <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="desc">선고일 최신순</option>
          <option value="asc">선고일 오래된순</option>
        </select>
      </div>

      <p className="result-count">
        {data
          ? `총 ${filtered.length.toLocaleString('ko-KR')}건 (전체 ${rows.length.toLocaleString('ko-KR')}건 중) · ${currentPage}/${totalPages} 페이지`
          : '데이터 불러오는 중...'}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>카테고리</th>
              <th>사건번호</th>
              <th>법원</th>
              <th>심급</th>
              <th>선고일</th>
              <th>사건명</th>
              <th>판시사항 요약</th>
              <th>키워드</th>
              <th>원문 검색</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={r.file || i}>
                <td className="nowrap"><span className="badge">{r.category}</span></td>
                <td className="nowrap">{r.caseNoID}</td>
                <td className="nowrap">{r.courtNm}</td>
                <td className="nowrap">{r.courtType}</td>
                <td className="nowrap">{r.judmnAdjuDe}</td>
                <td>{r.caseNm}</td>
                <td className="jdgmn-cell" title={r.jdgmn}>{truncate(r.jdgmn, SUMMARY_MAX)}</td>
                <td>{r.keyword}</td>
                <td className="nowrap">
                  <a className="link-btn" href={lawSearchUrl(r.caseNoID)} target="_blank" rel="noreferrer">
                    검색 →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="페이지 이동">
          <button
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            이전
          </button>
          {pageList.map((p, i) =>
            p === '...' ? (
              <span key={`gap-${i}`} className="page-gap">…</span>
            ) : (
              <button
                key={p}
                className={'page-btn' + (p === currentPage ? ' active' : '')}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            다음
          </button>
        </nav>
      )}

      <p className="footer-note">
        출처: AI Hub(aihub.or.kr) &quot;법률-규정 텍스트 분석 데이터(고도화)&quot;. 사건명(caseNm) 키워드 매칭 기반 선별로, 본문 전체를
        정독한 결과가 아닙니다. &quot;원문 검색&quot; 링크는 국가법령정보센터(law.go.kr) 판례 검색 페이지로 이동하며 사건번호를
        검색어로 시도합니다 — 자바스크립트 기반 검색이라 결과가 바로 안 뜨면 사건번호를 검색창에 직접 붙여넣어 주세요.
      </p>
    </div>
  )
}
