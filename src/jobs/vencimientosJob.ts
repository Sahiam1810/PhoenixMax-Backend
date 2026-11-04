import cron from "node-cron"
import { logger } from "../utils/logger.js"

export const vencimientosJob = cron.schedule("0 8 * * *", () => { logger.info("Job de vencimientos pendiente de implementación") }, { timezone: "America/Bogota" })
