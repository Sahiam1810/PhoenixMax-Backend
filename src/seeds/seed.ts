import "reflect-metadata"
import bcrypt from "bcrypt"
import { sequelize } from "../config/database.js"
import { encrypt } from "../utils/crypto.js"
import { Compra } from "../models/Compra.js"
import { CompraItem } from "../models/CompraItem.js"
import { Cuenta } from "../models/Cuenta.js"
import { Pantalla } from "../models/Pantalla.js"
import { Plataforma } from "../models/Plataforma.js"
import { Producto } from "../models/Producto.js"
import { Servicio } from "../models/Servicio.js"
import { Usuario } from "../models/Usuario.js"

const DIA = 24 * 60 * 60 * 1000

const sumarDias = (fecha: Date, dias: number): Date => new Date(fecha.getTime() + dias * DIA)

const obtener = <T>(valor: T | null, mensaje: string): T => {
    if (!valor) {
        throw new Error(mensaje)
    }

    return valor
}

const plataformasSeed = [
    { nombre: "Netflix", descripcion: "Series, películas y documentales", maxPantallas: 5, precioCuenta: 60000, precioPantalla: 15000 },
    { nombre: "Disney+", descripcion: "Disney, Pixar, Marvel y Star Wars", maxPantallas: 4, precioCuenta: 45000, precioPantalla: 12000 },
    { nombre: "Prime Video", descripcion: "Películas y series originales", maxPantallas: 3, precioCuenta: 35000, precioPantalla: 12000 },
    { nombre: "Max", descripcion: "Series y películas premium", maxPantallas: 4, precioCuenta: 50000, precioPantalla: 14000 }
]

const usuariosSeed = [
    { nombre: "Administrador", email: "admin@streamstore.test", password: "Admin123*", telefono: "3000000000", rol: "admin" },
    { nombre: "Cliente Uno", email: "cliente1@streamstore.test", password: "Cliente123*", telefono: "3000000001", rol: "cliente" },
    { nombre: "Cliente Dos", email: "cliente2@streamstore.test", password: "Cliente123*", telefono: "3000000002", rol: "cliente" }
]

const sembrarUsuarios = async (): Promise<void> => {
    for (const datos of usuariosSeed) {
        await Usuario.findOrCreate({
            where: { email: datos.email },
            defaults: {
                nombre: datos.nombre,
                email: datos.email,
                passwordHash: await bcrypt.hash(datos.password, 10),
                telefono: datos.telefono,
                rol: datos.rol
            }
        })
    }
}

const sembrarCatalogoEInventario = async (): Promise<void> => {
    for (const datos of plataformasSeed) {
        const [plataforma] = await Plataforma.findOrCreate({
            where: { nombre: datos.nombre },
            defaults: { descripcion: datos.descripcion, maxPantallas: datos.maxPantallas, activo: true }
        })

        await Producto.findOrCreate({
            where: { plataformaId: plataforma.id, tipo: "cuenta", duracionDias: 30 },
            defaults: { precio: datos.precioCuenta, activo: true }
        })
        await Producto.findOrCreate({
            where: { plataformaId: plataforma.id, tipo: "pantalla", duracionDias: 30 },
            defaults: { precio: datos.precioPantalla, activo: true }
        })

        const slug = datos.nombre.toLowerCase().replace(/[^a-z0-9]/g, "")

        for (let i = 1; i <= 3; i++) {
            const [cuenta] = await Cuenta.findOrCreate({
                where: { plataformaId: plataforma.id, emailAcceso: `${slug}${i}@streamstore.test` },
                defaults: {
                    plataformaId: plataforma.id,
                    emailAcceso: `${slug}${i}@streamstore.test`,
                    passwordAcceso: encrypt(`Clave-${slug}-${i}`),
                    estado: "disponible"
                }
            })

            for (let j = 1; j <= datos.maxPantallas; j++) {
                await Pantalla.findOrCreate({
                    where: { cuentaId: cuenta.id, nombrePerfil: `Perfil ${j}` },
                    defaults: {
                        cuentaId: cuenta.id,
                        nombrePerfil: `Perfil ${j}`,
                        pin: String(1000 + cuenta.id * 10 + j),
                        estado: "disponible"
                    }
                })
            }
        }
    }
}

const crearServicio = async (
    usuario: Usuario,
    producto: Producto,
    cuenta: Cuenta,
    pantalla: Pantalla | null,
    diasRestantes: number
): Promise<void> => {
    const fechaVencimiento = sumarDias(new Date(), diasRestantes)
    const fechaInicio = sumarDias(fechaVencimiento, -producto.duracionDias)

    const compra = await Compra.create({
        usuarioId: usuario.id,
        total: producto.precio,
        estado: "pagada",
        metodoPago: "simulado",
        pagadaAt: fechaInicio
    })

    const item = await CompraItem.create({
        compraId: compra.id,
        productoId: producto.id,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
    })

    await Servicio.create({
        compraItemId: item.id,
        usuarioId: usuario.id,
        cuentaId: cuenta.id,
        pantallaId: pantalla ? pantalla.id : null,
        fechaInicio,
        fechaVencimiento,
        estado: "activo"
    })

    if (pantalla) {
        await pantalla.update({ estado: "vendida" })
        await cuenta.update({ estado: "parcial" })
        return
    }

    await Pantalla.update({ estado: "vendida" }, { where: { cuentaId: cuenta.id } })
    await cuenta.update({ estado: "vendida" })
}

const sembrarServicios = async (): Promise<void> => {
    if ((await Servicio.count()) > 0) {
        console.log("Servicios ya sembrados, se omiten")
        return
    }

    const cliente1 = obtener(await Usuario.findOne({ where: { email: "cliente1@streamstore.test" } }), "Falta cliente1")
    const cliente2 = obtener(await Usuario.findOne({ where: { email: "cliente2@streamstore.test" } }), "Falta cliente2")

    const cuentaDe = async (nombre: string, posicion: number): Promise<Cuenta> => {
        const plataforma = obtener(await Plataforma.findOne({ where: { nombre } }), `Falta ${nombre}`)
        const cuentas = await Cuenta.findAll({ where: { plataformaId: plataforma.id }, order: [["id", "ASC"]] })
        return obtener(cuentas[posicion] ?? null, `Falta la cuenta ${posicion + 1} de ${nombre}`)
    }

    const productoDe = async (nombre: string, tipo: "cuenta" | "pantalla"): Promise<Producto> => {
        const plataforma = obtener(await Plataforma.findOne({ where: { nombre } }), `Falta ${nombre}`)
        return obtener(await Producto.findOne({ where: { plataformaId: plataforma.id, tipo } }), `Falta producto ${tipo} de ${nombre}`)
    }

    const primeraPantalla = async (cuenta: Cuenta): Promise<Pantalla> =>
        obtener(await Pantalla.findOne({ where: { cuentaId: cuenta.id }, order: [["id", "ASC"]] }), "Falta pantalla")

    const netflix = await cuentaDe("Netflix", 0)
    await crearServicio(cliente1, await productoDe("Netflix", "pantalla"), netflix, await primeraPantalla(netflix), 3)

    const disney = await cuentaDe("Disney+", 0)
    await crearServicio(cliente2, await productoDe("Disney+", "pantalla"), disney, await primeraPantalla(disney), 1)

    const productoMax = await productoDe("Max", "cuenta")
    await crearServicio(cliente1, productoMax, await cuentaDe("Max", 0), null, 20)
    await crearServicio(cliente2, productoMax, await cuentaDe("Max", 1), null, 12)
}

const ejecutar = async (): Promise<void> => {
    await sequelize.authenticate()
    await sembrarUsuarios()
    await sembrarCatalogoEInventario()
    await sembrarServicios()
    console.log("Seed completado")
}

ejecutar()
    .then(() => sequelize.close())
    .catch(async (error) => {
        console.error(error)
        await sequelize.close()
        process.exit(1)
    })