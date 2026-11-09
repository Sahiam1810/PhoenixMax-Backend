import { UniqueConstraintError } from "sequelize"
import { config } from "../../config/config.js"
import type { TipoProducto } from "../../interfaces/Catalogo.js"
import type { ResultadoVencimientos, TipoAlerta } from "../../interfaces/Servicio.js"
import type { Servicio } from "../../models/Servicio.js"
import { VencimientosRepository } from "../../repositories/vencimientos/VencimientosRepository.js"
import { diferenciaDiasCalendario } from "../../utils/fechas.js"
import { HttpError } from "../../utils/httpError.js"
import { logger } from "../../utils/logger.js"
import type { EnviarCorreo } from "../../utils/mailer.js"
import { plantillaVencimiento } from "./plantillaVencimiento.js"

interface Alerta {
    servicioId: number
    tipo: TipoAlerta
    nombreCliente: string
    email: string
    telefono: string | null
    plataforma: string
    tipoServicio: TipoProducto
    fechaVencimiento: Date
}

type ResultadoEnvio = "enviado" | "omitido" | "fallido"

const ALERTAS_POR_DIFERENCIA = new Map<number, TipoAlerta>([
    [3, "3_dias"],
    [1, "1_dia"],
    [0, "vencido"]
])

const urlRenovar = (): string => {
    const base = config.clientUrls[0].replace(/\/+$/, "")

    return `${base}/mi-cuenta`
}

export class VencimientosService {
    private ejecutando = false

    constructor(
        private readonly repository: VencimientosRepository,
        private readonly enviarCorreo: EnviarCorreo
    ) {}

    async ejecutar(ahora: Date = new Date()): Promise<ResultadoVencimientos> {
        if (this.ejecutando) {
            throw new HttpError("Ya hay una revisión en curso", 409)
        }

        this.ejecutando = true

        try {
            const resultado = await this.revisar(ahora)
            logger.info("Revisión de vencimientos terminada", resultado)

            return resultado
        } finally {
            this.ejecutando = false
        }
    }

    private async revisar(ahora: Date): Promise<ResultadoVencimientos> {
        const servicios = await this.repository.findServiciosActivos()
        const alertas = servicios
            .map((servicio) => this.toAlerta(servicio, ahora))
            .filter((alerta): alerta is Alerta => alerta !== null)

        let notificacionesEnviadas = 0
        let errores = 0

        for (const alerta of alertas) {
            const envio = await this.notificar(alerta, ahora)

            if (envio === "enviado") {
                notificacionesEnviadas += 1
            }

            if (envio === "fallido") {
                errores += 1
            }
        }

        const serviciosVencidos = await this.repository.marcarVencidos(ahora)

        return {
            revisados: servicios.length,
            notificacionesEnviadas,
            serviciosVencidos,
            errores
        }
    }

    private toAlerta(servicio: Servicio, ahora: Date): Alerta | null {
        const diferencia = diferenciaDiasCalendario(servicio.fechaVencimiento, ahora, config.timezone)
        const tipo = ALERTAS_POR_DIFERENCIA.get(diferencia)

        if (!tipo) {
            return null
        }

        const usuario = servicio.usuario
        const producto = servicio.compraItem?.producto
        const plataforma = producto?.plataforma

        if (!usuario || !producto || !plataforma) {
            throw new Error("El servicio no tiene sus relaciones cargadas")
        }

        return {
            servicioId: servicio.id,
            tipo,
            nombreCliente: usuario.nombre,
            email: usuario.email,
            telefono: usuario.telefono ?? null,
            plataforma: plataforma.nombre,
            tipoServicio: producto.tipo,
            fechaVencimiento: servicio.fechaVencimiento
        }
    }

    private async notificar(alerta: Alerta, ahora: Date): Promise<ResultadoEnvio> {
        const notificacionId = await this.registrar(alerta, ahora)

        if (notificacionId === null) {
            return "omitido"
        }

        const correo = plantillaVencimiento({
            nombreCliente: alerta.nombreCliente,
            plataforma: alerta.plataforma,
            tipoServicio: alerta.tipoServicio,
            tipoAlerta: alerta.tipo,
            fechaVencimiento: alerta.fechaVencimiento,
            yaVencio: alerta.fechaVencimiento.getTime() <= ahora.getTime(),
            timeZone: config.timezone,
            urlRenovar: urlRenovar()
        })

        try {
            await this.enviarCorreo({
                to: alerta.email,
                subject: correo.subject,
                text: correo.text,
                html: correo.html
            })

            return "enviado"
        } catch (error) {
            await this.repository.deleteNotificacion(notificacionId)
            const errorMsg = error instanceof Error ? error.message : String(error)
            logger.error("No se pudo enviar la notificación de vencimiento", {
                servicioId: alerta.servicioId,
                tipo: alerta.tipo,
                error: errorMsg
            })

            return "fallido"
        }
    }

    private async registrar(alerta: Alerta, ahora: Date): Promise<number | null> {
        try {
            const notificacion = await this.repository.createNotificacion({
                servicioId: alerta.servicioId,
                tipo: alerta.tipo,
                enviadaAt: ahora
            })

            return notificacion.id
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                return null
            }

            throw error
        }
    }
}
