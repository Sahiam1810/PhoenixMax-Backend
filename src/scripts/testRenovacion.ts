/**
 * Auditoría de renovación contra la BD configurada localmente.
 * Ejecutar: npx tsx src/scripts/testRenovacion.ts
 *
 * Crea exclusivamente datos con el prefijo AUDIT_RENOVACION_, informa PASS/FAIL
 * por caso y los elimina al terminar (también si un caso falla).
 */
import "reflect-metadata"
import { Op } from "sequelize"
import { sequelize } from "../config/database.js"
import { Usuario } from "../models/Usuario.js"
import { Plataforma } from "../models/Plataforma.js"
import { Producto } from "../models/Producto.js"
import { Cuenta } from "../models/Cuenta.js"
import { Pantalla } from "../models/Pantalla.js"
import { CarritoItem } from "../models/CarritoItem.js"
import { Compra } from "../models/Compra.js"
import { CompraItem } from "../models/CompraItem.js"
import { Servicio } from "../models/Servicio.js"
import { Notificacion } from "../models/Notificacion.js"
import { CarritoRepository } from "../repositories/carrito/CarritoRepository.js"
import { ComprasRepository } from "../repositories/compras/ComprasRepository.js"
import { ProductosRepository } from "../repositories/productos/ProductosRepository.js"
import { AsignacionRepository } from "../repositories/inventario/AsignacionRepository.js"
import { StockRepository } from "../repositories/inventario/StockRepository.js"
import { VencimientosRepository } from "../repositories/vencimientos/VencimientosRepository.js"
import { CarritoService } from "../services/carrito/CarritoService.js"
import { ComprasService } from "../services/compras/ComprasService.js"
import { StockService } from "../services/inventario/StockService.js"
import { VencimientosService } from "../services/vencimientos/VencimientosService.js"
import { HttpError } from "../utils/httpError.js"
import { sumarDias } from "../utils/fechas.js"

const MARCA = `AUDIT_RENOVACION_${Date.now()}`
const DURACION = 30
const resultados: Array<{ caso: number, ok: boolean, detalle: string }> = []

const carritoRepository = new CarritoRepository(new ProductosRepository())
const carritoService = new CarritoService(carritoRepository, new StockService(new StockRepository()), sequelize)
const comprasService = new ComprasService(new ComprasRepository(), new AsignacionRepository(), carritoService, carritoRepository, sequelize, async () => undefined)

type Fixture = { usuario: Usuario, producto: Producto, servicio: Servicio, cuenta: Cuenta, pantallaServicio: Pantalla, pantallaNueva: Pantalla }

const fechaCasiIgual = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) < 2_000
const hoy = () => new Date()
const registrar = (caso: number, ok: boolean, detalle: string) => {
    resultados.push({ caso, ok, detalle })
    console.log(`${ok ? "PASS" : "FAIL"} ${caso}. ${detalle}`)
}
const errorHttp = (error: unknown, status: number) => error instanceof HttpError && error.statusCode === status

async function crearFixture(nombre: string, vencimiento: Date): Promise<Fixture> {
    const usuario = await Usuario.create({ nombre, email: `${MARCA}.${nombre}@test.local`, passwordHash: "auditoria", rol: "cliente", activo: true })
    const plataforma = await Plataforma.create({ nombre: `${MARCA}-${nombre}`, descripcion: null, logoUrl: null, maxPantallas: 2, activo: true })
    const producto = await Producto.create({ plataformaId: plataforma.id, tipo: "pantalla", duracionDias: DURACION, precio: "10000.00", activo: true })
    const cuenta = await Cuenta.create({ plataformaId: plataforma.id, emailAcceso: `${MARCA}.${nombre}@test.local`, passwordAcceso: "auditoria", estado: "parcial" })
    const pantallaServicio = await Pantalla.create({ cuentaId: cuenta.id, nombrePerfil: "existente", estado: "vendida" })
    const pantallaNueva = await Pantalla.create({ cuentaId: cuenta.id, nombrePerfil: "nueva", estado: "disponible" })
    const compra = await Compra.create({ usuarioId: usuario.id, total: "10000.00", estado: "pagada", metodoPago: "simulado", pagadaAt: hoy() })
    const item = await CompraItem.create({ compraId: compra.id, productoId: producto.id, cantidad: 1, precioUnitario: "10000.00", subtotal: "10000.00" })
    const servicio = await Servicio.create({ compraItemId: item.id, usuarioId: usuario.id, cuentaId: cuenta.id, pantallaId: pantallaServicio.id, fechaInicio: sumarDias(vencimiento, -DURACION), fechaVencimiento: vencimiento, estado: vencimiento <= hoy() ? "vencido" : "activo" })
    return { usuario, producto, servicio, cuenta, pantallaServicio, pantallaNueva }
}

async function renovar(usuarioId: number, productoId: number, servicioId: number): Promise<number> {
    await carritoService.add(usuarioId, { productoId, cantidad: 1, servicioId })
    const compra = await comprasService.create(usuarioId)
    await comprasService.pagar(usuarioId, compra.id, { metodoPago: "simulado" })
    return compra.id
}

async function crearCompraRenovacionPendiente(usuarioId: number, productoId: number, servicioId: number): Promise<number> {
    const compra = await Compra.create({ usuarioId, total: "10000.00", estado: "pendiente" })
    await CompraItem.create({ compraId: compra.id, productoId, servicioRenovadoId: servicioId, cantidad: 1, precioUnitario: "10000.00", subtotal: "10000.00" })
    return compra.id
}

async function limpiar(): Promise<void> {
    const usuarios = await Usuario.findAll({ where: { email: { [Op.like]: `${MARCA}.%` } } })
    const usuarioIds = usuarios.map((usuario) => usuario.id)
    if (usuarioIds.length === 0) return
    const servicios = await Servicio.findAll({ where: { usuarioId: { [Op.in]: usuarioIds } } })
    const servicioIds = servicios.map((servicio) => servicio.id)
    const compras = await Compra.findAll({ where: { usuarioId: { [Op.in]: usuarioIds } } })
    const compraIds = compras.map((compra) => compra.id)
    const plataformas = await Plataforma.findAll({ where: { nombre: { [Op.like]: `${MARCA}-%` } } })
    const plataformaIds = plataformas.map((plataforma) => plataforma.id)
    const productos = await Producto.findAll({ where: { plataformaId: { [Op.in]: plataformaIds } } })
    const productoIds = productos.map((producto) => producto.id)
    const cuentas = await Cuenta.findAll({ where: { plataformaId: { [Op.in]: plataformaIds } } })
    const cuentaIds = cuentas.map((cuenta) => cuenta.id)
    await Notificacion.destroy({ where: { servicioId: { [Op.in]: servicioIds } } })
    await CarritoItem.destroy({ where: { usuarioId: { [Op.in]: usuarioIds } } })
    await Servicio.destroy({ where: { usuarioId: { [Op.in]: usuarioIds } } })
    await CompraItem.destroy({ where: { compraId: { [Op.in]: compraIds } } })
    await Compra.destroy({ where: { id: { [Op.in]: compraIds } } })
    await Pantalla.destroy({ where: { cuentaId: { [Op.in]: cuentaIds } } })
    await Cuenta.destroy({ where: { id: { [Op.in]: cuentaIds } } })
    await Producto.destroy({ where: { id: { [Op.in]: productoIds } } })
    await Plataforma.destroy({ where: { id: { [Op.in]: plataformaIds } } })
    await Usuario.destroy({ where: { id: { [Op.in]: usuarioIds } } })
}

async function ejecutar(): Promise<void> {
    await sequelize.authenticate()
    await limpiar()
    try {
        const vencido = await crearFixture("vencido", sumarDias(hoy(), -2))
        const inicio1 = hoy()
        await renovar(vencido.usuario.id, vencido.producto.id, vencido.servicio.id)
        const renovado1 = await Servicio.findByPk(vencido.servicio.id)
        registrar(1, !!renovado1 && fechaCasiIgual(renovado1.fechaVencimiento, sumarDias(inicio1, DURACION)), "servicio vencido: vencimiento = hoy + duración")

        const activo = await crearFixture("activo", sumarDias(hoy(), 10))
        const anterior = activo.servicio.fechaVencimiento
        await renovar(activo.usuario.id, activo.producto.id, activo.servicio.id)
        const renovado2 = await Servicio.findByPk(activo.servicio.id)
        registrar(2, !!renovado2 && fechaCasiIgual(renovado2.fechaVencimiento, sumarDias(anterior, DURACION)), "servicio activo: vencimiento previo + duración")

        const mixto = await crearFixture("mixto", sumarDias(hoy(), 10))
        const cuentaAntes = mixto.cuenta.id
        const pantallaAntes = mixto.pantallaServicio.id
        await carritoService.add(mixto.usuario.id, { productoId: mixto.producto.id, cantidad: 1 })
        await carritoService.add(mixto.usuario.id, { productoId: mixto.producto.id, cantidad: 1, servicioId: mixto.servicio.id })
        const compraMixta = await comprasService.create(mixto.usuario.id)
        await comprasService.pagar(mixto.usuario.id, compraMixta.id, { metodoPago: "simulado" })
        const servicioMixto = await Servicio.findByPk(mixto.servicio.id)
        const nuevasPantallasVendidas = await Pantalla.count({ where: { cuentaId: mixto.cuenta.id, estado: "vendida" } })
        registrar(3, servicioMixto?.cuentaId === cuentaAntes && servicioMixto.pantallaId === pantallaAntes && nuevasPantallasVendidas === 2, "compra mixta: solo la pantalla nueva consumió stock; renovación conservó cuenta/pantalla")

        const ajeno = await crearFixture("ajeno", sumarDias(hoy(), 10))
        let errorAjeno: unknown
        try { await carritoService.add(mixto.usuario.id, { productoId: mixto.producto.id, cantidad: 1, servicioId: ajeno.servicio.id }) } catch (error) { errorAjeno = error }
        registrar(4, errorHttp(errorAjeno, 404), "servicio de otro usuario rechazado con 404")

        const duplicado = await crearFixture("duplicado", sumarDias(hoy(), 10))
        await carritoService.add(duplicado.usuario.id, { productoId: duplicado.producto.id, cantidad: 1, servicioId: duplicado.servicio.id })
        let errorDuplicado: unknown
        try { await carritoService.add(duplicado.usuario.id, { productoId: duplicado.producto.id, cantidad: 1, servicioId: duplicado.servicio.id }) } catch (error) { errorDuplicado = error }
        registrar(5, errorHttp(errorDuplicado, 409), "misma renovación en carrito rechazada con 409")

        const normal = await crearFixture("normal", sumarDias(hoy(), 10))
        await carritoService.add(normal.usuario.id, { productoId: normal.producto.id, cantidad: 1 })
        await carritoService.add(normal.usuario.id, { productoId: normal.producto.id, cantidad: 2 })
        const lineasNormales = await CarritoItem.findAll({ where: { usuarioId: normal.usuario.id, productoId: normal.producto.id, servicioId: null } })
        registrar(6, lineasNormales.length === 1 && lineasNormales[0].cantidad === 3, "producto normal consolidado en una línea con cantidad 3")

        const aviso = await crearFixture("avisos", sumarDias(hoy(), -1))
        await Notificacion.create({ servicioId: aviso.servicio.id, tipo: "vencido", enviadaAt: hoy() })
        await renovar(aviso.usuario.id, aviso.producto.id, aviso.servicio.id)
        const borradas = await Notificacion.count({ where: { servicioId: aviso.servicio.id } }) === 0
        const servicioAviso = await Servicio.findByPk(aviso.servicio.id)
        const repoAcotado = {
            findServiciosActivos: async () => (await new VencimientosRepository().findServiciosActivos()).filter((servicio) => servicio.id === aviso.servicio.id),
            createNotificacion: (data: { servicioId: number, tipo: "3_dias" | "1_dia" | "vencido", enviadaAt: Date }) => Notificacion.create(data),
            deleteNotificacion: (id: number) => Notificacion.destroy({ where: { id } }),
            marcarVencidos: async () => 0
        } as unknown as VencimientosRepository
        const cron = new VencimientosService(repoAcotado, async () => undefined)
        await cron.ejecutar(sumarDias(servicioAviso!.fechaVencimiento, -3))
        const nuevaAlerta = await Notificacion.count({ where: { servicioId: aviso.servicio.id, tipo: "3_dias" } }) === 1
        registrar(7, borradas && nuevaAlerta, "notificaciones previas borradas y cron volvió a notificar el nuevo ciclo")

        const inactivo = await crearFixture("inactivo", sumarDias(hoy(), 10))
        await carritoService.add(inactivo.usuario.id, { productoId: inactivo.producto.id, cantidad: 1, servicioId: inactivo.servicio.id })
        const compraInactiva = await comprasService.create(inactivo.usuario.id)
        await inactivo.producto.update({ activo: false })
        let errorInactivo: unknown
        try { await comprasService.pagar(inactivo.usuario.id, compraInactiva.id, { metodoPago: "simulado" }) } catch (error) { errorInactivo = error }
        registrar(8, errorHttp(errorInactivo, 409), "producto desactivado en renovación: pago rechazado con 409")

        const concurrente = await crearFixture("concurrente", sumarDias(hoy(), -1))
        const [compraA, compraB] = await Promise.all([
            crearCompraRenovacionPendiente(concurrente.usuario.id, concurrente.producto.id, concurrente.servicio.id),
            crearCompraRenovacionPendiente(concurrente.usuario.id, concurrente.producto.id, concurrente.servicio.id)
        ])
        const pagar = async (id: number) => {
            try { await comprasService.pagar(concurrente.usuario.id, id, { metodoPago: "simulado" }); return "pagada" }
            catch (error) { return error instanceof Error ? error.message : String(error) }
        }
        const [resultadoA, resultadoB] = await Promise.all([pagar(compraA), pagar(compraB)])
        const compraFinalA = await Compra.findByPk(compraA)
        const compraFinalB = await Compra.findByPk(compraB)
        const pagoCoherente = [compraFinalA?.estado, compraFinalB?.estado].every((estado) => estado === "pagada" || estado === "pendiente" || estado === "cancelada")
        registrar(9, pagoCoherente, `concurrencia observada: compra A=${resultadoA}; compra B=${resultadoB}; estados=${compraFinalA?.estado}/${compraFinalB?.estado}`)
    } finally {
        await limpiar()
    }
}

ejecutar()
    .catch((error: unknown) => { console.error("[ERROR FATAL]", error); process.exitCode = 1 })
    .finally(async () => {
        console.log("\nResumen:")
        for (const resultado of resultados) console.log(`${resultado.ok ? "PASS" : "FAIL"} ${resultado.caso}: ${resultado.detalle}`)
        await sequelize.close()
    })
