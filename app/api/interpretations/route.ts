import { Readable, Transform } from 'node:stream';
import * as zlib from 'node:zlib';
import { StringDecoder } from 'node:string_decoder';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RELEASE_BASE = 'https://github.com/Renhuai123/ziwei-doushu/releases/download/v4.0-13d';
const createZstdDecompress = (zlib as unknown as { createZstdDecompress: () => Transform }).createZstdDecompress;

type DatasetRecord = { k?: string; c?: Record<string, string> };

function json(data: unknown, status = 200, cache = 'no-store') {
  return Response.json(data, { status, headers: { 'Cache-Control': cache } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') ?? '';
  const hour = Number(url.searchParams.get('hour'));
  const gender = url.searchParams.get('gender') ?? '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour) || hour < 0 || hour > 11 || !['male', 'female'].includes(gender)) {
    return json({ error: '参数无效：需要 date、hour（0–11）和 gender（male/female）。' }, 400);
  }

  const [yearText, monthText, dayText] = date.split('-');
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const dateCheck = new Date(Date.UTC(year, month - 1, day));
  if (dateCheck.getUTCFullYear() !== year || dateCheck.getUTCMonth() !== month - 1 || dateCheck.getUTCDate() !== day) {
    return json({ error: '出生日期不是有效的公历日期。' }, 400);
  }
  if (year < 1950 || year > 2026) return json({ error: '13 维数据集目前覆盖 1950–2026 年出生日期。' }, 400);

  const key = `${date}-${hour}-${gender}`;
  try {
    const asset = await fetch(`${RELEASE_BASE}/year-${year}.jsonl.zst`, {
      headers: { 'User-Agent': 'ziwei-doushu-web/1.0', Accept: 'application/octet-stream' },
      signal: request.signal,
    });
    if (!asset.ok || !asset.body) return json({ error: '公开数据文件暂时无法读取，请稍后重试。' }, 502);

    const compressed = Readable.fromWeb(asset.body as import('node:stream/web').ReadableStream<Uint8Array>);
    const decompressor = createZstdDecompress();
    const decoder = new StringDecoder('utf8');
    let pending = '';
    let match: DatasetRecord | null = null;

    try {
      for await (const chunk of compressed.pipe(decompressor)) {
        pending += decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
        let newline = pending.indexOf('\n');
        while (newline !== -1) {
          const line = pending.slice(0, newline).trim();
          pending = pending.slice(newline + 1);
          if (line) {
            const record = JSON.parse(line) as DatasetRecord;
            if (record.k === key) { match = record; break; }
          }
          newline = pending.indexOf('\n');
        }
        if (match) { compressed.destroy(); decompressor.destroy(); break; }
      }
      if (!match) {
        pending += decoder.end();
        const tail = pending.trim();
        if (tail) {
          const record = JSON.parse(tail) as DatasetRecord;
          if (record.k === key) match = record;
        }
      }
    } finally {
      compressed.destroy();
      decompressor.destroy();
    }

    if (!match?.c) return json({ error: '数据集中没有找到这组出生日期、时辰和性别对应的命盘，请核对出生信息。' }, 404);
    return json(
      { key, version: 'v4.0-13d', dimensions: match.c, source: '紫微斗数开源解读数据集 v4.0' },
      200,
      'public, s-maxage=86400, stale-while-revalidate=604800',
    );
  } catch {
    return json({ error: '读取或解压年度数据时发生错误，请稍后重试。' }, 502);
  }
}
