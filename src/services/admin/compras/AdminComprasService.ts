import { Op } from "sequelize"
import { Compra } from "../../../models/Compra.js"
import { CompraItem } from "../../../models/CompraItem.js"
import { Plataforma } from "../../../models/Plataforma.js"
import { Producto } from "../../../models/Producto.js"
import { Usuario } from "../../../models/Usuario.js"

export class AdminComprasService {
    async list(query?: { estado?: string, desde?: string, hasta?: string }) {
        const where: Record<string, unknown> = {}
        if (query?.estado) {
            where.estado = query.estado
        }
        if (query?.desde || query?.hasta) {
            const fechaWhere: Record<symbol, unknown> = {}
            if (query.desde) {
                fechaWhere[Op.gte] = new Date(`${query.desde}T00:00:00.000Z`)
            }
            if (query.hasta) {
                fechaWhere[Op.lte] = new Date(`${query.hasta}T23:59:59.999Z`)
            }
            where.createdAt = fechaWhere
        }

        const compras = await Compra.findAll({
            where,
            include: [
                {
                    model: Usuario,
                    attributes: ["id", "nombre", "email"]
                },
                {
                    model: CompraItem,
                    include: [
                        {
                            model: Producto,
                            include: [{ model: Plataforma }]
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"], ["id", "DESC"]]
        })

        return compras.map((c) => ({
            id: c.id,
            usuarioId: c.usuarioId,
            usuario: c.usuario ? {
                id: c.usuario.id,
                nombre: c.usuario.nombre,
                email: c.usuario.email
            } : undefined,
            total: Number(c.total),
            estado: c.estado,
            metodoPago: c.metodoPago,
            pagadaAt: c.pagadaAt ? c.pagadaAt.toISOString() : null,
            createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
            items: (c.compraItems ?? []).map((item) => ({
                id: item.id,
                productoId: item.productoId,
                cantidad: item.cantidad,
                precioUnitario: Number(item.precioUnitario),
                subtotal: Number(item.subtotal),
                producto: item.producto ? {
                    tipo: item.producto.tipo,
                    duracionDias: item.producto.duracionDias,
                    plataforma: item.producto.plataforma ? {
                        id: item.producto.plataforma.id,
                        nombre: item.producto.plataforma.nombre,
                        logoUrl: item.producto.plataforma.logoUrl
                    } : undefined
                } : undefined
            }))
        }))
    }
}
