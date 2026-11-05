import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { Cuenta } from "./Cuenta.js"
import { Servicio } from "./Servicio.js"

export interface PantallaAttributes {
    id: number
    cuentaId: number
    nombrePerfil: string
    pin: string | null
    estado: "disponible" | "vendida"
}

export type PantallaCreationAttributes = Optional<PantallaAttributes, "id" | "pin" | "estado">

@Table({ tableName: "pantallas", timestamps: true })
export class Pantalla extends Model<PantallaAttributes, PantallaCreationAttributes> implements PantallaAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Cuenta) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "RESTRICT" }) declare cuentaId: number
    @Column({ type: DataType.STRING(100), allowNull: false }) declare nombrePerfil: string
    @Column({ type: DataType.STRING(20), allowNull: true }) declare pin: string | null
    @Column({ type: DataType.ENUM("disponible", "vendida"), allowNull: false, defaultValue: "disponible" }) declare estado: "disponible" | "vendida"
    @BelongsTo(() => Cuenta) declare cuenta?: Cuenta
    @HasMany(() => Servicio) declare servicios?: Servicio[]
}
