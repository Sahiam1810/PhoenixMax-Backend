import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { CompraItem } from "./CompraItem.js"
import { Usuario } from "./Usuario.js"

@Table({ tableName: "compras", timestamps: true })
export class Compra extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Usuario) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare usuarioId: number
    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false }) declare total: string
    @Column({ type: DataType.ENUM("pendiente", "pagada", "cancelada"), allowNull: false, defaultValue: "pendiente" }) declare estado: "pendiente" | "pagada" | "cancelada"
    @Column({ type: DataType.STRING(50), allowNull: true }) declare metodoPago: string | null
    @Column({ type: DataType.DATE, allowNull: true }) declare pagadaAt: Date | null
    @BelongsTo(() => Usuario) declare usuario?: Usuario
    @HasMany(() => CompraItem) declare compraItems?: CompraItem[]
}
