import type { Transaction } from "sequelize"
import { CarritoItem } from "../../models/CarritoItem.js"
import { Plataforma } from "../../models/Plataforma.js"
import { Producto } from "../../models/Producto.js"
import { Servicio } from "../../models/Servicio.js"
import { CompraItem } from "../../models/CompraItem.js"
import { Compra } from "../../models/Compra.js"
import { Cuenta } from "../../models/Cuenta.js"
import { Pantalla } from "../../models/Pantalla.js"
import { ProductosRepository } from "../productos/ProductosRepository.js"

interface CreateCarritoItemInput {
    usuarioId: number
    productoId: number
    cantidad: number
    servicioId?: number | null
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
            include: [productoInclude, { model: Servicio, required: false, include: [{ model: Cuenta, required: false }, { model: Pantalla, required: false }] }],
            order: [["id", "ASC"]]
        })
    }

    async findItem(itemId: number, usuarioId: number): Promise<CarritoItem | null> {
        return CarritoItem.findOne({ where: { id: itemId, usuarioId } })
    }

    async findItemByProducto(usuarioId: number, productoId: number, servicioId: number | null, transaction?: Transaction): Promise<CarritoItem | null> {
        return CarritoItem.findOne({
            where: { usuarioId, productoId, servicioId },
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

    async findServicioRenovable(servicioId: number, usuarioId: number): Promise<Servicio | null> {
        return Servicio.findOne({
            where: { id: servicioId, usuarioId },
            include: [{ model: CompraItem, required: true, include: [{ model: Compra, required: true, where: { estado: "pagada" } }, { model: Producto, required: true }] }]
        })
    }
}
