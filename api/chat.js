export default async function handler(req, res) {

  // ===== CORS =====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(200).send("AI running");
  }

  try {

    const { message, products = [] } = req.body;
    const lower = message.toLowerCase();

    // ===============================
    // طلب شراء → تحويل واتساب
    // ===============================
    if (
      lower.includes("اطلب") ||
      lower.includes("شراء") ||
      lower.includes("buy") ||
      lower.includes("order")
    ) {
      return res.status(200).json({
        type: "action",
        reply: "ممتاز 👌 يمكنك إتمام الطلب عبر:",
        actions: {
          whatsapp: "https://wa.me/201007797155",
          phone: "tel:01007797155",
          email: "mailto:sales@summergarden.com"
        }
      });
    }

    // ===============================
    // البحث في المنتجات
    // ===============================
    const matched = products.filter(p =>
      lower.includes((p.name || "").toLowerCase()) ||
      lower.includes((p.nameAr || "").toLowerCase()) ||
      lower.includes((p.serial || "").toLowerCase())
    ).slice(0, 3);

    if (matched.length > 0) {
      return res.status(200).json({
        type: "products",
        reply: "رشحنا لك هذه المنتجات 👇",
        products: matched.map(p => ({
          name: p.nameAr || p.name,
          image: p.img,
          link: p.link
        }))
      });
    }

    // ===============================
    // ذكاء صناعي OpenRouter
    // ===============================
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a luxury floral sales assistant for Summer Garden.
Speak elegantly and help the customer choose products.
If user writes Arabic reply in Arabic.
If they ask about flowers suggest items.
`
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "كيف يمكنني مساعدتك؟";

    return res.status(200).json({
      type: "text",
      reply
    });

  } catch (error) {
    console.error("AI ERROR:", error);

    return res.status(200).json({
      type: "text",
      reply: "حدث خطأ مؤقت في السيرفر"
    });
  }
}
