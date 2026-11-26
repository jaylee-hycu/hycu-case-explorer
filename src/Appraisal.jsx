import { useEffect, useMemo, useState } from 'react'

const NON_ITEM = ['책임제한', '제척기간', '산식 불일치']
const won = (n) => (n == null ? '' : n.toLocaleString('ko-KR') + '원')
const lawUrl = (no) =>
  'https://www.law.go.kr/precSc.do?menuId=7&subMenuId=47&tabMenuId=213&query=' + encodeURIComponent(no)

function Bar({ label, n, max }) {
  return (
    <div className="ap-bar-row">
      <span className="ap-bar-label">{label}</span>
      <span className="ap-bar-track"><span className="ap-bar-fill" style={{ width: `${(n / max) * 100}%` }} /></span>
      <span className="ap-bar-n">{n}</span>
    </div>
  )
}

export default function Appraisal() {
  const [d, setD] = useState(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState('전체')
  const [result, setResult] = useState('전체')
  const [verify, setVerify] = useState('전체')
  const [onlyCorrected, setOnlyCorrected] = useState(false)

  useEffect(() => {
    fetch('/data/appraisal.json').then((r) => r.json()).then(setD).catch((e) => console.error(e))
  }, [])

  const caseMap = useMemo(() => Object.fromEntries((d?.cases ?? []).map((c) => [c.caseNoID, c])), [d])
  const items = d?.items ?? []
  const opts = (key) => ['전체', ...Array.from(new Set(items.map((i) => i[key]))).sort()]

  const stats = useMemo(() => {
    const core = items.filter((i) => !NON_ITEM.includes(i.type))
    const count = (fn) => core.filter(fn).length
    const byType = {}
    items.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + 1 })
    return {
      cases: d?.cases.length ?? 0,
      core: core.length,
      corrected: count((i) => i.appraiserCorrected),
      rejected: count((i) => i.courtResult === '감정 불채택'),
      applied: count((i) => i.courtResult === '감정인 정정 반영'),
      adjusted: count((i) => i.courtResult === '법원 수정'),
      kept: count((i) => i.courtResult === '감정 유지'),
      byType: Object.entries(byType).sort((a, b) => b[1] - a[1]),
    }
  }, [items, d])

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase()
    return items.filter((i) => {
      if (type !== '전체' && i.type !== type) return false
      if (result !== '전체' && i.courtResult !== result) return false
      if (verify !== '전체' && i.verify !== verify) return false
      if (onlyCorrected && !i.appraiserCorrected) return false
      if (!k) return true
      return [i.caseNoID, i.itemNo, i.title, i.note].join(' ').toLowerCase().includes(k)
    })
  }, [items, q, type, result, verify, onlyCorrected])

  if (!d) return <p className="result-count">데이터 불러오는 중...</p>
  const max = Math.max(...stats.byType.map((t) => t[1]))

  return (
    <section className="ap">
      <div className="ap-note">
        <b>감정 쟁점 코딩</b> — 하자·기성고 소송 판결문에서 감정 항목별로 감정액·인정액·오류 유형·법원 판단을 사람이 읽고 코딩한 표본입니다.
        아래 비율은 <b>공개 판결 중 감정 관련 사정이 판결문에 명시된 표본 {stats.cases}건 안에서의 비율</b>이며, 시장 전체의 감정 오류율이 아닙니다.
      </div>

      <div className="ap-cards">
        <div className="ap-card"><div className="ap-big">{stats.cases}</div>판결 (표본)</div>
        <div className="ap-card"><div className="ap-big">{stats.core}</div>감정 항목</div>
        <div className="ap-card"><div className="ap-big">{stats.corrected}</div>감정인 자체 정정 ({((stats.corrected / stats.core) * 100).toFixed(1)}%)</div>
        <div className="ap-card"><div className="ap-big">{stats.rejected}</div>법원이 감정 불채택 ({((stats.rejected / stats.core) * 100).toFixed(1)}%)</div>
        <div className="ap-card"><div className="ap-big">{stats.adjusted}</div>법원이 금액 수정 ({((stats.adjusted / stats.core) * 100).toFixed(1)}%)</div>
        <div className="ap-card"><div className="ap-big">{stats.applied}</div>감정인 정정을 법원이 반영 ({((stats.applied / stats.core) * 100).toFixed(1)}%)</div>
        <div className="ap-card"><div className="ap-big">{stats.kept}</div>감정 그대로 유지 ({((stats.kept / stats.core) * 100).toFixed(1)}%)</div>
      </div>
      <p className="ap-small">분모: 책임제한·제척기간·표 불일치 행을 뺀 감정 항목 {stats.core}건. 법원 판단 4개 구분(불채택·수정·정정 반영·유지)은 서로 겹치지 않으며 나머지 1건은 결과 미확인입니다. &quot;감정인 자체 정정&quot;은 별도 축이라 위 구분과 겹칩니다.</p>

      <div className="ap-bars">
        <h3>유형별 행 수</h3>
        {stats.byType.map(([t, n]) => <Bar key={t} label={t} n={n} max={max} />)}
      </div>

      <h3>판결 목록</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>사건번호</th><th>법원</th><th>심급</th><th>선고일</th><th>사건명</th><th>하자보수비 집계</th><th>책임제한</th><th>인정액</th><th>검증</th></tr></thead>
          <tbody>
            {d.cases.map((c) => (
              <tr key={c.caseNoID}>
                <td className="nowrap"><a className="link-btn" href={lawUrl(c.caseNoID)} target="_blank" rel="noreferrer">{c.caseNoID}</a></td>
                <td className="nowrap">{c.courtNm}</td><td className="nowrap">{c.instance}</td><td className="nowrap">{c.date}</td>
                <td>{c.caseNm}</td><td className="nowrap">{won(c.defectTotal)}</td>
                <td className="nowrap">{c.liabilityPct ? c.liabilityPct + '%' : ''}</td>
                <td className="nowrap">{won(c.awardedTotal)}</td>
                <td className="nowrap"><span className={'badge ' + (c.verify === '확정' ? 'ok' : 'warn')}>{c.verify}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>감정 항목 ({rows.length.toLocaleString('ko-KR')}행)</h3>
      <div className="controls">
        <input type="text" placeholder="사건번호·항목·요지 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>{opts('type').map((o) => <option key={o}>{o}</option>)}</select>
        <select value={result} onChange={(e) => setResult(e.target.value)}>{opts('courtResult').map((o) => <option key={o}>{o}</option>)}</select>
        <select value={verify} onChange={(e) => setVerify(e.target.value)}>{opts('verify').map((o) => <option key={o}>{o}</option>)}</select>
        <label className="ap-check"><input type="checkbox" checked={onlyCorrected} onChange={(e) => setOnlyCorrected(e.target.checked)} /> 감정인 정정만</label>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>사건번호</th><th>항목</th><th>내용</th><th>유형</th><th>금액</th><th>법원 판단</th><th>요지</th><th>검증</th></tr></thead>
          <tbody>
            {rows.map((i, k) => {
              const diff = i.appraisedAmt != null && i.awardedAmt != null ? i.awardedAmt - i.appraisedAmt : null
              return (
                <tr key={i.caseNoID + i.itemNo + k}>
                  <td className="nowrap">{i.caseNoID}<div className="ap-small">{caseMap[i.caseNoID]?.instance}</div></td>
                  <td className="ap-item-cell">{i.itemNo}</td><td className="ap-title-cell">{i.title}</td>
                  <td className="nowrap"><span className="badge">{i.type}</span>{i.appraiserCorrected ? <div className="ap-small">감정인 정정</div> : null}</td>
                  <td className="nowrap ap-amt">
                    {i.appraisedAmt != null ? <div>감정 {won(i.appraisedAmt)}</div> : null}
                    {i.awardedAmt != null ? <div>인정 {won(i.awardedAmt)}</div> : null}
                    {diff != null ? <div className="ap-small">{(diff > 0 ? '+' : '') + diff.toLocaleString('ko-KR') + '원'}</div> : null}
                  </td>
                  <td className="nowrap">{i.courtResult}</td><td className="ap-note-cell">{i.note}</td>
                  <td className="nowrap"><span className={'badge ' + (i.verify === '확정' ? 'ok' : 'warn')}>{i.verify}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="footer-note">
        출처: 국가법령정보센터 판례 본문(조회일 2026-11-26), 검증 열이 &quot;확정&quot;인 행은 이 앱 제작 시점에 판결문 전문과 직접 대조했습니다. &quot;검증필요&quot;는 이전 정독 기록에서 옮겨 원문 재대조 전입니다.
        &quot;감정 불채택·법원 수정&quot;은 법원이 감정 결과를 따르지 않았다는 뜻이며, 감정이 틀렸다는 확정이 아닙니다. 코딩은 한 사람이 했고 이중 코딩은 하지 않았습니다. 감정서 자체는 이 앱에 없습니다. 2021가합511923(1심)과 2024나2038361(항소심)은 동일 분쟁의 심급 쌍이므로 두 사건의 항목·비율을 합산하면 같은 쟁점이 이중으로 집계됩니다.
      </p>
    </section>
  )
}
