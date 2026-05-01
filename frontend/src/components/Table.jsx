import React, { useState } from 'react'

const s = {
  wrap: { overflowX: 'auto', marginTop: 16 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    background: '#1e293b', color: '#94a3b8', textAlign: 'left',
    padding: '8px 12px', borderBottom: '1px solid #334155', whiteSpace: 'nowrap',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '8px 12px', borderBottom: '1px solid #1e293b',
    color: '#e2e8f0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  tr: { background: '#0f172a' },
  trAlt: { background: '#111827' },
}

function TableRow({ row, keys, index, isAlt }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <tr
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...(isAlt ? s.trAlt : s.tr),
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.2s ease',
        borderLeft: isHovered ? '3px solid #38bdf8' : '3px solid transparent',
        background: isHovered ? '#1e293b' : (isAlt ? '#111827' : '#0f172a'),
        opacity: 0,
        animation: `fadeInRow 0.3s ease forwards ${index * 0.03}s`,
      }}
    >
      {keys.map(k => (
        <td key={k} style={s.td} title={String(row[k] ?? '')}>
          {Array.isArray(row[k]) ? row[k].join(', ') : String(row[k] ?? '')}
        </td>
      ))}
    </tr>
  )
}

export default function Table({ rows }) {
  if (!rows || rows.length === 0) return <p style={{ color: '#64748b', marginTop: 16 }}>Sin resultados.</p>
  const keys = Object.keys(rows[0]).filter(k => !k.startsWith('_'))
  
  return (
    <>
      <style>{`
        @keyframes fadeInRow {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <div style={s.wrap}>
        <table style={s.table}>
          <thead>
            <tr>{keys.map(k => <th key={k} style={s.th}>{k}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <TableRow key={i} row={row} keys={keys} index={i} isAlt={i % 2 !== 0} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
