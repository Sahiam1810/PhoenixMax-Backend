import type { Transaction } from "sequelize"
import { Compra, type CompraCreationAttributes } from "../../models/Compra.js"
import { CompraItem, type CompraItemCreationAttributes } from "../../models/CompraItem.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"

interface FindComprasInput {
    usuarioId: number
    limit: number
    offset: number
}

interface PagoData {
    metodoPago: string
    pagadaAt: Date
}

const productoConPlataformaInclude = {
    model: Producto,
    include: [{ model: Plataforma }]
}

export class ComprasRepository {
    async createCompra(data: CompraCreationAttributes, transaction: Transaction): Promise<Compra> {
        return Compra.create(data, { transaction })
    }

    async bulkCreateItems(items: CompraItemCreationAttributes[], transaction: Transaction): Promise<CompraItem[]> {
        return CompraItem.bulkCreate(items, { transaction })
    }

    async cancelPendientesByUsuario(usuarioId: number, transaction: Transaction): Promise<number> {
        const [actualizadas] = await Compra.update(
            { estado: "cancelada" },
            { where: { usuarioId, estado: "pendiente" }, transaction }
        )

        return actualizadas
    }

    async findCompraParaPago(id: number, usuarioId: number, transaction: Transaction): Promise<Compra | null> {
        return Compra.findOne({
            where: { id, usuarioId },
            transaction,
            lock: transaction.LOCK.UPDATE
        })
    }

    async findItemsConProducto(compraId: number, transaction: Transaction): Promise<CompraItem[]> {
        return CompraItem.findAll({
            where: { compraId },
            include: [productoConPlataformaInclude],
            order: [["id", "ASC"]],
            transaction
        })
    }

    async updateCompraPagada(compra: Compra, data: PagoData, transaction: Transaction): Promise<Compra> {
        return compra.update({
            estado: "pagada",
            metodoPago: data.metodoPago,
            pagadaAt: data.pagadaAt
        }, { transaction })
    }

    async findCompraDetalle(id: number, usuarioId: number): Promise<Compra | null> {
        return Compra.findOne({
            where: { id, usuarioId },
            include: [{
                model: CompraItem,
                include: [productoConPlataformaInclude]
            }],
            order: [[{ model: CompraItem, as: "compraItems" }, "id", "ASC"]]
        })
    }

    async findAndCountCompras(input: FindComprasInput): Promise<{ rows: Compra[], count: number }> {
        return Compra.findAndCountAll({
            where: { usuarioId: input.usuarioId },
            include: [{
                model: CompraItem,
                include: [productoConPlataformaInclude],
                separate: true,
                order: [["id", "ASC"]]
            }],
            order: [["createdAt", "DESC"], ["id", "DESC"]],
            limit: input.limit,
            offset: input.offset,
            distinct: true
        })
    }
}
