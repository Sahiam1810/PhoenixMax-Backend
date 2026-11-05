import { Op, type Transaction } from "sequelize"
import { Cuenta } from "../../models/Cuenta.js"
import { Pantalla } from "../../models/Pantalla.js"
import { Servicio, type ServicioCreationAttributes } from "../../models/Servicio.js"

type EstadoCuenta = "disponible" | "parcial" | "vendida" | "inactiva"
type EstadoPantalla = "disponible" | "vendida"

export class AsignacionRepository {
    async lockCuentasByPlataforma(plataformaId: number, transaction: Transaction): Promise<Cuenta[]> {
        return Cuenta.findAll({
            where: { plataformaId },
            order: [["id", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        })
    }

    async lockPantallasByCuentas(cuentaIds: number[], transaction: Transaction): Promise<Pantalla[]> {
        return Pantalla.findAll({
            where: { cuentaId: { [Op.in]: cuentaIds } },
            order: [["cuentaId", "ASC"], ["id", "ASC"]],
            transaction,
            lock: transaction.LOCK.UPDATE
        })
    }

    async updateCuentasEstado(ids: number[], estado: EstadoCuenta, transaction: Transaction): Promise<void> {
        await Cuenta.update({ estado }, { where: { id: { [Op.in]: ids } }, transaction })
    }

    async updatePantallasEstadoByCuentas(cuentaIds: number[], estado: EstadoPantalla, transaction: Transaction): Promise<void> {
        await Pantalla.update({ estado }, { where: { cuentaId: { [Op.in]: cuentaIds } }, transaction })
    }

    async updatePantallasEstado(ids: number[], estado: EstadoPantalla, transaction: Transaction): Promise<void> {
        await Pantalla.update({ estado }, { where: { id: { [Op.in]: ids } }, transaction })
    }

    async bulkCreateServicios(servicios: ServicioCreationAttributes[], transaction: Transaction): Promise<Servicio[]> {
        return Servicio.bulkCreate(servicios, { transaction })
    }
}
