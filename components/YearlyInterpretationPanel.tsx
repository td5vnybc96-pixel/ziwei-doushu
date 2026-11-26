'use client';
import { useMemo, useState } from 'react';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { SI_HUA_TABLE, STEMS, BRANCHES, STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';

const DIMENSIONS = [
  { key: 'overview', label: '总览', palace: '命宫', focus: '年度主轴、整体节奏与需要优先处理的主题' },
  { key: 'personality', label: '性格', palace: '命宫', focus: '自我表达、判断方式与行动状态' },
  { key: 'love', label: '感情', palace: '夫妻宫', focus: '亲密关系、承诺、沟通与相处边界' },
  { key: 'career', label: '事业', palace: '官禄宫', focus: '工作方向、责任、合作与发展机会' },
  { key: 'wealth', label: '金钱', palace: '财帛宫', focus: '收入、支出、资源配置与风险意识' },
  { key: 'health', label: '健康', palace: '疾厄宫', focus: '身心负荷、作息与日常照护；不作医学诊断' },
  { key: 'family', label: '手足', palace: '兄弟宫', focus: '手足、同辈、团队与资源往来' },
  { key: 'children', label: '子女', palace: '子女宫', focus: '子女、作品、创意与长期培育的事物' },
  { key: 'move', label: '迁移', palace: '迁移宫', focus: '外部环境、出行、异地发展与对外机会' },
  { key: 'friends', label: '人际', palace: '交友宫', focus: '朋友、客户、社群与合作关系' },
  { key: 'home', label: '居所', palace: '田宅宫', focus: '居住环境、家庭资产与空间安排' },
  { key: 'spirit', label: '内在', palace: '福德宫', focus: '精神状态、休息质量与满足感' },
  { key: 'parents', label: '长辈', palace: '父母宫', focus: '长辈、师长、制度资源与文书沟通' },
] as const;

const HUA_MEANING: Record<string, string> = {
  '禄': '化禄：资源、机会、人缘与可用条件增加，宜主动经营并留意成本。',
  '权': '化权：行动、责任与主导性增强，宜明确分工，避免控制过度。',
  '科': '化科：学习、表达、口碑与协调空间增加，适合整理成果、建立信任。',
  '忌': '化忌：牵挂、反复或阻力较容易被看见，宜留缓冲并核对细节。',
};

export default function YearlyInterpretationPanel({ chart, year }: { chart: ZiweiChart; year: number }) {
  const [active, setActive] = useState<(typeof DIMENSIONS)[number]['key']>('overview');
  const result = useMemo(() => {
    const stemIndex = ((year - 4) % 10 + 10) % 10;
    const branchIndex = ((year - 4) % 12 + 12) % 12;
    const stars = SI_HUA_TABLE[stemIndex];
    const labels = ['禄', '权', '科', '忌'];
    const transformations = stars.map((star, i) => {
      const palace = chart.palaces.find(p => p.stars.some(s => s.name === star));
      return { star, label: labels[i], palace: palace?.name ?? '未定位' };
    });
    const sections = DIMENSIONS.map(d => {
      const palace = chart.palaces.find(p => p.name === d.palace);
      const majorStars = palace?.stars.filter(s => s.type === 'major').map(s => s.name) ?? [];
      const allStars = palace?.stars.map(s => s.name) ?? [];
      const related = transformations.filter(t => t.palace === d.palace);
      const starProfiles = majorStars.map(name => ({ name, profile: STAR_DESCRIPTIONS[name] })).filter(x => x.profile);
      const huaText = related.length
        ? related.map(t => `${t.star}化${t.label}（${HUA_MEANING[t.label]}）`).join('；')
        : '本宫没有直接承接本年四化星；需结合本宫星曜、对宫及三方四正一并观察，不宜只凭单宫下结论。';
      return {
        ...d,
        majorStars,
        allStars,
        related,
        text: `${d.focus}。本宫主星：${majorStars.join('、') || '空宫（需参考对宫借星）'}。主星取象：${starProfiles.map(x => `${x.name}（${x.profile!.keywords}；${x.profile!.nature}）`).join('；') || '空宫须借对宫主星参看'}。本宫可见星曜：${allStars.slice(0, 8).join('、') || '暂无星曜资料'}。年度四化：${huaText}`,
      };
    });
    return { stem: STEMS[stemIndex], branch: BRANCHES[branchIndex], transformations, sections };
  }, [chart, year]);
  const current = result.sections.find(s => s.key === active) ?? result.sections[0];

  return (
    <section className="card-glass rounded-xl p-4 mt-4">
      <div className="mb-3">
        <h3 className="text-xs font-semibold tracking-widest" style={{ color: 'var(--t-gold)' }}>流年 13 主题解读 · 按年份查看</h3>
        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'var(--t-faint)' }}>
          依据流年干支四化与本命十二宫结构，按 13 个主题逐项呈现。此处为规则化流年推演，不是 v4.0 本命 13 维数据集原文，也不等同于重新安置十二宫的完整流年盘。
        </p>
      </div>
      <p className="text-[11px] mb-3" style={{ color: 'var(--t-text2)' }}>{year} 年 · {result.stem}{result.branch}年 · 流年四化落点</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {result.transformations.map(item => (
          <div key={item.label} className="rounded-lg p-2" style={{ border: '1px solid var(--t-border)', background: 'var(--t-surface)' }}>
            <strong className="text-xs" style={{ color: 'var(--t-gold)' }}>{item.star}化{item.label}</strong>
            <p className="text-[10px] mt-1" style={{ color: 'var(--t-faint)' }}>{item.palace}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {DIMENSIONS.map(d => (
          <button key={d.key} type="button" onClick={() => setActive(d.key)}
            className="rounded-md px-2 py-1.5 text-[10px]"
            style={{
              background: active === d.key ? 'rgba(212,168,67,0.12)' : 'transparent',
              border: `1px solid ${active === d.key ? 'rgba(212,168,67,0.35)' : 'var(--t-border)'}`,
              color: active === d.key ? 'var(--t-gold)' : 'var(--t-text2)',
            }}>{d.label}</button>
        ))}
      </div>
      <article className="rounded-lg p-3" style={{ background: 'var(--t-surface)', border: '1px solid var(--t-border)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <strong className="text-sm" style={{ color: 'var(--t-gold)' }}>{current.label} · {current.palace}</strong>
          <span className="text-[10px]" style={{ color: 'var(--t-faint)' }}>{current.related.length ? `承接 ${current.related.length} 项四化` : '无直接四化落入'}</span>
        </div>
        <p className="text-xs leading-7" style={{ color: 'var(--t-text2)' }}>{current.text}</p>
      </article>
      <p className="text-[9px] mt-3 leading-relaxed" style={{ color: 'var(--t-faint)' }}>
        传统术数内容仅作文化研究与自我观察参考；涉及健康、投资、婚姻等重要决定，请以现实信息和专业意见为准。
      </p>
    </section>
  );
}
