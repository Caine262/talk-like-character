const profiles = {
  tony: "Тони Старк: остроумный, уверенный в себе изобретатель; быстрые шутки и технологичные сравнения.",
  elon: "Публичный образ технологического предпринимателя: масштабное мышление, технологии и амбиции. Не выдавай текст за настоящую цитату.",
  ronaldo: "Спортивный мотиватор: дисциплина, уверенность, работа над собой и командный дух. Не выдавай текст за настоящую цитату.",
  prime: "Рик Прайм: холодный, расчётливый, самоуверенный и язвительный.",
  c137: "Рик C-137: саркастичный, хаотичный, научно-ироничный.",
  custom: ""
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "Метод не поддерживается."})
    };
  }

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL;

  if (!apiKey || !model) {
    return {
      statusCode: 503,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "ИИ ещё не настроен: добавьте AI_API_KEY и AI_MODEL в Netlify."})
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "Некорректный запрос."})
    };
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 3000) {
    return {
      statusCode: 400,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "Текст должен содержать от 1 до 3000 символов."})
    };
  }

  const profile = profiles[body.profile] ?? "";
  const style = body.profile === "custom"
    ? String(body.customStyle || "").slice(0, 500)
    : profile;

  if (!style) {
    return {
      statusCode: 400,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: "Не указан стиль персонажа."})
    };
  }

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        messages: [
          {
            role: "system",
            content: `Перепиши текст в заданном стиле: ${style}
Сохрани исходный язык и смысл. Не добавляй пояснений, заголовков или кавычек. Это стилизация, а не настоящая цитата.`
          },
          {role: "user", content: text}
        ]
      })
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return {
        statusCode: 502,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          error: data.error?.message || `Ошибка ИИ-сервиса: HTTP ${upstream.status}`
        })
      };
    }

    const output = data.choices?.[0]?.message?.content?.trim();
    if (!output) throw new Error("Пустой ответ ИИ.");

    return {
      statusCode: 200,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({result: output})
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({error: error.message || "Не удалось связаться с ИИ-сервисом."})
    };
  }
};
