import { logger } from "./logger.js"

export interface WhatsAppPayload {
    telefono: string
    mensaje: string
}

export async function enviarWhatsAppWebhook(url: string, payload: WhatsAppPayload): Promise<boolean> {
    if (!url) {
        return false
    }

    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (!respuesta.ok) {
            logger.error(`Error enviando a webhook n8n: status ${respuesta.status}`)
            return false
        }

        logger.info(`Alerta WhatsApp enviada a n8n para ${payload.telefono}`)
        return true
    } catch (error) {
        logger.error("Fallo al conectar con webhook de WhatsApp n8n", {
            error: error instanceof Error ? error.message : "Error desconocido"
        })
        return false
    }
}

