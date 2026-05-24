const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode");
const { matchFlow } = require("./flows");

const app = express();
const PORT = process.env.PORT || 3000;

let qrImageUrl = null;
let botStatus = "esperando";

// ──────────────────────────────────────────
//  Cliente de WhatsApp
// ──────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  }
});

// Genera el QR y lo guarda como imagen
client.on("qr", async (qr) => {
  console.log("📱 QR generado — abre http://localhost:" + PORT + " para escanearlo");
  botStatus = "esperando_qr";
  qrImageUrl = await qrcode.toDataURL(qr);
});

// Bot listo y conectado
client.on("ready", () => {
  console.log("✅ Bot conectado a WhatsApp");
  botStatus = "conectado";
  qrImageUrl = null;
});

// Desconectado
client.on("disconnected", (reason) => {
  console.log("❌ Bot desconectado:", reason);
  botStatus = "desconectado";
});

// ──────────────────────────────────────────
//  Lógica del bot — responde a mensajes
// ──────────────────────────────────────────
client.on("message", async (msg) => {
  // Ignorar mensajes de grupos (quitar el ! si quieres que responda en grupos también)
  if (msg.from.includes("@g.us")) return;

  const texto = msg.body;
  console.log(`💬 Mensaje de ${msg.from}: "${texto}"`);

  const flow = matchFlow(texto);

  if (flow) {
    console.log(`✅ Flujo disparado: ${flow.name}`);
    await msg.reply(flow.response);
  } else {
    // Sin coincidencia — descomenta si quieres respuesta por defecto:
    // await msg.reply("Hola 👋 Escríbenos sobre qué materia necesitas y te ayudamos.");
    console.log("⚠️ Sin flujo para:", texto);
  }
});

client.initialize();

// ──────────────────────────────────────────
//  Página web para escanear el QR
// ──────────────────────────────────────────
app.get("/", (req, res) => {
  if (botStatus === "conectado") {
    return res.send(`
      <html><head><meta charset="utf-8">
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
      h2{color:#16a34a;} p{color:#555;}</style></head>
      <body>
        <h2>✅ Bot conectado y funcionando</h2>
        <p>Tu bot de WhatsApp está activo y respondiendo mensajes.</p>
      </body></html>
    `);
  }

  if (qrImageUrl) {
    return res.send(`
      <html><head><meta charset="utf-8">
      <meta http-equiv="refresh" content="30">
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#fff;}
      h2{color:#333;margin-bottom:8px;} p{color:#666;margin-bottom:20px;font-size:14px;}
      img{border:2px solid #eee;border-radius:12px;padding:12px;}</style></head>
      <body>
        <h2>📱 Escanea el QR con tu WhatsApp</h2>
        <p>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
        <img src="${qrImageUrl}" width="280" />
        <p style="margin-top:16px;font-size:12px;color:#999;">La página se actualiza automáticamente cada 30 segundos</p>
      </body></html>
    `);
  }

  return res.send(`
    <html><head><meta charset="utf-8"><meta http-equiv="refresh" content="5">
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style></head>
    <body><p>⏳ Iniciando bot, espera unos segundos...</p></body></html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Abre en tu navegador: http://localhost:${PORT}`);
  console.log("⏳ Generando QR de WhatsApp...");
});
