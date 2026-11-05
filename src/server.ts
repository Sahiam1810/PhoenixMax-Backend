import "reflect-metadata"
import cors from "cors"
import express from "express"
import morgan from "morgan"
import { config } from "./config/config.js"
import { sequelize } from "./config/database.js"
import { iniciarVencimientosJob } from "./jobs/vencimientosJob.js"
import { errorMiddleware } from "./middlewares/ErrorMiddleware.js"
import { notFoundMiddleware } from "./middlewares/NotFoundMiddleware.js"
import { apiRouter } from "./routes/index.js"
import { logger } from "./utils/logger.js"

const app = express()
app.use(cors({ origin: config.clientUrls, credentials: true }))
app.use(morgan("dev"))
app.use(express.json())
app.use("/api", apiRouter)
app.use(notFoundMiddleware)
app.use(errorMiddleware)

const iniciar = async (): Promise<void> => {
    await sequelize.authenticate()
    logger.info("Base de datos conectada")

    const vencimientosJob = iniciarVencimientosJob()

    const server = app.listen(config.port, () => {
        logger.info(`Servidor iniciado en puerto ${config.port}`)
    })

    let apagando = false

    const shutdown = async (): Promise<void> => {
        if (apagando) {
            return
        }

        apagando = true
        logger.info("Apagando servidor")
        await vencimientosJob.stop()
        logger.info("Job de vencimientos detenido")
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
}

iniciar().catch((error: unknown) => {
    logger.error("No se pudo iniciar el servidor", { error: error instanceof Error ? error.message : "Error desconocido" })
    process.exit(1)
})
