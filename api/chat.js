export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const { message, products = [] } = req.body;

    const userText = message.toLowerCase();

    // ====== بحث عن منتجات ======
    const found = products.filter(p =>
      p.name.toLowerCase().includes(userText) ||
      p.nameAr.includes(message)
    ).slice(0,3);

    if (found.length > 0) {
      return res.json({
        type: "products",
        reply: "وجدت لك هذه المنتجات 👇",
        products: found.map(p => ({
          name: p.nameAr || p.name,
          image: p.img,
          link: p.link
        }))
      });
    }

    // ====== واتساب ======
    if (userText.includes("سعر") || userText.includes("طلب")) {
      return res.json({
        type: "action",
        reply: "يمكنك الطلب مباشرة:",
        actions: {
          whatsapp: "https://wa.me/201007797155",
          phone: "tel:+201007797155",
          email: "mailto:sales@summergarden.com"
        }
      });
    }

    // ====== fallback AI ======
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
انت مساعد متجر زهور.
اذا طلب العميل منتج حاول ترشيح منتجات.
اكتب ردود قصيرة بدون نجوم او تنسيق.
`
          },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "تمام";

    return res.json({
      type: "text",
      reply: reply
    });

  } catch (e) {
    console.log(e);
    return res.json({
      type: "text",
      reply: "كيف أساعدك؟"
    });
  }
}
