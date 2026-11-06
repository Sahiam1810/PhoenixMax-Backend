/**
 * TEST: Dos clientes intentan comprar la misma pantalla simultáneamente.
 *
 * Escenario:
 *   - Se busca un producto tipo "pantalla" con exactamente 1 unidad de stock.
 *   - Dos usuarios distintos lanzan el pago al mismo tiempo (Promise.all).
 *
 * Resultado esperado:
 *   - Una compra se aprueba (HTTP-like success).
 *   - La otra es rechazada con "sin stock" (HttpError 409).
 *   - La pantalla queda en estado "vendida" UNA sola vez.
 *
 * Cómo correr:
 *   npx tsx src/scripts/testDobleCompra.ts
 */

import "reflect-metadata"
import { Op } from "sequelize"
import { sequelize } from "../config/database.js"
import { CarritoItem } from "../models/CarritoItem.js"
import { Compra } from "../models/Compra.js"
import { CompraItem } from "../models/CompraItem.js"
import { Cuenta } from "../models/Cuenta.js"
import { Pantalla } from "../models/Pantalla.js"
import { Producto } from "../models/Producto.js"
import { Servicio } from "../models/Servicio.js"
import { Usuario } from "../models/Usuario.js"
import { CarritoRepository } from "../repositories/carrito/CarritoRepository.js"
import { ComprasRepository } from "../repositories/compras/ComprasRepository.js"
import { AsignacionRepository } from "../repositories/inventario/AsignacionRepository.js"
import { StockRepository } from "../repositories/inventario/StockRepository.js"
import { ProductosRepository } from "../repositories/productos/ProductosRepository.js"
import { CarritoService } from "../services/carrito/CarritoService.js"
import { ComprasService } from "../services/compras/ComprasService.js"
import { StockService } from "../services/inventario/StockService.js"

const carritoRepository = new CarritoRepository(new ProductosRepository())
const carritoService = new CarritoService(carritoRepository, new StockService(new StockRepository()), sequelize)
const comprasService = new ComprasService(new ComprasRepository(), new AsignacionRepository(), carritoService, carritoRepository, sequelize)

// ─── helpers ────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`[TEST] ${msg}`)
const ok  = (msg: string) => console.log(`  ✅  ${msg}`)
const err = (msg: string) => console.log(`  ❌  ${msg}`)
const sep = ()            => console.log("─".repeat(60))

// ─── buscar datos reales de la DB ───────────────────────────────────────────

const encontrarEscenario = async (): Promise<{
    usuario1: Usuario
    usuario2: Usuario
    productoId: number
    pantallaId: number
}> => {
    // 1. Necesitamos 2 clientes activos
    const clientes = await Usuario.findAll({ where: { rol: "cliente" }, limit: 2 })

    if (clientes.length < 2) {
        throw new Error("Se necesitan al menos 2 clientes activos en la DB (ejecuta npm run seed)")
    }

    // 2. Una pantalla en estado "disponible"
    const pantalla = await Pantalla.findOne({
        where: { estado: "disponible" },
        include: [{ model: Cuenta, where: { estado: { [Op.in]: ["disponible", "parcial"] } } }],
        order: [["id", "ASC"]]
    })

    if (!pantalla || !pantalla.cuenta) {
        throw new Error("No hay pantallas disponibles. Ejecuta npm run seed o revisa el inventario.")
    }

    const cuenta = pantalla.cuenta

    // 3. Producto tipo "pantalla" de la misma plataforma
    const producto = await Producto.findOne({
        where: { plataformaId: cuenta.plataformaId, tipo: "pantalla", activo: true }
    })

    if (!producto) {
        throw new Error(`No hay producto tipo pantalla para plataformaId=${cuenta.plataformaId}`)
    }

    return {
        usuario1: clientes[0],
        usuario2: clientes[1],
        productoId: producto.id,
        pantallaId: pantalla.id
    }
}

// ─── preparar carrito y compra pendiente para un usuario ────────────────────

const prepararCompra = async (usuarioId: number, productoId: number): Promise<number> => {
    // Limpiar carrito previo
    await CarritoItem.destroy({ where: { usuarioId } })

    // Agregar 1 unidad al carrito
    await CarritoItem.create({ usuarioId, productoId, cantidad: 1 })

    // Cancelar compras pendientes anteriores
    await Compra.update({ estado: "cancelada" }, { where: { usuarioId, estado: "pendiente" } })

    // Crear compra pendiente con su ítem
    const producto = await Producto.findByPk(productoId)
    if (!producto) throw new Error(`Producto ${productoId} no encontrado`)

    const compra = await Compra.create({ usuarioId, total: producto.precio, estado: "pendiente" })
    await CompraItem.create({
        compraId: compra.id,
        productoId,
        cantidad: 1,
        precioUnitario: producto.precio,
        subtotal: producto.precio
    })

    return compra.id
}

// ─── lanzar pago y capturar resultado ───────────────────────────────────────

const intentarPago = async (usuarioId: number, compraId: number): Promise<"aprobado" | string> => {
    try {
        await comprasService.pagar(usuarioId, compraId, { metodoPago: "simulado" })
        return "aprobado"
    } catch (e: unknown) {
        if (e instanceof Error) return e.message
        return "error desconocido"
    }
}

// ─── main ────────────────────────────────────────────────────────────────────

const ejecutar = async (): Promise<void> => {
    await sequelize.authenticate()
    sep()
    log("Iniciando test: dos clientes compran la misma pantalla")
    sep()

    const { usuario1, usuario2, productoId, pantallaId } = await encontrarEscenario()

    log(`Usuario 1: ${usuario1.email} (id=${usuario1.id})`)
    log(`Usuario 2: ${usuario2.email} (id=${usuario2.id})`)
    log(`Producto pantalla id=${productoId}`)
    log(`Pantalla objetivo id=${pantallaId}`)
    sep()

    // Verificar estado inicial
    const pantallaAntes = await Pantalla.findByPk(pantallaId)
    log(`Estado inicial de la pantalla: ${pantallaAntes?.estado}`)
    sep()

    // Preparar compras pendientes para ambos usuarios
    log("Preparando compras pendientes para ambos usuarios...")
    const [compraId1, compraId2] = await Promise.all([
        prepararCompra(usuario1.id, productoId),
        prepararCompra(usuario2.id, productoId)
    ])
    log(`  Compra usuario 1: id=${compraId1}`)
    log(`  Compra usuario 2: id=${compraId2}`)
    sep()

    // Ambos pagan al mismo tiempo
    log("Disparando ambos pagos simultáneamente con Promise.all...")
    const [resultado1, resultado2] = await Promise.all([
        intentarPago(usuario1.id, compraId1),
        intentarPago(usuario2.id, compraId2)
    ])

    log(`  Resultado usuario 1: ${resultado1}`)
    log(`  Resultado usuario 2: ${resultado2}`)
    sep()

    // Verificar estado final de la pantalla
    const pantallaFinal = await Pantalla.findByPk(pantallaId)
    log(`Estado final de la pantalla: ${pantallaFinal?.estado}`)

    // Contar servicios creados para esta pantalla
    const serviciosCreados = await Servicio.count({ where: { pantallaId } })
    log(`Servicios creados apuntando a esta pantalla: ${serviciosCreados}`)
    sep()

    // Validar resultados
    const aprobados = [resultado1, resultado2].filter((r) => r === "aprobado").length
    const rechazados = [resultado1, resultado2].filter((r) => r !== "aprobado").length

    if (aprobados === 1 && rechazados === 1) {
        ok("Solo un pago fue aprobado — correcto")
    } else if (aprobados === 2) {
        err(`AMBOS pagos fueron aprobados — SOBREVENTA DETECTADA 🚨`)
    } else {
        err(`Ambos pagos fueron rechazados — puede que no haya stock suficiente`)
    }

    if (pantallaFinal?.estado === "vendida") {
        ok("La pantalla quedó en estado 'vendida' — correcto")
    } else {
        err(`La pantalla quedó en estado '${pantallaFinal?.estado}' — inesperado`)
    }

    if (serviciosCreados === 1) {
        ok("Se creó exactamente 1 servicio para esta pantalla — correcto")
    } else {
        err(`Se crearon ${serviciosCreados} servicios para esta pantalla — SOBREVENTA 🚨`)
    }

    sep()
    log("Test finalizado")
}

ejecutar()
    .then(() => sequelize.close())
    .catch(async (e: unknown) => {
        console.error("[TEST ERROR]", e instanceof Error ? e.message : e)
        await sequelize.close()
        process.exit(1)
    })
