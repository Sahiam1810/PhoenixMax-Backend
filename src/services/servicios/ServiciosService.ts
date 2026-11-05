import type { ServicioPublico } from "../../interfaces/Servicio.js"
import type { Servicio } from "../../models/Servicio.js"
import { ServiciosRepository } from "../../repositories/servicios/ServiciosRepository.js"
import { decrypt } from "../../utils/crypto.js"
import { diasRestantes, estadoServicio } from "../../utils/fechas.js"
import { HttpError } from "../../utils/httpError.js"
import { logger } from "../../utils/logger.js"

interface Credenciales {
    emailAcceso: string | null
    passwordAcceso: string | null
    nombrePerfil: string | null
    pin: string | null
}

const SIN_CREDENCIALES: Credenciales = {
    emailAcceso: null,
    passwordAcceso: null,
    nombrePerfil: null,
    pin: null
}

export class ServiciosService {
    constructor(private readonly repository: ServiciosRepository) {}

    async list(usuarioId: number): Promise<ServicioPublico[]> {
        const ahora = new Date()
        const servicios = await this.repository.findByUsuario(usuarioId)

        return servicios.map((servicio) => this.toPublico(servicio, ahora))
    }

    private toPublico(servicio: Servicio, ahora: Date): ServicioPublico {
        const producto = servicio.compraItem?.producto
        const plataforma = producto?.plataforma

        if (!producto || !plataforma) {
            throw new Error("El servicio no tiene el producto cargado")
        }

        const estado = estadoServicio(servicio.fechaVencimiento, ahora)
        const credenciales = estado === "vencido" ? SIN_CREDENCIALES : this.credenciales(servicio, producto.tipo)

        return {
            id: servicio.id,
            plataforma: {
                id: plataforma.id,
                nombre: plataforma.nombre,
                logoUrl: plataforma.logoUrl
            },
            tipo: producto.tipo,
            emailAcceso: credenciales.emailAcceso,
            passwordAcceso: credenciales.passwordAcceso,
            nombrePerfil: credenciales.nombrePerfil,
            pin: credenciales.pin,
            fechaInicio: servicio.fechaInicio.toISOString(),
            fechaVencimiento: servicio.fechaVencimiento.toISOString(),
            diasRestantes: diasRestantes(servicio.fechaVencimiento, ahora),
            estado
        }
    }

    private credenciales(servicio: Servicio, tipo: "cuenta" | "pantalla"): Credenciales {
        const cuenta = servicio.cuenta

        if (!cuenta) {
            throw new Error("El servicio no tiene la cuenta cargada")
        }

        const passwordAcceso = this.descifrar(servicio.id, cuenta.passwordAcceso)
        const pantalla = tipo === "pantalla" ? servicio.pantalla : undefined

        return {
            emailAcceso: cuenta.emailAcceso,
            passwordAcceso,
            nombrePerfil: pantalla?.nombrePerfil ?? null,
            pin: pantalla?.pin ?? null
        }
    }

    private descifrar(servicioId: number, valor: string): string {
        try {
            return decrypt(valor)
        } catch {
            logger.error("No se pudieron descifrar las credenciales del servicio", { servicioId })
            throw new HttpError("No se pudieron obtener las credenciales", 500)
        }
    }
}
