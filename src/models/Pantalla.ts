import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { Cuenta } from "./Cuenta.js"
import { Servicio } from "./Servicio.js"

@Table({ tableName: "pantallas", timestamps: true })
export class Pantalla extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Cuenta) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare cuentaId: number
    @Column({ type: DataType.STRING(100), allowNull: false }) declare nombrePerfil: string
    @Column({ type: DataType.STRING(20), allowNull: true }) declare pin: string | null
    @Column({ type: DataType.ENUM("disponible", "vendida"), allowNull: false, defaultValue: "disponible" }) declare estado: "disponible" | "vendida"
    @BelongsTo(() => Cuenta) declare cuenta?: Cuenta
    @HasMany(() => Servicio) declare servicios?: Servicio[]
}
