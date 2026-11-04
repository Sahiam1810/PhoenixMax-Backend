import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { Compra } from "./Compra.js"
import { Producto } from "./Producto.js"
import { Servicio } from "./Servicio.js"

@Table({ tableName: "compraItems", timestamps: true })
export class CompraItem extends Model {
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
