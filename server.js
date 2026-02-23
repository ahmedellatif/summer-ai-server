const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const userMemory = {};

app.post("/chat", async (req, res) => {
try {
const { message, userId, products } = req.body;

```
if (!message) {
  return res.json({ reply: "No message" });
}

const isArabic = /[\u0600-\u06FF]/.test(message);

if (!userMemory[userId]) userMemory[userId] = [];
userMemory[userId].push(message);

const memoryText = userMemory[userId].slice(-5).join("\n");

const productText = (products || [])
  .slice(0, 30)
  .map(p => `${p.serial} - ${p.nameAr || p.name}`)
  .join("\n");

const systemPrompt = isArabic
  ? `انت مساعد مبيعات فاخر لمتجر ورد صناعي اسمه Summer Garden.
```

اعرض المنتجات بالاسم والكود فقط.
لا تعرض اسعار.
لو العميل يريد شراء اطلب منه التواصل واتساب 01007797155.
منتجات:
${productText}`      :`You are a luxury sales AI for Summer Garden flowers.
Show product names and serial only.
Do NOT show prices.
If user wants to order send them to WhatsApp 01007797155.
Products:
${productText}`;

```
const fetch = (await import("node-fetch")).default;

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
      { role: "assistant", content: memoryText }
    ]
  })
});

const data = await response.json();

res.json({
  reply: data.choices?.[0]?.message?.content || "error"
});
```

} catch (e) {
console.log(e);
res.json({
reply: "تواصل معنا واتساب 01007797155"
});
}
});

app.get("/", (req, res) => {
res.send("AI server running");
});

app.listen(3000, () => console.log("server running"));
