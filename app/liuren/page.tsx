'use client';
import { useMemo, useState } from 'react';
import { Solar } from 'lunar-javascript';
import { useRouter } from 'next/navigation';

const NAMES = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
const READINGS = [
  ['安稳、守成、循序渐进', '适合按计划推进，重视长期积累；不宜因一时心急而频繁变动。'],
  ['牵绊、延迟、反复', '事情可能需要更多沟通与等待；先厘清条件，再决定下一步。'],
  ['喜讯、效率、进展', '适合主动表达、联络与推动；重要事项仍应核实细节。'],
  ['口舌、争执、规则', '沟通时留意语气与证据，合同和约定尽量写清楚。'],
  ['助力、和合、渐进', '适合协作、寻求支持与稳步推进；把握互相配合的机会。'],
  ['落空、变数、暂缓', '当前信息可能不足或计划易变；宜先补充事实，不必急于定论。'],
];

export default function LiuRenPage() {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0'));
  const [hour, setHour] = useState('子');
  const [question, setQuestion] = useState('');
  const result = useMemo(() => {
    const parts = date.split('-').map(Number);
    if (parts.length !== 3 || !parts.every(Number.isFinite)) return null;
    const [y,m,d] = parts;
    if (!y || !m || !d) return null;
    try {
      const lunar = Solar.fromYmd(y,m,d).getLunar();
      const rawMonth = lunar.getMonth();
      const month = Math.abs(rawMonth);
      const day = lunar.getDay();
      const hourIndex = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].indexOf(hour);
      const index = ((month - 1 + day - 1 + hourIndex) % 6 + 6) % 6;
      return { lunarMonth: month, leapMonth: rawMonth < 0, lunarDay: day, name: NAMES[index], reading: READINGS[index], index };
    } catch { return null; }
  }, [date,hour]);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '36px 20px 70px', minHeight: '80vh' }}>
      <button onClick={() => router.push('/')} className="text-xs mb-6" style={{ color: 'var(--tx-3)' }}>← 返回首页</button>
      <header className="text-center mb-8">
        <p className="text-[10px] tracking-[0.4em] mb-3" style={{ color: 'var(--ac)' }}>TRADITIONAL SIX REN</p>
        <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--tx-0)' }}>小六壬起课</h1>
        <p className="text-sm" style={{ color: 'var(--tx-3)' }}>按农历月、日与时辰起课，提供传统象义参考。</p>
      </header>
      <section className="card-glass rounded-2xl p-5 sm:p-7">
        <label className="block text-xs mb-2" style={{ color: 'var(--tx-2)' }}>起课日期（公历）</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-base w-full mb-4" />
        <label className="block text-xs mb-2" style={{ color: 'var(--tx-2)' }}>起课时辰</label>
        <select value={hour} onChange={e => setHour(e.target.value)} className="input-base w-full mb-4">
          {['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].map(x => <option key={x} value={x}>{x}时</option>)}
        </select>
        <label className="block text-xs mb-2" style={{ color: 'var(--tx-2)' }}>所问事项（可选）</label>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="例如：这次面试进展如何？" className="input-base w-full" maxLength={80} />
      </section>
      {result ? (
        <section className="card-glass rounded-2xl p-6 mt-5 text-center">
          <p className="text-xs mb-2" style={{ color: 'var(--tx-3)' }}>农历 {result.leapMonth ? '闰' : ''}{result.lunarMonth}月{result.lunarDay}日 · {hour}时</p>
          <div className="text-4xl font-semibold tracking-widest my-4" style={{ color: 'var(--ac)' }}>{result.name}</div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--tx-0)' }}>{result.reading[0]}</p>
          <p className="text-sm leading-7" style={{ color: 'var(--tx-2)' }}>{result.reading[1]}</p>
          {question && <p className="text-xs mt-4 pt-4" style={{ borderTop: '1px solid var(--bdr)', color: 'var(--tx-3)' }}>所问：{question}</p>}
          <p className="text-[10px] mt-5" style={{ color: 'var(--tx-3)' }}>采用常见「农历月日起时」六宫顺推法；不同传承在起课时点与取数口径上可能有差异。</p>
        </section>
      ) : <p className="text-sm mt-4" style={{ color: '#b45309' }}>日期无效，请重新选择。</p>}
    </main>
  );
}
