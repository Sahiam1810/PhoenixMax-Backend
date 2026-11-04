import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript"
import { CarritoItem } from "./CarritoItem.js"
import { CompraItem } from "./CompraItem.js"
import { Plataforma } from "./Plataforma.js"

@Table({ tableName: "productos", timestamps: true })
export class Producto extends Model {
    @Column({ type: DataType.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }) declare id: number
    @ForeignKey(() => Plataforma) @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare plataformaId: number
    @Column({ type: DataType.ENUM("cuenta", "pantalla"), allowNull: false }) declare tipo: "cuenta" | "pantalla"
    @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false }) declare duracionDias: number
    @Column({ type: DataType.DECIMAL(14, 2), allowNull: false }) declare precio: string
    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true }) declare activo: boolean
    @BelongsTo(() => Plataforma) declare plataforma?: Plataforma
    @HasMany(() => CarritoItem) declare carritoItems?: CarritoItem[]
    @HasMany(() => CompraItem) declare compraItems?: CompraItem[]
}
