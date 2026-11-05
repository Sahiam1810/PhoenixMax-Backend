import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript"
import { Cuenta } from "./Cuenta.js"
import { Producto } from "./Producto.js"

@Table({ tableName: "plataformas", timestamps: true })
export class Plataforma extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number

    @Column({ type: DataType.STRING(120), allowNull: false, unique: true }) declare nombre: string

    @Column({ type: DataType.TEXT, allowNull: true }) declare descripcion: string | null

    @Column({ type: DataType.STRING(500), allowNull: true }) declare logoUrl: string | null

    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare maxPantallas: number

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true }) declare activo: boolean
    
    @HasMany(() => Producto) declare productos?: Producto[]
    @HasMany(() => Cuenta) declare cuentas?: Cuenta[]
}
