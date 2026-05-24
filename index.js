const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const express = require("express");
const qrcode = require("qrcode");
const pino = require("pino");
const { matchFlow } = require("./flows");

const app = express();
const PORT = process.env.PORT || 3000;

let qrImageUrl = null;
let botStatus = "esperando";
let sock = null;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 QR generado — abre la URL para escanearlo");
      botStatus = "esperando_qr";
      qrImageUrl = await qrcode.toDataURL(qr);
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Conexión cerrada. Reconectando:", shouldReconnect);
      botStatus = "desconectado";
      if (shouldReconnect) startBot();
    }

    if (connection === "open") {
      console.log("✅ Bot conectado a WhatsApp");
      botStatus = "conectado";
      qrImageUrl = null;
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;
      if (msg.key.remoteJid.includes("@g.us")) continue;

      const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!texto) continue;

      console.log(`💬 Mensaje: "${texto}"`);
      const flow = matchFlow(texto);

      if (flow) {
        console.log(`✅ Flujo: ${flow.name}`);
        await sock.sendMessage(msg.key.remoteJid, { text: flow.response });
      }
    }
  });
}

startBot();

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
  console.log(`🌐 Servidor en puerto ${PORT}`);
  console.log("⏳ Conectando a WhatsApp...");
});
