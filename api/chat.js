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

    const text = message || "";
    const lower = text.toLowerCase();

    // ===== تحديد اللغة =====
    const isEnglish = /[a-z]/i.test(text);
    const lang = isEnglish ? "en" : "ar";

    // ===== بيانات المتجر =====
    const store = {
      name: "Summer Garden",
      phone: "01007797155",
      whatsapp: "https://wa.me/201007797155",
      branches: [
        "New Cairo: Dyar Mall beside Flamingo",
        "Mansoura: Toreil"
      ]
    };

    // ===== سؤال عن الفروع =====
    if (
      lower.includes("branch") ||
      lower.includes("address") ||
      lower.includes("فرع") ||
      lower.includes("عنوان")
    ) {
      return res.json({
        type: "text",
        reply:
          lang === "ar"
            ? `فروعنا:
- التجمع: داير مول بجوار فلامنجو
- المنصورة: توريل
للتواصل: ${store.phone}`
            : `Our branches:
- New Cairo: Dyar Mall beside Flamingo
- Mansoura: Toreil
Phone: ${store.phone}`
      });
    }

    // ===== طلب شراء =====
    if (
      lower.includes("buy") ||
      lower.includes("order") ||
      lower.includes("اطلب") ||
      lower.includes("شراء")
    ) {
      return res.json({
        type: "action",
        reply:
          lang === "ar"
            ? "يمكنك إتمام الطلب عبر واتساب"
            : "You can complete your order via WhatsApp",
        actions: {
          whatsapp: store.whatsapp,
          phone: "tel:+201007797155"
        }
      });
    }

    // ===== بحث منتجات ذكي =====
    const keywords = lower.split(" ");

    const found = products
      .map(p => {
        const name = (p.name || "").toLowerCase();
        const nameAr = (p.nameAr || "").toLowerCase();

        let score = 0;

        keywords.forEach(k => {
          if (name.includes(k)) score++;
          if (nameAr.includes(k)) score++;
        });

        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (found.length > 0) {
      return res.json({
        type: "products",
        reply:
          lang === "ar"
            ? "رشحنا لك هذه المنتجات"
            : "Here are some suggestions",
        products: found.map(p => ({
          name: lang === "ar" ? p.nameAr || p.name : p.name,
          image: p.img,
          link: p.link
        }))
      });
    }

    // ===== AI ذكي =====
    const systemPrompt = `
You are a luxury flower shop assistant for Summer Garden.

Store info:
Phone: ${store.phone}
Branches: ${store.branches.join(", ")}

Rules:
- Reply in Arabic if user writes Arabic
- Reply in English if user writes English
- Be short and professional
- Suggest products if relevant
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return res.json({
      type: "text",
      reply
    });

  } catch (e) {
    console.log(e);
    return res.json({
      type: "text",
      reply: "Server error"
    });
  }
}
