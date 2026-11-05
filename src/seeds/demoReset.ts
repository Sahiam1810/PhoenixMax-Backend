import "reflect-metadata"
import type { Transaction } from "sequelize"
import { sequelize } from "../config/database.js"
import { Compra } from "../models/Compra.js"
import { CompraItem } from "../models/CompraItem.js"
import { Notificacion } from "../models/Notificacion.js"
import { Plataforma } from "../models/Plataforma.js"
import { Producto } from "../models/Producto.js"
import { Servicio } from "../models/Servicio.js"
import { Usuario } from "../models/Usuario.js"
import { sumarDias } from "../utils/fechas.js"

interface ServicioDemo {
    email: string
    plataforma: string
    diasRestantes: number
}

const serviciosDemo: ServicioDemo[] = [
    { email: "cliente1@streamstore.test", plataforma: "Netflix", diasRestantes: 3 },
    { email: "cliente2@streamstore.test", plataforma: "Disney+", diasRestantes: 1 }
]

const MENSAJE_SEED = "Ejecuta primero npm run seed"

const buscarServicio = async (demo: ServicioDemo, transaction: Transaction): Promise<Servicio> => {
    const usuario = await Usuario.findOne({ where: { email: demo.email }, transaction })

    if (!usuario) {
        throw new Error(`No existe el usuario ${demo.email}. ${MENSAJE_SEED}`)
    }

    const plataforma = await Plataforma.findOne({ where: { nombre: demo.plataforma }, transaction })

    if (!plataforma) {
        throw new Error(`No existe la plataforma ${demo.plataforma}. ${MENSAJE_SEED}`)
    }

    const servicio = await Servicio.findOne({
        where: { usuarioId: usuario.id },
        include: [{
            model: CompraItem,
            required: true,
            include: [
                {
                    model: Producto,
                    required: true,
                    where: { plataformaId: plataforma.id, tipo: "pantalla" }
                },
                {
                    model: Compra,
                    required: true
                }
            ]
        }],
        order: [["id", "ASC"]],
        transaction
    })

    if (!servicio) {
        throw new Error(`No existe el servicio de ${demo.plataforma} pantalla de ${demo.email}. ${MENSAJE_SEED}`)
    }

    return servicio
}

const reiniciarServicio = async (demo: ServicioDemo, ahora: Date, transaction: Transaction): Promise<void> => {
    const servicio = await buscarServicio(demo, transaction)
    const producto = servicio.compraItem?.producto
    const compra = servicio.compraItem?.compra

    if (!producto || !compra) {
        throw new Error(`El servicio ${servicio.id} no tiene producto o compra. ${MENSAJE_SEED}`)
    }

    const fechaVencimiento = sumarDias(ahora, demo.diasRestantes)
    const fechaInicio = sumarDias(fechaVencimiento, -producto.duracionDias)

    await servicio.update({ fechaInicio, fechaVencimiento, estado: "activo" }, { transaction })
    await compra.update({ pagadaAt: fechaInicio }, { transaction })

    const notificacionesBorradas = await Notificacion.destroy({ where: { servicioId: servicio.id }, transaction })
    const dias = demo.diasRestantes === 1 ? "1 día" : `${demo.diasRestantes} días`

    console.log(`Servicio ${servicio.id} (${demo.plataforma} pantalla, ${demo.email}): vence ${fechaVencimiento.toISOString()} (en ${dias}), inicio ${fechaInicio.toISOString()}, estado activo, compra ${compra.id} pagadaAt actualizada, notificaciones borradas: ${notificacionesBorradas}`)
}

const ejecutar = async (): Promise<void> => {
    await sequelize.authenticate()
    const ahora = new Date()

    await sequelize.transaction(async (transaction) => {
        for (const demo of serviciosDemo) {
            await reiniciarServicio(demo, ahora, transaction)
        }
    })

    console.log("Demo reiniciada")
}

ejecutar()
    .then(() => sequelize.close())
    .catch(async (error: unknown) => {
        console.error(error instanceof Error ? error.message : "Error desconocido")
        await sequelize.close()
        process.exit(1)
    })
