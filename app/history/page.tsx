'use client';
import { useHistory } from '@/lib/ziwei/history';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { history, remove } = useHistory();
  const router = useRouter();
  function openEntry(form: (typeof history)[number]['form']) {
    try { localStorage.setItem('ziwei_history_load', JSON.stringify(form)); } catch {}
    router.push('/chart');
  }
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push('/')} style={{ border: '1px solid var(--bdr-med)', borderRadius: 10, padding: '8px 12px' }}>← 返回</button>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tx-0)' }}>命盘保存与历史记录</h1>
          <p style={{ color: 'var(--tx-3)', fontSize: 12 }}>记录保存在当前浏览器中；清除浏览器数据或更换设备后不会自动同步。</p>
        </div>
      </div>
      {history.length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center">
          <p style={{ color: 'var(--tx-2)' }}>暂时没有保存的命盘。</p>
          <button onClick={() => router.push('/chart')} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 20, background: 'var(--ac)', color: '#fff' }}>立即排盘</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {history.map(entry => (
            <article key={entry.id} className="card-glass rounded-xl p-4" style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: 'var(--tx-0)', fontSize: 14, fontWeight: 600 }}>{entry.label}</h2>
                <p style={{ color: 'var(--tx-3)', fontSize: 11, marginTop: 5 }}>
                  {(entry.form.unknownTime ? '出生时辰不详' : entry.form.clockHour + ':' + entry.form.clockMinute.padStart(2, '0')) + ' · 保存于 ' + new Date(entry.savedAt).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEntry(entry.form)} style={{ padding: '7px 14px', borderRadius: 9, background: 'var(--ac)', color: '#fff', fontSize: 12 }}>重新打开</button>
                <button onClick={() => remove(entry.id)} style={{ padding: '7px 14px', borderRadius: 9, border: '1px solid var(--bdr-med)', color: 'var(--tx-2)', fontSize: 12 }}>删除</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
