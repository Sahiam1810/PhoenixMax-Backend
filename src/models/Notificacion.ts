import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import type { TipoAlerta } from "../interfaces/Servicio.js"
import { Servicio } from "./Servicio.js"

export interface NotificacionAttributes {
    id: number
    servicioId: number
    tipo: TipoAlerta
    enviadaAt: Date
}

export type NotificacionCreationAttributes = Optional<NotificacionAttributes, "id">

@Table({ tableName: "notificaciones", timestamps: true, indexes: [{ unique: true, fields: ["servicioId", "tipo"] }] })
export class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> implements NotificacionAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Servicio) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare servicioId: number
    @Column({ type: DataType.ENUM("3_dias", "1_dia", "vencido"), allowNull: false }) declare tipo: TipoAlerta
    @Column({ type: DataType.DATE, allowNull: false }) declare enviadaAt: Date
    @BelongsTo(() => Servicio) declare servicio?: Servicio
}
