import type { Transaction } from "sequelize"
import { Cuenta } from "../../../models/Cuenta.js"
import { Pantalla } from "../../../models/Pantalla.js"
import { Plataforma } from "../../../models/Plataforma.js"
import type { PantallaGenerada } from "../../../interfaces/Inventario.js"

interface CreateCuentaData {
    plataformaId: number
    emailAcceso: string
    passwordAcceso: string
    estado: "disponible"
}

interface FindCuentasInput {
    limit: number
    offset: number
    plataforma?: number
    estado?: "disponible" | "parcial" | "vendida" | "inactiva"
}

type CuentaWhere = {
    plataformaId?: number
    estado?: "disponible" | "parcial" | "vendida" | "inactiva"
}

const plataformaInclude = {
    model: Plataforma,
    attributes: ["id", "nombre"]
}

const pantallasInclude = {
    model: Pantalla,
    attributes: ["id", "nombrePerfil", "estado"],
    separate: true,
    order: [["id", "ASC"]] as [string, string][]
}

export class CuentasRepository {
    async findPlataformaById(id: number): Promise<Plataforma | null> {
        return Plataforma.findByPk(id)
    }

    async createCuenta(data: CreateCuentaData, transaction: Transaction): Promise<Cuenta> {
        return Cuenta.create(data, { transaction })
    }

    async bulkCreatePantallas(pantallas: PantallaGenerada[], transaction: Transaction): Promise<Pantalla[]> {
        return Pantalla.bulkCreate(pantallas, { transaction })
    }

    async findCuentaConPantallas(id: number, transaction?: Transaction): Promise<Cuenta | null> {
        return Cuenta.findByPk(id, {
            include: [plataformaInclude, pantallasInclude],
            transaction
        })
    }

    async findCuentaForUpdate(id: number, transaction: Transaction): Promise<Cuenta | null> {
        return Cuenta.findByPk(id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        })
    }

    async updateCuentaEstado(cuenta: Cuenta, estado: "disponible" | "parcial" | "vendida" | "inactiva", transaction: Transaction): Promise<void> {
        await cuenta.update({ estado }, { transaction })
    }

    async findAndCountCuentas(input: FindCuentasInput): Promise<{ rows: Cuenta[], count: number }> {
        const where: CuentaWhere = {}

        if (input.plataforma !== undefined) {
            where.plataformaId = input.plataforma
        }

        if (input.estado !== undefined) {
            where.estado = input.estado
        }

        return Cuenta.findAndCountAll({
            where,
            include: [plataformaInclude, pantallasInclude],
            order: [["createdAt", "DESC"], ["id", "DESC"]],
            limit: input.limit,
            offset: input.offset,
            distinct: true
        })
    }
}
