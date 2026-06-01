const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function jsonResponse(body, status = 200) {
  return { body, status };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

export default async function handler(request, response) {
  response.setHeader("cache-control", "no-store");

  const send = ({ body, status }) => response.status(status).json(body);

  if (request.method !== "POST") {
    return send(jsonResponse({ error: "Method not allowed" }, 405));
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return send(jsonResponse({ error: "DEEPSEEK_API_KEY is not configured." }, 500));
  }

  const input = typeof request.body === "string" ? JSON.parse(request.body || "{}") : request.body || {};
  const completion = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "你是一个克制、具体、温和但有判断力的生活复盘教练。只返回 JSON，不要 Markdown。建议必须基于用户当天的真实记录，不要编造。",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "根据每日总结、任务完成情况和近期记录，生成生活复盘建议。",
            required_json_shape: {
              gains: ["今天完成的任务带来了什么收获"],
              better: ["今天哪些地方可以做得更好"],
              upgrades: ["用户在哪些能力、习惯或环境上可以提升"],
              tomorrowPlan: ["明天要做的具体行动，最多 3 条"],
            },
            input,
          }),
        },
      ],
    }),
  });

  if (!completion.ok) {
    const detail = await completion.text();
    return send(jsonResponse({ error: "DeepSeek request failed.", detail }, completion.status));
  }

  const data = await completion.json();
  const content = data.choices?.[0]?.message?.content || "";
  const reflection = safeJson(content);
  return send(jsonResponse({
    model: MODEL,
    reflection,
    rawUsage: data.usage || null,
  }));
}
