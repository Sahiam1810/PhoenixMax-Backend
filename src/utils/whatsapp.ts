import { logger } from "./logger.js"

export interface WhatsAppPayload {
    telefono: string
    mensaje: string
}

export function normalizarTelefono(tel: string): string {
    const limpio = tel.replace(/[\s\-\(\)]/g, "")
    if (/^3\d{9}$/.test(limpio)) {
        return `+57${limpio}`
    }
    if (/^573\d{9}$/.test(limpio)) {
        return `+${limpio}`
    }
    return limpio.startsWith("+") ? limpio : `+${limpio}`
}

export async function enviarWhatsAppWebhook(url: string, payload: WhatsAppPayload): Promise<boolean> {
    if (!url) {
        return false
    }

    const payloadFinal = {
        telefono: normalizarTelefono(payload.telefono),
        mensaje: payload.mensaje
    }

    const enviarPeticion = async (targetUrl: string): Promise<{ ok: boolean; status: number }> => {
        try {
            const respuesta = await fetch(targetUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payloadFinal)
            })
            return { ok: respuesta.ok, status: respuesta.status }
        } catch (error) {
            logger.error("Fallo al conectar con webhook de WhatsApp n8n", {
                error: error instanceof Error ? error.message : "Error desconocido"
            })
            return { ok: false, status: 0 }
        }
    }

    // 1. Intentar con la URL configurada
    let resultado = await enviarPeticion(url)

    // 2. Si dio 404 y es URL de producción (/webhook/), intentar con la de prueba (/webhook-test/)
    if (!resultado.ok && resultado.status === 404 && url.includes("/webhook/") && !url.includes("/webhook-test/")) {
        const testUrl = url.replace("/webhook/", "/webhook-test/")
        resultado = await enviarPeticion(testUrl)
    } else if (!resultado.ok && resultado.status === 404 && url.includes("/webhook-test/")) {
        const prodUrl = url.replace("/webhook-test/", "/webhook/")
        resultado = await enviarPeticion(prodUrl)
    }

    if (resultado.ok) {
        logger.info(`Alerta WhatsApp enviada a n8n para ${payloadFinal.telefono}`)
        return true
    }

    logger.error(`Error enviando a webhook n8n: status ${resultado.status}`)
    return false
}

