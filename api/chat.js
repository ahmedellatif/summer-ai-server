export default async function handler(req, res) {

  // ===== CORS FIX =====
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
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

    // تحويل لو طلب تنفيذ
    if (
      lower.includes("اطلب") ||
      lower.includes("شراء") ||
      lower.includes("buy") ||
      lower.includes("order")
    ) {
      return res.status(200).json({
        type: "action",
        reply: "ممتاز 👌 لتنفيذ الطلب تواصل معنا:",
        actions: {
          whatsapp: "https://wa.me/201007797155",
          phone: "tel:01007797155",
          email: "mailto:info@summergarden-eg.com"
        }
      });
    }

    // اقتراح منتجات
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

    // رد AI عادي
    return res.status(200).json({
      type: "text",
      reply: "كيف أقدر أساعدك اليوم؟ 😊"
    });

  } catch (e) {
    return res.status(200).json({
      type: "text",
      reply: "حدث خطأ مؤقت"
    });
  }
}
