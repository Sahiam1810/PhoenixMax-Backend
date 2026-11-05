import { Transaction, UniqueConstraintError } from "sequelize"
import type { Sequelize } from "sequelize-typescript"
import type { CuentaPublica } from "../../../interfaces/Inventario.js"
import type { Cuenta } from "../../../models/Cuenta.js"
import { CuentasRepository } from "../../../repositories/admin/cuentas/CuentasRepository.js"
import { AsignacionRepository } from "../../../repositories/inventario/AsignacionRepository.js"
import { encrypt } from "../../../utils/crypto.js"
import { HttpError } from "../../../utils/httpError.js"
import { paginate, type PaginationResult } from "../../../utils/pagination.js"
import type { CreateCuentaInput, ListCuentasQuery, UpdateCuentaEstadoInput } from "../../../validators/admin/cuentas/CuentasValidators.js"
import { generarPantallas } from "./generarPantallas.js"

const MIN_PANTALLAS = 1
const MAX_PANTALLAS = 20

export class CuentasService {
    constructor(
        private readonly cuentasRepository: CuentasRepository,
        private readonly asignacionRepository: AsignacionRepository,
        private readonly sequelize: Sequelize
    ) {}

    async create(input: CreateCuentaInput): Promise<CuentaPublica> {
        const plataforma = await this.cuentasRepository.findPlataformaById(input.plataformaId)

        if (!plataforma) {
            throw new HttpError("Plataforma no encontrada", 404)
        }

        if (!plataforma.activo) {
            throw new HttpError("La plataforma está inactiva", 400)
        }

        const maxPantallas = plataforma.maxPantallas

        if (!Number.isInteger(maxPantallas) || maxPantallas < MIN_PANTALLAS || maxPantallas > MAX_PANTALLAS) {
            throw new HttpError("La plataforma tiene una configuración de pantallas inválida", 400)
        }

        const passwordCifrada = encrypt(input.passwordAcceso)

        try {
            const cuenta = await this.sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (transaction) => {
                const creada = await this.cuentasRepository.createCuenta({
                    plataformaId: plataforma.id,
                    emailAcceso: input.emailAcceso,
                    passwordAcceso: passwordCifrada,
                    estado: "disponible"
                }, transaction)
                const pantallas = generarPantallas(creada.id, maxPantallas)

                await this.cuentasRepository.bulkCreatePantallas(pantallas, transaction)

                return this.cuentasRepository.findCuentaConPantallas(creada.id, transaction)
            })

            if (!cuenta) {
                throw new Error("La cuenta creada no se encontró")
            }

            return this.toCuentaPublica(cuenta)
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new HttpError("Ya existe una cuenta para esta plataforma con ese correo", 409)
            }

            throw error
        }
    }

    async list(query: ListCuentasQuery): Promise<PaginationResult<CuentaPublica>> {
        const offset = (query.page - 1) * query.limit
        const { rows, count } = await this.cuentasRepository.findAndCountCuentas({
            limit: query.limit,
            offset,
            plataforma: query.plataforma,
            estado: query.estado
        })
        const data = rows.map((cuenta) => this.toCuentaPublica(cuenta))

        return paginate(data, query.page, query.limit, count)
    }

    async cambiarEstado(id: number, input: UpdateCuentaEstadoInput): Promise<CuentaPublica> {
        const cuenta = await this.sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED }, async (transaction) => {
            const cuentaBloqueada = await this.cuentasRepository.findCuentaForUpdate(id, transaction)

            if (!cuentaBloqueada) {
                throw new HttpError("Cuenta no encontrada", 404)
            }

            const pantallas = await this.asignacionRepository.lockPantallasByCuentas([cuentaBloqueada.id], transaction)

            if (input.estado === "inactiva") {
                if (cuentaBloqueada.estado === "vendida") {
                    throw new HttpError("No se puede desactivar una cuenta vendida completa", 409)
                }

                if (cuentaBloqueada.estado !== "inactiva") {
                    await this.cuentasRepository.updateCuentaEstado(cuentaBloqueada, "inactiva", transaction)
                }
            }

            if (input.estado === "activa" && cuentaBloqueada.estado === "inactiva") {
                const tienePantallaVendida = pantallas.some((pantalla) => pantalla.estado === "vendida")
                const estado = tienePantallaVendida ? "parcial" : "disponible"

                await this.cuentasRepository.updateCuentaEstado(cuentaBloqueada, estado, transaction)
            }

            return this.cuentasRepository.findCuentaConPantallas(cuentaBloqueada.id, transaction)
        })

        if (!cuenta) {
            throw new Error("La cuenta actualizada no se encontrÃ³")
        }

        return this.toCuentaPublica(cuenta)
    }

    private toCuentaPublica(cuenta: Cuenta): CuentaPublica {
        if (!cuenta.plataforma) {
            throw new Error("La cuenta no tiene la plataforma cargada")
        }

        const pantallas = cuenta.pantallas ?? []
        const pantallasDisponibles = pantallas.filter((pantalla) => pantalla.estado === "disponible").length
        const pantallasVendidas = pantallas.filter((pantalla) => pantalla.estado === "vendida").length

        return {
            id: cuenta.id,
            createdAt: cuenta.createdAt.toISOString(),
            plataformaId: cuenta.plataformaId,
            plataforma: {
                id: cuenta.plataforma.id,
                nombre: cuenta.plataforma.nombre
            },
            emailAcceso: cuenta.emailAcceso,
            estado: cuenta.estado,
            pantallasTotal: pantallas.length,
            pantallasDisponibles,
            pantallasVendidas,
            pantallas: pantallas.map((pantalla) => ({
                id: pantalla.id,
                nombrePerfil: pantalla.nombrePerfil,
                estado: pantalla.estado
            }))
        }
    }
}
