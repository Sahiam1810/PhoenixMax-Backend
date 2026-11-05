import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { Producto } from "./Producto.js"
import { Usuario } from "./Usuario.js"

export interface CarritoItemAttributes {
    id: number
    usuarioId: number
    productoId: number
    cantidad: number
}

export type CarritoItemCreationAttributes = Optional<CarritoItemAttributes, "id" | "cantidad">

@Table({ tableName: "carritoItems", timestamps: true, indexes: [{ unique: true, fields: ["usuarioId", "productoId"] }] })
export class CarritoItem extends Model<CarritoItemAttributes, CarritoItemCreationAttributes> implements CarritoItemAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Usuario) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "CASCADE" }) declare usuarioId: number
    @ForeignKey(() => Producto) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "RESTRICT" }) declare productoId: number
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }) declare cantidad: number
    @BelongsTo(() => Usuario) declare usuario?: Usuario
    @BelongsTo(() => Producto) declare producto?: Producto
}
