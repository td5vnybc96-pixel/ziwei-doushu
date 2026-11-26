'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';

const DIMENSIONS = [
  ['overview', '命格总览'],
  ['personality', '性格'],
  ['love', '感情'],
  ['career', '事业'],
  ['wealth', '财运'],
  ['health', '健康'],
  ['family', '兄弟'],
  ['children', '子女'],
  ['move', '迁移'],
  ['friends', '人际'],
  ['home', '田宅'],
  ['spirit', '福德'],
  ['parents', '父母'],
] as const;

type DimensionKey = typeof DIMENSIONS[number][0];

export default function DataInterpretationPanel({ chart }: { chart: ZiweiChart }) {
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<DimensionKey>('overview');

  const birth = chart.birthInfo;
  const date = useMemo(
    () => `${birth.year}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`,
    [birth.year, birth.month, birth.day],
  );

  useEffect(() => {
    setData(null);
    if (birth.unknownTime) {
      setLoading(false);
      setError('出生时辰不详，无法精确匹配 13 维数据。请补充出生时辰后再查询，避免把默认子时当成真实出生时辰。');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setData(null);

    const params = new URLSearchParams({
      date,
      hour: String(birth.hour),
      gender: birth.gender,
    });

    fetch(`/api/interpretations?${params.toString()}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || '13 维数据查询失败。');
        setData(payload.dimensions as Record<string, string>);
      })
      .catch(err => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message || '13 维数据查询失败。');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [date, birth.hour, birth.gender, birth.unknownTime]);

  return (
    <section className="rounded-xl overflow-hidden card-glass" style={{ border: '1px solid var(--t-border)' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--t-gold)' }}>13 维命盘解读</h3>
          <span className="text-[9px]" style={{ color: 'var(--t-faint)' }}>确定性数据 · 无需 AI</span>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--t-faint)' }}>
          {date} · {birth.unknownTime ? '时辰不详' : `${birth.hour} 时辰`} · {birth.gender === 'male' ? '男命' : '女命'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1 p-2" style={{ borderBottom: '1px solid var(--t-border)' }}>
        {DIMENSIONS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className="rounded-md px-1.5 py-2 text-[10px] transition-colors"
            style={{
              background: active === key ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: `1px solid ${active === key ? 'rgba(212,168,67,0.3)' : 'var(--t-border)'}`,
              color: active === key ? 'var(--t-gold)' : 'var(--t-text2)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-44 max-h-[34rem] overflow-y-auto">
        {loading && <p className="text-xs animate-pulse" style={{ color: 'var(--t-faint)' }}>正在查询对应命盘的 13 维数据…</p>}
        {!loading && error && (
          <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            <p>{error}</p>
            <p className="mt-2 text-[10px]" style={{ color: 'var(--t-faint)' }}>
              数据集版本 v4.0，覆盖 1950–2026 年；按公历日期、时辰序号和性别精确匹配。
            </p>
          </div>
        )}
        {!loading && !error && data && (
          <article className="whitespace-pre-wrap break-words text-xs leading-7" style={{ color: 'var(--t-text2)' }}>
            {data[active] || '该维度暂无内容。'}
          </article>
        )}
      </div>

      <div className="px-4 py-2 text-[9px]" style={{ borderTop: '1px solid var(--t-border)', color: 'var(--t-faint)' }}>
        数据来源：紫微斗数开源解读数据集 v4.0 · CC BY 4.0
      </div>
    </section>
  );
}
