// ============================================================
//  TUS FLUJOS — edita aquí tus palabras clave y respuestas
// ============================================================

const flows = [
  {
    name: "Odonto",
    enabled: true,
    keywords: ["odontología", "odontologia", "odonto", "ODONTOLOGÍA", "ODONTOLOGIA"],
    response: "¡Hola! 😊 Tenemos material completo de Odontología. ¿Te interesa algún tema específico o quieres ver el catálogo completo?"
  },
  {
    name: "FISICO",
    enabled: true,
    keywords: ["fisico", "físico", "entrega", "entregas", "ubicacion", "ubicación", "dirección", "direccion", "ubicados"],
    response: "📍 Estamos ubicados en la zona central. Realizamos entregas y también atención presencial. ¿Cómo prefieres recibir tu pedido?"
  },
  {
    name: "BIOQUIMICA",
    enabled: true,
    keywords: ["bioquímica", "bioquimica", "ilustrados"],
    response: "🧬 ¡Tenemos material completo de Bioquímica, incluyendo apuntes ilustrados y resúmenes! ¿Qué tema o unidad necesitas?"
  },
  {
    name: "MicrioBiologia",
    enabled: true,
    keywords: ["microbiología", "microbiologia", "micriobiología", "micriobiologia", "mapas mentales", "mapas"],
    response: "🦠 Para Microbiología tenemos mapas mentales, resúmenes y material completo. ¡Es uno de los más populares! ¿Qué unidad buscas?"
  },
  {
    name: "INFORMACIÓN",
    enabled: true,
    keywords: ["información", "informacion", "info", "anatomía", "anatomia"],
    response: "ℹ️ Con gusto te informamos. Tenemos material para: Bioquímica, Microbiología, Odontología, Anatomía y más. ¿Sobre qué materia necesitas info?"
  },
  {
    name: "QR",
    enabled: true,
    keywords: ["qr", "cuere", "q.r"],
    response: "📲 Aquí tienes el código QR para acceder a nuestros materiales. Si no carga, escríbenos y te lo reenviamos de inmediato."
  },
  {
    name: "YAPE",
    enabled: true,
    keywords: ["yape", "YAPE"],
    response: "💳 Aceptamos pagos por Yape. Realiza tu pago y envíanos el comprobante para activar tu acceso de inmediato."
  }
];

// Busca el flujo que coincide con el mensaje recibido
function matchFlow(text) {
  const lower = text.toLowerCase().trim();
  for (const flow of flows) {
    if (!flow.enabled) continue;
    for (const kw of flow.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return flow;
      }
    }
  }
  return null;
}

module.exports = { flows, matchFlow };
