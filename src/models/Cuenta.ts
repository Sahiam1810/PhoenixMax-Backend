import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { Plataforma } from "./Plataforma.js"
import { Pantalla } from "./Pantalla.js"

export interface CuentaAttributes {
    id: number
    plataformaId: number
    emailAcceso: string
    passwordAcceso: string
    estado: "disponible" | "parcial" | "vendida" | "inactiva"
}

export type CuentaCreationAttributes = Optional<CuentaAttributes, "id" | "estado">

@Table({ tableName: "cuentas", timestamps: true })
export class Cuenta extends Model<CuentaAttributes, CuentaCreationAttributes> implements CuentaAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Plataforma) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "RESTRICT" }) declare plataformaId: number
    @Column({ type: DataType.STRING(160), allowNull: false }) declare emailAcceso: string
    @Column({ type: DataType.TEXT, allowNull: false }) declare passwordAcceso: string
    @Column({ type: DataType.ENUM("disponible", "parcial", "vendida", "inactiva"), allowNull: false, defaultValue: "disponible" }) declare estado: "disponible" | "parcial" | "vendida" | "inactiva"
    declare createdAt: Date
    @BelongsTo(() => Plataforma) declare plataforma?: Plataforma
    @HasMany(() => Pantalla) declare pantallas?: Pantalla[]
}
