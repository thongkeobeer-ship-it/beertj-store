// ============================================
// Worker ຫຼັກ: ຈັດການ /api/verify-slip ເອງ, ນອກນັ້ນປ່ອຍໃຫ້ static assets ຈັດການ
// ============================================

const MODEL = "gemini-flash-latest"; // alias ທີ່ຈະຊີ້ໄປຫາ Gemini Flash ລຸ້ນລ່າສຸດສະເໝີ (ປັດຈຸບັນ = gemini-3.6-flash)

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

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD, ໃຊ້ໃຫ້ AI ຮູ້ວ່າ "ມື້ນີ້" ແມ່ນມື້ໃດ

    const prompt = `ເຈົ້າແມ່ນຜູ້ຊ່ຽວຊານດ້ານການກວດຈັບສະລິບໂອນເງິນປອມ (fraud/forensic examiner) ໃຫ້ທະນາຄານ. ວິເຄາະຮູບພາບສະລິບໂອນເງິນນີ້ (Lao/Thai banking app) ຢ່າງລະອຽດທີ່ສຸດ ຄືກັບຄົນກວດເອກະສານມືອາຊີບ ຢ່າຮີບຕັດສິນ, ໃຫ້ກວດທຸກຈຸດຕໍ່ໄປນີ້ກ່ອນສະຫຼຸບຜົນ:

1) ໂລໂກ້ທະນາຄານ: ຄົມຊັດ, ສີຖືກຕ້ອງ, ອັດຕາສ່ວນ/ຮູບຮ່າງບໍ່ບິດເບືອນ, ຕຳແໜ່ງບໍ່ຫຼົ້ນ/ບໍ່ຊ້ອນທັບກັບອົງປະກອບອື່ນ
2) ຄວາມຄົມຂອງພາບ: ຈຸດທີ່ເບີ່ງເບລີ, pixelate, ຫຼື resolution ບໍ່ເທົ່າກັນລະຫວ່າງສ່ວນຕ່າງໆຂອງສະລິບ (ສັນຍານວ່າມີການ paste/ຕັດຕໍ່ບາງສ່ວນທັບລົງໄປ)
3) ຕົວອັກສອນ/ຕົວເລກ: font ບໍ່ຄືກັນ, ຂະໜາດ/ນ້ຳໜັກ (bold/thin) ບໍ່ສະໝ່ຳສະເໝີ, ໄລຍະຫ່າງລະຫວ່າງໂຕອັກສອນຜິດປົກກະຕິ, ໂຕເລກບໍ່ຢູ່ໃນແນວດຽວກັນ (misaligned), ມີເງົາ/ຂອບແປກໆອ້ອມໂຕເລກ (ຮ່ອງຮອຍການແກ້ໄຂດ້ວຍໂປຣແກຣມຕົບແຕ່ງພາບ)
4) ພື້ນຫຼັງ/gradient: ພື້ນຫຼັງບໍ່ຮຽບ, ມີຮອຍຕໍ່ (seam), ສີບໍ່ໄລ່ລຽນຢ່າງເປັນທຳມະຊາດ
5) ວັນທີ-ເວລາ: ອ່ານວັນທີ-ເວລາຈາກສະລິບ ແລ້ວປຽບທຽບກັບວັນທີປັດຈຸບັນທີ່ໃຫ້ໄວ້ (${todayStr}). ຖ້າວັນທີ່ໃນສະລິບເປັນອະນາຄົດ (ຫຼັງຈາກ ${todayStr}) ແມ່ນຜິດປົກກະຕິແນ່ນອນ. ຖ້າວັນທີເກົ່າຫຼາຍ (ຫຼາຍວັນ/ຫຼາຍເດືອນກ່ອນໜ້ານີ້) ໃຫ້ໝາຍໄວ້ວ່າອາດເປັນສະລິບເກົ່າທີ່ຖືກນຳມາໃຊ້ຊ້ຳ
6) ຮູບແບບໂຄງສ້າງໂດຍລວມ: ໄລຍະຫ່າງ, margin, ການຈັດວາງອົງປະກອບ (icon, ຫົວຂໍ້, ຕົວເລກ, QR/barcode) ຄືກັບສະລິບແທ້ຂອງທະນາຄານນັ້ນໆ ຫຼືບໍ່
7) ຄວາມສອດຄ່ອງຂອງຂໍ້ມູນ: ຊື່ທະນາຄານ, ໂລໂກ້, ຮູບແບບເລກອ້າງອີງ ຕ້ອງສອດຄ່ອງກັນ (ບໍ່ແມ່ນປົນຈາກທະນາຄານຄົນລະບ່ອນ)

ອ່ານຂໍ້ມູນຈາກສະລິບແລ້ວຕອບເປັນ JSON ຢ່າງດຽວ ຫ້າມມີຂໍ້ຄວາມອື່ນນອກ JSON, ຮູບແບບຄື:
{
  "is_slip": true ຫຼື false,
  "amount": ຕົວເລກຈຳນວນເງິນທີ່ອ່ານໄດ້ (ບໍ່ມີຈຸດ ຫຼື ຄອມມາ, null ຖ້າອ່ານບໍ່ໄດ້),
  "date_time": "ວັນທີ-ເວລາທີ່ອ່ານໄດ້ ຫຼື null",
  "reference": "ເລກອ້າງອີງ/ລະຫັດທຸລະກຳ ຫຼື null",
  "matches_expected": true ຫຼື false,
  "date_is_future_or_invalid": true ຫຼື false,
  "suspicious": true ຫຼື false,
  "suspicious_reasons": ["ລາຍການເຫດຜົນສັ້ນໆ ແຕ່ລະຂໍ້ ເປັນພາສາລາວ, ອ້າງອີງຈຸດ 1-7 ຂ້າງເທິງ, ຖ້າບໍ່ມີເຫດຜົນໃຫ້ສົງໄສ ໃຫ້ເປັນ array ຫວ່າງ []"],
  "confidence": "high" ຫຼື "medium" ຫຼື "low",
  "note": "ໝາຍເຫດສະຫຼຸບສັ້ນໆ ເປັນພາສາລາວ ອະທິບາຍວ່າເປັນຫຍັງຈຶ່ງຕັດສິນແບບນັ້ນ"
}

ວັນທີປັດຈຸບັນ (server date): ${todayStr}
ຍອດເງິນທີ່ຄາດໄວ້ຄື: ${expectedAmount} ກີບ. ໃຫ້ set matches_expected=true ຖ້າຈຳນວນເງິນທີ່ອ່ານໄດ້ຈາກສະລິບເທົ່າກັບ (ຫຼືໃກ້ຄຽງຫຼາຍ) ຍອດນີ້, ບໍ່ດັ່ງນັ້ນໃຫ້ set matches_expected=false.

ກົດເກນສຳຄັນ: ຖ້າມີຂໍ້ສົງໄສແມ່ນຫຍັງກໍ່ຕາມຈາກຂໍ້ 1-7 ຂ້າງເທິງ ຫຼືບໍ່ແນ່ໃຈ ໃຫ້ set suspicious=true ໄວ້ກ່ອນ (ຢ່າໃຫ້ suspicious=false ງ່າຍໆ, ຖືເອົາຄວາມປອດໄພຂອງຮ້ານເປັນຫຼັກ). ໃຫ້ set suspicious=true ຖ້າພາບເບິ່ງຄືຖືກຕັດຕໍ່, ໂລໂກ້ບິດເບືອນ, ຕົວອັກສອນຜິດປົກກະຕິ, ວັນທີ່ບໍ່ຕົງກັບປັດຈຸບັນ, ຍອດເງິນບໍ່ຕົງ, ຫຼືບໍ່ຄືສະລິບທະນາຄານແທ້.`;

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
