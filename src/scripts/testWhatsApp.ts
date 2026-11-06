/**
 * Script para probar el Webhook de n8n desde TypeScript
 * Uso: npx tsx src/scripts/testWhatsApp.ts <URL_DE_N8N> [TELEFONO]
 */

import "dotenv/config"

const urlWebhook = process.argv[2] || process.env.WHATSAPP_WEBHOOK_URL

if (!urlWebhook) {
    console.error("\n❌ ERROR: Falta la Test URL de n8n.")
    console.log("\nUso:")
    console.log('  npx tsx src/scripts/testWhatsApp.ts "TU_TEST_URL_DE_N8N"')
    console.log("O define WHATSAPP_WEBHOOK_URL en tu archivo .env\n")
    process.exit(1)
}

const url: string = urlWebhook
const telefono = process.argv[3] || "+573001234567"
const mensaje = `Hola! Tu servicio de Netflix en PhoenixMax vence en 3 días. Recuerda renovarlo a tiempo.`

async function probar() {
    console.log(`\nEnviando evento de prueba a n8n...`)
    console.log(`URL: ${url}`)
    console.log(`Payload:`, { telefono, mensaje })

    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telefono, mensaje })
        })

        const texto = await respuesta.text()
        console.log(`\nRespuesta de n8n: [HTTP ${respuesta.status}]`)
        console.log(texto || "(Sin cuerpo)")

        if (respuesta.ok) {
            console.log("\n✅ ÉXITO: n8n recibió el evento correctamente. Revisa tu canvas de n8n.")
        } else {
            console.log("\n⚠️ n8n respondió con error. Revisa que el nodo Webhook esté en 'Listen for test event'.")
        }
    } catch (error) {
        console.error("\n❌ No se pudo conectar con n8n:", error instanceof Error ? error.message : error)
    }
}

probar()
