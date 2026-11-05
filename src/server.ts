import "reflect-metadata"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import { config } from "./config/config.js"
import { sequelize } from "./config/database.js"
import { errorMiddleware } from "./middlewares/ErrorMiddleware.js"
import { notFoundMiddleware } from "./middlewares/NotFoundMiddleware.js"
import { apiRouter } from "./routes/index.js"
import { logger } from "./utils/logger.js"
import { vencimientosJob } from "./jobs/vencimientosJob.js"

const app = express()
app.use(cors({ origin: config.clientUrls, credentials: true }))
app.use(morgan("dev"))
app.use(express.json())
app.use("/api", apiRouter)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

const server = app.listen(config.port, () => {
    logger.info(`Servidor iniciado en puerto ${config.port}`)
    vencimientosJob.start()
})

const shutdown = async (): Promise<void> => {
    vencimientosJob.stop()
    server.close()
    await sequelize.close()
    process.exit(0)
}

process.on("SIGINT", () => {
    void shutdown()
})

process.on("SIGTERM", () => {
    void shutdown()
})
