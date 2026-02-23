export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).send("AI running");
  }

  try {

    const { message, products = [] } = req.body;
    const lower = message.toLowerCase();

    // ========= لو العميل عاوز ينفذ =========
    if (
      lower.includes("اطلب") ||
      lower.includes("عاوز") ||
      lower.includes("شراء") ||
      lower.includes("order") ||
      lower.includes("buy")
    ) {
      return res.status(200).json({
        type: "action",
        reply: "ممتاز 👌 لتنفيذ الطلب تواصل معنا مباشرة:",
        actions: {
          whatsapp: "https://wa.me/201007797155",
          phone: "tel:01007797155",
          email: "mailto:info@summergarden-eg.com"
        }
      });
    }

    // ========= البحث في المنتجات =========
    const matched = products.filter(p =>
      lower.includes(p.name?.toLowerCase()) ||
      lower.includes(p.nameAr?.toLowerCase())
    ).slice(0, 3);

    if (matched.length > 0) {
      return res.status(200).json({
        type: "products",
        reply: "رشحنا لك المنتجات التالية 👇",
        products: matched.map(p => ({
          name: p.nameAr || p.name,
          image: p.img,
          link: p.link
        }))
      });
    }

    // ========= رد ذكي عام =========
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
            role: "system",
            content: `
أنت مساعد مبيعات احترافي لمتجر Summer Garden.
- لا تذكر أسعار.
- رشح منتجات.
- استخدم العربية إذا كان السؤال عربي.
- هدفك تحويل العميل للشراء.
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

    return res.status(200).json({
      type: "text",
      reply: data.choices?.[0]?.message?.content || "تواصل معنا عبر واتساب 01007797155"
    });

  } catch (e) {
    console.log(e);
    return res.status(200).json({
      type: "text",
      reply: "حدث خطأ مؤقت، تواصل معنا عبر واتساب 01007797155"
    });
  }
}
