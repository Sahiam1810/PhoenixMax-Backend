import cron, { type ScheduledTask } from "node-cron"
import { config } from "../config/config.js"
import { vencimientosService } from "../services/vencimientos/vencimientosServiceInstance.js"
import { HttpError } from "../utils/httpError.js"
import { logger } from "../utils/logger.js"

export const EXPRESION_VENCIMIENTOS = "0 8 * * *"

const ejecutarRevision = async (): Promise<void> => {
    try {
        await vencimientosService.ejecutar()
    } catch (error) {
        if (error instanceof HttpError) {
            logger.warn("Revisión de vencimientos omitida", { motivo: error.message })
            return
        }

        logger.error("Falló la revisión de vencimientos", { error: error instanceof Error ? error.name : "Error desconocido" })
    }
}

export const iniciarVencimientosJob = (): ScheduledTask => {
    const tarea = cron.schedule(EXPRESION_VENCIMIENTOS, ejecutarRevision, {
        name: "vencimientos",
        timezone: config.timezone
    })

    logger.info("Job de vencimientos programado", { expresion: EXPRESION_VENCIMIENTOS, timezone: config.timezone })

    return tarea
}
