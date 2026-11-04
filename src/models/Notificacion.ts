import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import { Servicio } from "./Servicio.js"

@Table({ tableName: "notificaciones", timestamps: true, indexes: [{ unique: true, fields: ["servicioId", "tipo"] }] })
export class Notificacion extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Servicio) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare servicioId: number
    @Column({ type: DataType.ENUM("3_dias", "1_dia", "vencido"), allowNull: false }) declare tipo: "3_dias" | "1_dia" | "vencido"
    @Column({ type: DataType.DATE, allowNull: false }) declare enviadaAt: Date
    @BelongsTo(() => Servicio) declare servicio?: Servicio
}
