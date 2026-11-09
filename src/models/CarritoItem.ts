import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { Producto } from "./Producto.js"
import { Servicio } from "./Servicio.js"
import { Usuario } from "./Usuario.js"

export interface CarritoItemAttributes {
    id: number
    usuarioId: number
    productoId: number
    servicioId: number | null
    servicioIdIndice: number
    cantidad: number
}

export type CarritoItemCreationAttributes = Optional<CarritoItemAttributes, "id" | "cantidad" | "servicioId" | "servicioIdIndice">

@Table({ tableName: "carritoItems", timestamps: true, indexes: [{ unique: true, fields: ["usuarioId", "productoId", "servicioIdIndice"] }] })
export class CarritoItem extends Model<CarritoItemAttributes, CarritoItemCreationAttributes> implements CarritoItemAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Usuario) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "CASCADE" }) declare usuarioId: number
    @ForeignKey(() => Producto) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "RESTRICT" }) declare productoId: number
    @ForeignKey(() => Servicio) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true, onDelete: "CASCADE" }) declare servicioId: number | null
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }) declare servicioIdIndice: number
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }) declare cantidad: number
    @BelongsTo(() => Usuario) declare usuario?: Usuario
    @BelongsTo(() => Producto) declare producto?: Producto
    @BelongsTo(() => Servicio) declare servicio?: Servicio
}
