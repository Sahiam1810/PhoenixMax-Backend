import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Producto } from "./Producto.js"
import { Usuario } from "./Usuario.js"

@Table({ tableName: "carritoItems", timestamps: true, indexes: [{ unique: true, fields: ["usuarioId", "productoId"] }] })
export class CarritoItem extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Usuario) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare usuarioId: number
    @ForeignKey(() => Producto) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare productoId: number
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 }) declare cantidad: number
    @BelongsTo(() => Usuario) declare usuario?: Usuario
    @BelongsTo(() => Producto) declare producto?: Producto
}
