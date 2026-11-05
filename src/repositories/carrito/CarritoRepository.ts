import type { Transaction } from "sequelize"
import { CarritoItem } from "../../models/CarritoItem.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"
import { ProductosRepository } from "../productos/ProductosRepository.js"

interface CreateCarritoItemInput {
    usuarioId: number
    productoId: number
    cantidad: number
}

const productoInclude = {
    model: Producto,
    required: false,
    include: [{ model: Plataforma, required: false }]
}

export class CarritoRepository {
    constructor(private readonly productosRepository: ProductosRepository) {}

    async findByUsuario(usuarioId: number): Promise<CarritoItem[]> {
        return CarritoItem.findAll({
            where: { usuarioId },
            include: [productoInclude],
            order: [["id", "ASC"]]
        })
    }

    async findItem(itemId: number, usuarioId: number): Promise<CarritoItem | null> {
        return CarritoItem.findOne({ where: { id: itemId, usuarioId } })
    }

    async findItemByProducto(usuarioId: number, productoId: number, transaction?: Transaction): Promise<CarritoItem | null> {
        return CarritoItem.findOne({
            where: { usuarioId, productoId },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined
        })
    }

    async create(input: CreateCarritoItemInput, transaction?: Transaction): Promise<CarritoItem> {
        return CarritoItem.create(input, { transaction })
    }

    async updateCantidad(item: CarritoItem, cantidad: number, transaction?: Transaction): Promise<CarritoItem> {
        return item.update({ cantidad }, { transaction })
    }

    async deleteItem(item: CarritoItem): Promise<void> {
        await item.destroy()
    }

    async deleteByUsuario(usuarioId: number, transaction?: Transaction): Promise<number> {
        return CarritoItem.destroy({ where: { usuarioId }, transaction })
    }

    async findProductoActivo(productoId: number): Promise<Producto | null> {
        return this.productosRepository.findActivoById(productoId)
    }
}
