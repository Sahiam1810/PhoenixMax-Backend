import "reflect-metadata"
import { sequelize } from "../config/database.js"
import { Compra } from "../models/Compra.js"
import { Servicio } from "../models/Servicio.js"

const run = async () => {
    await sequelize.authenticate()
    const compras = await Compra.findAll({ where: { id: [52, 53] }, attributes: ["id", "usuarioId", "estado", "metodoPago", "pagadaAt"] })
    console.log("Compras:", JSON.stringify(compras.map((c) => c.toJSON()), null, 2))
    const servicios = await Servicio.findAll({ where: { pantallaId: 5 }, attributes: ["id", "usuarioId", "pantallaId", "estado"] })
    console.log("Servicios pantalla 5:", JSON.stringify(servicios.map((s) => s.toJSON()), null, 2))
    await sequelize.close()
}

run().catch(console.error)

