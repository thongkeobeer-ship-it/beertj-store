// ============================================
// Worker ຫຼັກ: ຈັດການ /api/verify-slip ເອງ, ນອກນັ້ນປ່ອຍໃຫ້ static assets ຈັດການ
// ============================================

const MODEL = "gemini-3.6-flash";


export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/verify-slip" && request.method === "POST") {
      return handleVerifySlip(request, env);
    }

    // ໜ້າອື່ນໆ ທັງໝົດ → ໃຫ້ static assets (ໄຟລ໌ html/css/js ເດີມ) ຈັດການຕາມປົກກະຕິ
    return env.ASSETS.fetch(request);
  },
};

async function handleVerifySlip(request, env) {
  try {
    const { imageUrl, expectedAmount } = await request.json();

    if (!imageUrl || !expectedAmount) {
      return jsonResponse({ error: "ຂໍ້ມູນບໍ່ຄົບ (ຕ້ອງມີ imageUrl ແລະ expectedAmount)" }, 400);
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: "ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ GEMINI_API_KEY (Worker > Bindings > Add > Secret)" }, 500);
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return jsonResponse({ error: "ໂຫຼດຮູບສະລິບບໍ່ໄດ້" }, 400);
    }
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    const prompt = `ນີ້ແມ່ນຮູບພາບສະລິບໂອນເງິນຈາກແອັບທະນາຄານ (Lao/Thai banking app). ອ່ານຂໍ້ມູນຈາກສະລິບແລ້ວຕອບເປັນ JSON ຢ່າງດຽວ ຫ້າມມີຂໍ້ຄວາມອື່ນນອກ JSON, ຮູບແບບຄື:
{
  "is_slip": true ຫຼື false,
  "amount": ຕົວເລກຈຳນວນເງິນທີ່ອ່ານໄດ້ (ບໍ່ມີຈຸດ ຫຼື ຄອມມາ, null ຖ້າອ່ານບໍ່ໄດ້),
  "date_time": "ວັນທີ-ເວລາທີ່ອ່ານໄດ້ ຫຼື null",
  "reference": "ເລກອ້າງອີງ/ລະຫັດທຸລະກຳ ຫຼື null",
  "matches_expected": true ຫຼື false,
  "suspicious": true ຫຼື false,
  "note": "ໝາຍເຫດສັ້ນໆ ເປັນພາສາລາວ ອະທິບາຍວ່າເປັນຫຍັງຈຶ່ງຕັດສິນແບບນັ້ນ"
}
ຍອດເງິນທີ່ຄາດໄວ້ຄື: ${expectedAmount} ກີບ. ໃຫ້ set matches_expected=true ຖ້າຈຳນວນເງິນທີ່ອ່ານໄດ້ຈາກສະລິບເທົ່າກັບ (ຫຼືໃກ້ຄຽງຫຼາຍ) ຍອດນີ້. ໃຫ້ set suspicious=true ຖ້າພາບເບິ່ງຄືຖືກຕັດຕໍ່, ຟອນຜິດປົກກະຕິ, ຫຼືບໍ່ຄືສະລິບທະນາຄານແທ້.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: contentType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", errText);
      return jsonResponse({ error: "Gemini API ຜິດພາດ ລອງໃໝ່ພາຍຫຼັງ" }, 502);
    }

    const geminiData = await geminiRes.json();
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { error: "ອ່ານຜົນຈາກ AI ບໍ່ໄດ້", raw: text };
    }

    return jsonResponse(result, 200);
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "ເກີດຂໍ້ຜິດພາດພາຍໃນ server" }, 500);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
