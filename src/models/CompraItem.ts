import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { Compra } from "./Compra.js"
import { Producto } from "./Producto.js"
import { Servicio } from "./Servicio.js"

export interface CompraItemAttributes {
    id: number
    compraId: number
    productoId: number
    cantidad: number
    precioUnitario: string
    subtotal: string
}

export type CompraItemCreationAttributes = Optional<CompraItemAttributes, "id">

@Table({ tableName: "compraItems", timestamps: true })
export class CompraItem extends Model<CompraItemAttributes, CompraItemCreationAttributes> implements CompraItemAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Compra) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare compraId: number
    @ForeignKey(() => Producto) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare productoId: number
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare cantidad: number
    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false }) declare precioUnitario: string
    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false }) declare subtotal: string
    @BelongsTo(() => Compra) declare compra?: Compra
    @BelongsTo(() => Producto) declare producto?: Producto
    @HasMany(() => Servicio) declare servicios?: Servicio[]
}
