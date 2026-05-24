const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");
const { execSync } = require("child_process");
const { matchFlow } = require("./flows");

const app = express();
const PORT = process.env.PORT || 3000;

let qrImageUrl = null;
let botStatus = "esperando";

function findChrome() {
  try {
    const result = execSync(
      'find /opt/render/.cache/puppeteer -name "chrome" -type f 2>/dev/null | head -1'
    ).toString().trim();
    if (result) { console.log("✅ Chrome encontrado en:", result); return result; }
  } catch (e) {}
  try {
    const result = execSync('which google-chrome-stable 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null').toString().trim();
    if (result) { console.log("✅ Chrome del sistema:", result); return result; }
  } catch (e) {}
  console.log("⚠️ Usando Chrome por defecto de Puppeteer");
  return undefined;
}

const chromePath = findChrome();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: chromePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process"
    ]
  }
});

client.on("qr", async (qr) => {
  console.log("📱 QR generado — abre la URL del servicio para escanearlo");
  botStatus = "esperando_qr";
  qrImageUrl = await qrcode.toDataURL(qr);
});

client.on("ready", () => {
  console.log("✅ Bot conectado a WhatsApp correctamente");
  botStatus = "conectado";
  qrImageUrl = null;
});

client.on("disconnected", (reason) => {
  console.log("❌ Bot desconectado:", reason);
  botStatus = "desconectado";
});

client.on("message", async (msg) => {
  if (msg.from.includes("@g.us")) return;
  const texto = msg.body;
  console.log(`💬 Mensaje de ${msg.from}: "${texto}"`);
  const flow = matchFlow(texto);
  if (flow) {
    console.log(`✅ Flujo disparado: ${flow.name}`);
    await msg.reply(flow.response);
  } else {
    console.log("⚠️ Sin flujo para:", texto);
  }
});

client.initialize();

app.get("/", (req, res) => {
  if (botStatus === "conectado") {
    return res.send(`<html><head><meta charset="utf-8"><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}</style></head><body><h2 style="color:#16a34a">✅ Bot conectado y funcionando</h2><p style="color:#555">Tu bot de WhatsApp está activo y respondiendo mensajes.</p></body></html>`);
  }
  if (qrImageUrl) {
    return res.send(`<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="30"><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head><body><h2>📱 Escanea el QR con tu WhatsApp</h2><p>WhatsApp → Dispositivos vinculados → Vincular dispositivo</p><img src="${qrImageUrl}" width="280" style="border:2px solid #eee;border-radius:12px;padding:12px;"/><p style="font-size:12px;color:#999;margin-top:16px">Se actualiza cada 30 segundos</p></body></html>`);
  }
  return res.send(`<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="5"></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;"><p>⏳ Iniciando bot, espera unos segundos...</p></body></html>`);
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor activo en puerto ${PORT}`);
  console.log("⏳ Generando QR de WhatsApp...");
});
