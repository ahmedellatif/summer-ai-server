export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("AI running");
  }

  const { message } = req.body;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `رد على العميل بالعربي لو عربي وبدون ذكر أسعار: ${message}`
          }
        ]
      })
    });

    const data = await response.json();

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "تواصل واتساب 01007797155"
    });

  } catch (e) {
    res.status(200).json({
      reply: "تواصل واتساب 01007797155"
    });
  }
}
