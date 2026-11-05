import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import type { Optional } from "sequelize"
import { CompraItem } from "./CompraItem.js"
import { Cuenta } from "./Cuenta.js"
import { Notificacion } from "./Notificacion.js"
import { Pantalla } from "./Pantalla.js"
import { Usuario } from "./Usuario.js"

export interface ServicioAttributes {
    id: number
    compraItemId: number
    usuarioId: number
    cuentaId: number
    pantallaId: number | null
    fechaInicio: Date
    fechaVencimiento: Date
    estado: "activo" | "vencido"
}

export type ServicioCreationAttributes = Optional<ServicioAttributes, "id" | "pantallaId" | "estado">

@Table({ tableName: "servicios", timestamps: true })
export class Servicio extends Model<ServicioAttributes, ServicioCreationAttributes> implements ServicioAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => CompraItem) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare compraItemId: number
    @ForeignKey(() => Usuario) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare usuarioId: number
    @ForeignKey(() => Cuenta) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare cuentaId: number
    @ForeignKey(() => Pantalla) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true }) declare pantallaId: number | null
    @Column({ type: DataType.DATE, allowNull: false }) declare fechaInicio: Date
    @Column({ type: DataType.DATE, allowNull: false }) declare fechaVencimiento: Date
    @Column({ type: DataType.ENUM("activo", "vencido"), allowNull: false, defaultValue: "activo" }) declare estado: "activo" | "vencido"
    @BelongsTo(() => CompraItem) declare compraItem?: CompraItem
    @BelongsTo(() => Usuario) declare usuario?: Usuario
    @BelongsTo(() => Cuenta) declare cuenta?: Cuenta
    @BelongsTo(() => Pantalla) declare pantalla?: Pantalla
    @HasMany(() => Notificacion) declare notificaciones?: Notificacion[]
}
