import type { ZiweiChart } from '@/lib/ziwei/types';
import { STEMS, BRANCHES } from '@/lib/ziwei/constants';

const STEM_ELEMENT: Record<string, string> = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' };
const BRANCH_ELEMENT: Record<string, string> = { 子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水' };
const SIX_COMBINE = new Set(['子丑','寅亥','卯戌','辰酉','巳申','午未']);
const SIX_CLASH = new Set(['子午','丑未','寅申','卯酉','辰戌','巳亥']);
const SIX_HARM = new Set(['子未','丑午','寅巳','卯辰','申亥','酉戌']);
const STEM_COMBINE: Record<string,string> = { 甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊' };
const STEM_CLASH: Record<string,string> = { 甲:'庚',庚:'甲',乙:'辛',辛:'乙',丙:'壬',壬:'丙',丁:'癸',癸:'丁' };
const GENERATES: Record<string,string> = { 木:'火',火:'土',土:'金',金:'水',水:'木' };
const CONTROLS: Record<string,string> = { 木:'土',土:'水',水:'火',火:'金',金:'木' };

function pillars(chart: ZiweiChart): string[] {
  const p = chart.lunarInfo.fourPillars ?? chart.lunarInfo.fourPillarsLunar ?? [];
  return p.filter(x => typeof x === 'string' && x.length >= 2);
}
function relation(a: string, b: string) {
  const x = a + b;
  if (SIX_COMBINE.has(x) || SIX_COMBINE.has(b + a)) return '六合：较容易形成协作、互相牵引的关系';
  if (SIX_CLASH.has(x) || SIX_CLASH.has(b + a)) return '六冲：节奏或立场容易不同，需要提前沟通';
  if (SIX_HARM.has(x) || SIX_HARM.has(b + a)) return '六害：容易出现误会或隐性消耗，适合把话说清楚';
  return '';
}
function elementBalance(ps: string[]) {
  const counts: Record<string,number> = { 木:0,火:0,土:0,金:0,水:0 };
  for (const p of ps) {
    const gan = p[0], zhi = p[1];
    if (STEM_ELEMENT[gan]) counts[STEM_ELEMENT[gan]]++;
    if (BRANCH_ELEMENT[zhi]) counts[BRANCH_ELEMENT[zhi]]++;
  }
  return counts;
}
function elementRelation(a: string, b: string) {
  if (GENERATES[a] === b) return '甲方日主五行生乙方日主五行，互动上较容易出现支持、付出或带动';
  if (GENERATES[b] === a) return '乙方日主五行生甲方日主五行，互动上较容易出现支持、付出或带动';
  if (CONTROLS[a] === b) return '甲方日主五行克乙方日主五行，容易形成推动力，也要避免一方主导过多';
  if (CONTROLS[b] === a) return '乙方日主五行克甲方日主五行，容易形成推动力，也要避免一方主导过多';
  if (a === b) return '双方日主五行相同，价值观或反应方式可能相近，也要留意固执与竞争';
  return '双方日主五行之间没有直接生克，宜更多观察实际沟通与生活习惯';
}

export function buildBaziCompatibility(chartA: ZiweiChart, chartB: ZiweiChart, years = [2026,2027,2028,2029,2030]) {
  const a = pillars(chartA).slice(0, chartA.birthInfo.unknownTime ? 3 : 4);
  const b = pillars(chartB).slice(0, chartB.birthInfo.unknownTime ? 3 : 4);
  const names = ['年柱','月柱','日柱','时柱'];
  if (a.length < 3 || b.length < 3) {
    return '八字资料不完整：本次仍可查看紫微命宫、夫妻宫互参，但不对缺失柱位作推断。';
  }
  const aGan = a.map(p => p[0]), bGan = b.map(p => p[0]);
  const aZhi = a.map(p => p[1]), bZhi = b.map(p => p[1]);
  const stemMatches: string[] = [], branchMatches: string[] = [];
  aGan.forEach((x,i) => bGan.forEach((y,j) => {
    if (STEM_COMBINE[x] === y) stemMatches.push(`甲方${names[i]}天干${x}与乙方${names[j]}天干${y}相合`);
    if (STEM_CLASH[x] === y) stemMatches.push(`甲方${names[i]}天干${x}与乙方${names[j]}天干${y}相冲`);
  }));
  aZhi.forEach((x,i) => bZhi.forEach((y,j) => {
    const note = relation(x,y);
    if (note) branchMatches.push(`甲方${names[i]}${x}与乙方${names[j]}${y}：${note}`);
  }));
  const dayA = STEM_ELEMENT[a[2][0]], dayB = STEM_ELEMENT[b[2][0]];
  const elementsA = elementBalance(a), elementsB = elementBalance(b);
  const describe = (x: Record<string,number>) => Object.entries(x).map(([k,v]) => `${k}${v}`).join(' · ');
  const timing = years.map(year => {
    const gan = STEMS[((year-4)%10+10)%10], zhi = BRANCHES[((year-4)%12+12)%12];
    const annualElement = STEM_ELEMENT[gan];
    const aTouch = aZhi.map((n,i) => relation(n,zhi) ? `${names[i]}${n}与流年${zhi}形成关系` : '').filter(Boolean);
    const bTouch = bZhi.map((n,i) => relation(n,zhi) ? `${names[i]}${n}与流年${zhi}形成关系` : '').filter(Boolean);
    const tone = [...aTouch,...bTouch].some(x => x.includes('六冲') || x.includes('六害')) ? '变化与磨合主题较明显，重要决定宜留缓冲' :
      [...aTouch,...bTouch].some(x => x.includes('六合')) ? '较适合推动协作、沟通与共同计划' : '未见明显的年支合冲提示，适合以现实进展和双方节奏为主';
    return `${year}（${gan}${zhi}，${annualElement}气）：${tone}。${[...aTouch,...bTouch].join('；') || '双方四柱地支与流年支未见直接六合、六冲或六害'}`;
  });
  const stemText = stemMatches.length ? stemMatches.join('；') : '双方四柱天干未见本次规则表所列的五合或相冲';
  const branchText = branchMatches.length ? branchMatches.join('；') : '双方四柱地支未见直接六合、六冲或六害；仍需结合三合局、藏干及大运进一步细看';
  return [
    '【八字四柱】',
    `甲方：${a.join(' · ')}${chartA.birthInfo.unknownTime ? '（时柱未知）' : ''}；乙方：${b.join(' · ')}${chartB.birthInfo.unknownTime ? '（时柱未知）' : ''}（依次为年、月、日、时柱；若标注时柱未知则仅按前三柱）`,
    `五行分布（天干与地支表层计数，不等同旺衰）：甲方 ${describe(elementsA)}；乙方 ${describe(elementsB)}。`,
    '【性格与互动底色】',
    `甲方日主${a[2][0]}属${dayA}，乙方日主${b[2][0]}属${dayB}。${elementRelation(dayA,dayB)}。`,
    `天干互动：${stemText}。`,
    `地支互动：${branchText}。`,
    '【感情与相处】',
    '合与冲都不是感情成败的判决。合象可理解为容易靠近或互相牵动；冲害可理解为生活节奏、表达方式或期待差异更值得提前协商。建议把冲突落到具体议题：时间安排、情绪回应、家庭边界与承诺。',
    '【金钱与共同生活】',
    '双方五行分布仅作表层观察，不能单凭五行数量判定谁旺财或谁该掌财。共同财务宜明确账户边界、支出额度、储蓄目标、风险承受度与重大支出的共同决策机制。',
    '【紫微与八字综合】',
    `紫微五行局：甲方${chartA.wuxingJuName}；乙方${chartB.wuxingJuName}。建议将紫微命宫/夫妻宫结构与八字日主、四柱合冲交叉参照，不用单一合冲或五行局给关系打分。`,
    '【近年关系时机（流年地支简析）】',
    ...timing,
    '时机说明：以上只按流年干支与双方已知柱位地支的直接关系做初筛，不含双方大运、流月、流日，也不是确定性事件预测。若出生时辰不详，已排除对应时柱，不会把默认子时当作真实时辰。若要进一步细化，需要核对双方出生时刻与大运起运口径。',
  ].join('\n\n');
}
