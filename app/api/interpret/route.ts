type ChatMessage = { role: 'user' | 'assistant'; content: string };

function providerConfig() {
  const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();

  if (provider === 'deepseek') {
    return {
      provider,
      key: process.env.DEEPSEEK_API_KEY,
      baseUrl: 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    };
  }

  if (provider === 'mimo') {
    return {
      provider,
      key: process.env.MIMO_API_KEY,
      baseUrl: (process.env.MIMO_BASE_URL || '').replace(/\/$/, ''),
      model: process.env.MIMO_MODEL || '',
    };
  }

  if (provider === 'openai') {
    return {
      provider,
      key: process.env.OPENAI_API_KEY,
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  return { provider, key: undefined, baseUrl: '', model: '' };
}

export async function GET() {
  const config = providerConfig();
  return Response.json({
    enabled: Boolean(config.key && config.baseUrl && config.model),
    provider: config.provider,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const config = providerConfig();
  if (!config.key || !config.baseUrl || !config.model) {
    return Response.json({
      error: 'AI 解读尚未启用。13 维数据查询不需要 API Key；如需 AI 问答，请在 Vercel 项目环境变量中配置 AI_PROVIDER 和对应服务商 API Key。',
      code: 'AI_NOT_CONFIGURED',
    }, { status: 503 });
  }

  let body: { chart?: unknown; messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '请求内容不是有效 JSON。' }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 30) {
    return Response.json({ error: '对话消息格式无效。' }, { status: 400 });
  }

  const messages = body.messages.filter((item): item is ChatMessage =>
    item && (item.role === 'user' || item.role === 'assistant') &&
    typeof item.content === 'string' && item.content.length <= 8000
  );
  if (messages.length !== body.messages.length || messages.length === 0) {
    return Response.json({ error: '消息内容无效或过长。' }, { status: 400 });
  }

  const chartContext = JSON.stringify(body.chart ?? {});
  if (chartContext.length > 50000) {
    return Response.json({ error: '命盘信息过长。' }, { status: 413 });
  }

  const systemPrompt = [
    '你是一位严谨、审慎的紫微斗数文化研究助手。',
    '请基于用户提供的命盘结构和对话内容解释，不要编造未提供的星曜、宫位或四化。',
    '区分传统术数观点与可验证事实；避免宿命论和绝对化断言。',
    '健康、投资、法律等问题只作文化角度参考，不替代专业意见。',
    '回答使用简体中文，结构清晰，必要时指出命盘信息的局限。',
    '用户命盘 JSON：',
    chartContext,
  ].join('\n\n');

  let upstream: Response;
  try {
    upstream = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.6,
      }),
      signal: request.signal,
    });
  } catch {
    return Response.json({ error: '无法连接 AI 服务商，请检查服务商地址或网络。' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return Response.json({
      error: `AI 服务商返回错误（${upstream.status}）：${detail.slice(0, 500)}`,
    }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline = buffer.indexOf('\n');
          while (newline !== -1) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                const text = typeof content === 'string'
                  ? content
                  : Array.isArray(content)
                    ? content.map((part: { text?: string }) => part.text || '').join('')
                    : '';
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`));
                }
              } catch {
                // Ignore non-JSON keep-alive frames.
              }
            }
            newline = buffer.indexOf('\n');
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        controller.error(new Error('AI stream interrupted'));
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
