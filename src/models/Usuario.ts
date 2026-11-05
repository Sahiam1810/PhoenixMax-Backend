import type { Optional } from "sequelize"
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript"
import { CarritoItem } from "./CarritoItem.js"
import { Compra } from "./Compra.js"

export interface UsuarioAttributes {
    id: number
    nombre: string
    email: string
    passwordHash: string
    telefono: string | null
    rol: "cliente" | "admin"
}

export type UsuarioCreationAttributes = Optional<Omit<UsuarioAttributes, "rol">, "id" | "telefono"> & {
    rol?: UsuarioAttributes["rol"] | string
}

@Table({ tableName: "usuarios", timestamps: true })
export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @Column({ type: DataType.STRING(120), allowNull: false }) declare nombre: string
    @Column({ type: DataType.STRING(160), allowNull: false, unique: true }) declare email: string
    @Column({ type: DataType.STRING(255), allowNull: false }) declare passwordHash: string
    @Column({ type: DataType.STRING(30), allowNull: true }) declare telefono: string | null
    @Column({ type: DataType.ENUM("cliente", "admin"), allowNull: false, defaultValue: "cliente" }) declare rol: "cliente" | "admin"
    @HasMany(() => CarritoItem) declare carritoItems?: CarritoItem[]
    @HasMany(() => Compra) declare compras?: Compra[]
}
