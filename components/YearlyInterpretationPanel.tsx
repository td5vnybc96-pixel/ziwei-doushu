'use client';
import { useMemo } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { SI_HUA_TABLE, STEMS, BRANCHES } from '@/lib/ziwei/constants';

const MEANING: Record<string, string> = {
  '禄': '传统象义偏向机会、资源、收入与人缘；宜留意资源如何流动。',
  '权': '传统象义偏向行动力、责任、竞争与主导；宜把握节奏，避免过度强势。',
  '科': '传统象义偏向名誉、学习、表达与贵人；适合整理成果、建立口碑。',
  '忌': '传统象义偏向牵挂、阻滞与反复；宜预留缓冲，检查承诺与细节。',
};

export default function YearlyInterpretationPanel({ chart, year }: { chart: ZiweiChart; year: number }) {
  const result = useMemo(() => {
    const stemIndex = ((year - 4) % 10 + 10) % 10;
    const branchIndex = ((year - 4) % 12 + 12) % 12;
    const stars = SI_HUA_TABLE[stemIndex];
    const labels = ['禄', '权', '科', '忌'];
    return {
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
      items: stars.map((star, i) => ({
        star,
        label: labels[i],
        palace: chart.palaces.find(p => p.stars.some(s => s.name === star))?.name ?? '未定位',
        meaning: MEANING[labels[i]],
      })),
    };
  }, [chart, year]);

  return (
    <section className="card-glass rounded-xl p-4 mt-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--t-gold)' }}>流年解读 · 按年份查看</h3>
        <p className="text-[10px] mt-1" style={{ color: 'var(--t-faint)' }}>年份请使用上方命盘时间轴切换；依据流年干支四化叠加本命星曜宫位，展示传统象义，不等同于独立流年命盘或确定性预言。</p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: 'var(--t-text2)' }}>{year} 年 · {result.stem}{result.branch}年 · 流年四化落点</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {result.items.map(item => (
          <div key={item.label} className="rounded-lg p-3" style={{ border: '1px solid var(--t-border)', background: 'var(--t-surface)' }}>
            <div className="flex items-center justify-between mb-1">
              <strong className="text-sm" style={{ color: 'var(--t-gold)' }}>{item.star}化{item.label}</strong>
              <span className="text-[10px]" style={{ color: 'var(--t-faint)' }}>{item.palace}</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
