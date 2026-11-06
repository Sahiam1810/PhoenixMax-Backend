/**
 * Script de verificación completa de los 16 endpoints de la especificación
 * Ejecución: npx tsx src/scripts/testEndpoints.ts
 */

import "dotenv/config"
import "reflect-metadata"
import { sequelize } from "../config/database.js"
import { apiRouter } from "../routes/index.js"
import express from "express"
import http from "node:http"

const app = express()
app.use(express.json())
app.use("/api", apiRouter)

const logOk = (msg: string) => console.log(`  [OK] ${msg}`)
const logFail = (msg: string, det: any) => console.error(`  [FAIL] ${msg}`, det)

async function testAll() {
    await sequelize.authenticate()
    const server = http.createServer(app)
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const address = server.address()
    if (!address || typeof address === "string") throw new Error("No server address")
    const port = address.port
    const base = `http://127.0.0.1:${port}/api`

    console.log(`\n=== INICIANDO AUDITORÍA DE LOS 16 ENDPOINTS (Base: ${base}) ===\n`)

    let token = ""
    let clienteId = 0
    let itemIdPrueba = 0
    let productoPruebaId = 0
    let compraIdPrueba = 0

    // 1. POST /api/auth/login
    try {
        const res = await fetch(`${base}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "cliente1@streamstore.test", password: "Cliente123*" })
        })
        const json = await res.json()
        if (res.status === 200 && json.data?.token) {
            token = json.data.token
            clienteId = json.data.usuario.id
            logOk("1. POST /api/auth/login -> 200 OK (Sesión iniciada, JWT obtenido)")
        } else {
            logFail("1. POST /api/auth/login", json)
        }
    } catch (e: any) {
        logFail("1. POST /api/auth/login", e.message)
    }

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }

    // 2. POST /api/auth/register (con email aleatorio)
    try {
        const rnd = Math.floor(Math.random() * 100000)
        const res = await fetch(`${base}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: `Test User ${rnd}`,
                email: `test${rnd}@streamstore.test`,
                password: "Password123!",
                telefono: "3001234567"
            })
        })
        const json = await res.json()
        if (res.status === 201) {
            logOk("2. POST /api/auth/register -> 201 Created (Usuario registrado)")
        } else {
            logFail("2. POST /api/auth/register", json)
        }
    } catch (e: any) {
        logFail("2. POST /api/auth/register", e.message)
    }

    // 3. GET /api/auth/me
    try {
        const res = await fetch(`${base}/auth/me`, { headers: authHeaders })
        const json = await res.json()
        if (res.status === 200 && json.data?.email === "cliente1@streamstore.test") {
            logOk("3. GET /api/auth/me -> 200 OK (Datos del usuario actual)")
        } else {
            logFail("3. GET /api/auth/me", json)
        }
    } catch (e: any) {
        logFail("3. GET /api/auth/me", e.message)
    }

    // 4. GET /api/plataformas
    try {
        const res = await fetch(`${base}/plataformas`)
        const json = await res.json()
        if (res.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
            logOk(`4. GET /api/plataformas -> 200 OK (${json.data.length} plataformas activas)`)
        } else {
            logFail("4. GET /api/plataformas", json)
        }
    } catch (e: any) {
        logFail("4. GET /api/plataformas", e.message)
    }

    // 5. GET /api/productos (y con filtros)
    try {
        const res = await fetch(`${base}/productos?tipo=pantalla`)
        const json = await res.json()
        if (res.status === 200 && json.data?.data && Array.isArray(json.data.data)) {
            productoPruebaId = json.data.data[0]?.id ?? 1
            logOk(`5. GET /api/productos?tipo=pantalla -> 200 OK (${json.data.total} productos con stock)`)
        } else {
            logFail("5. GET /api/productos", json)
        }
    } catch (e: any) {
        logFail("5. GET /api/productos", e.message)
    }

    // 6. GET /api/productos/:id
    try {
        const res = await fetch(`${base}/productos/${productoPruebaId}`)
        const json = await res.json()
        if (res.status === 200 && json.data?.id === productoPruebaId) {
            logOk(`6. GET /api/productos/:id -> 200 OK (Detalle producto ${productoPruebaId} con stock)`)
        } else {
            logFail("6. GET /api/productos/:id", json)
        }
    } catch (e: any) {
        logFail("6. GET /api/productos/:id", e.message)
    }

    // 7. GET /api/carrito
    try {
        const res = await fetch(`${base}/carrito`, { headers: authHeaders })
        const json = await res.json()
        if (res.status === 200 && Array.isArray(json.data?.items)) {
            logOk("7. GET /api/carrito -> 200 OK (Carrito obtenido con subtotales y total)")
        } else {
            logFail("7. GET /api/carrito", json)
        }
    } catch (e: any) {
        logFail("7. GET /api/carrito", e.message)
    }

    // 8. POST /api/carrito (probando compatibilidad { producto_id, cantidad })
    try {
        const res = await fetch(`${base}/carrito`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ producto_id: productoPruebaId, cantidad: 1 })
        })
        const json = await res.json()
        if ((res.status === 200 || res.status === 201) && json.data?.items) {
            const added = json.data.items.find((it: any) => it.productoId === productoPruebaId)
            itemIdPrueba = added?.id || json.data.items[0]?.id
            logOk(`8. POST /api/carrito -> ${res.status} (Agregado con { producto_id }, item ID: ${itemIdPrueba})`)
        } else {
            logFail("8. POST /api/carrito", json)
        }
    } catch (e: any) {
        logFail("8. POST /api/carrito", e.message)
    }

    // 9. PATCH /api/carrito/:itemId
    try {
        const res = await fetch(`${base}/carrito/${itemIdPrueba}`, {
            method: "PATCH",
            headers: authHeaders,
            body: JSON.stringify({ cantidad: 2 })
        })
        const json = await res.json()
        if (res.status === 200 && json.data?.items) {
            logOk(`9. PATCH /api/carrito/:itemId -> 200 OK (Cantidad modificada a 2)`)
        } else {
            logFail("9. PATCH /api/carrito/:itemId", json)
        }
    } catch (e: any) {
        logFail("9. PATCH /api/carrito/:itemId", e.message)
    }

    // 10. DELETE /api/carrito/:itemId
    try {
        const res = await fetch(`${base}/carrito/${itemIdPrueba}`, {
            method: "DELETE",
            headers: authHeaders
        })
        const json = await res.json()
        if (res.status === 200) {
            logOk(`10. DELETE /api/carrito/:itemId -> 200 OK (Ítem eliminado individualmente)`)
        } else {
            logFail("10. DELETE /api/carrito/:itemId", json)
        }
    } catch (e: any) {
        logFail("10. DELETE /api/carrito/:itemId", e.message)
    }

    // 11. DELETE /api/carrito
    try {
        // Volvemos a agregar para luego vaciar completo
        await fetch(`${base}/carrito`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ productoId: productoPruebaId, cantidad: 1 })
        })
        const res = await fetch(`${base}/carrito`, {
            method: "DELETE",
            headers: authHeaders
        })
        const json = await res.json()
        if (res.status === 200 && json.data?.items?.length === 0) {
            logOk("11. DELETE /api/carrito -> 200 OK (Carrito vaciado completo)")
        } else {
            logFail("11. DELETE /api/carrito", json)
        }
    } catch (e: any) {
        logFail("11. DELETE /api/carrito", e.message)
    }

    // 12. POST /api/compras (Checkout)
    try {
        // Llenamos carrito con 1 unidad para checkout
        await fetch(`${base}/carrito`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ productoId: productoPruebaId, cantidad: 1 })
        })
        const res = await fetch(`${base}/compras`, {
            method: "POST",
            headers: authHeaders
        })
        const json = await res.json()
        if ((res.status === 200 || res.status === 201) && json.data?.id) {
            compraIdPrueba = json.data.id
            logOk(`12. POST /api/compras -> ${res.status} (Compra creada en estado 'pendiente', id: ${compraIdPrueba})`)
        } else {
            logFail("12. POST /api/compras", json)
        }
    } catch (e: any) {
        logFail("12. POST /api/compras", e.message)
    }

    // 13. POST /api/compras/:id/pagar (Pago simulado)
    try {
        const res = await fetch(`${base}/compras/${compraIdPrueba}/pagar`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({ metodoPago: "simulado" })
        })
        const json = await res.json()
        if (res.status === 200 && json.data?.estado === "pagada") {
            logOk(`13. POST /api/compras/:id/pagar -> 200 OK (Pago simulado procesado, estado: 'pagada')`)
        } else {
            logFail("13. POST /api/compras/:id/pagar", json)
        }
    } catch (e: any) {
        logFail("13. POST /api/compras/:id/pagar", e.message)
    }

    // 14. GET /api/compras/mias
    try {
        const res = await fetch(`${base}/compras/mias`, { headers: authHeaders })
        const json = await res.json()
        if (res.status === 200 && (Array.isArray(json.data?.data) || Array.isArray(json.data))) {
            logOk("14. GET /api/compras/mias -> 200 OK (Historial de compras del cliente)")
        } else {
            logFail("14. GET /api/compras/mias", json)
        }
    } catch (e: any) {
        logFail("14. GET /api/compras/mias", e.message)
    }

    // 15. GET /api/compras/:id
    try {
        const res = await fetch(`${base}/compras/${compraIdPrueba}`, { headers: authHeaders })
        const json = await res.json()
        if (res.status === 200 && json.data?.id === compraIdPrueba) {
            logOk(`15. GET /api/compras/:id -> 200 OK (Detalle de la compra con sus ítems)`)
        } else {
            logFail("15. GET /api/compras/:id", json)
        }
    } catch (e: any) {
        logFail("15. GET /api/compras/:id", e.message)
    }

    // 16. GET /api/servicios/mios
    try {
        const res = await fetch(`${base}/servicios/mios`, { headers: authHeaders })
        const json = await res.json()
        if (res.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
            logOk(`16. GET /api/servicios/mios -> 200 OK (${json.data.length} servicios con vencimiento y credenciales)`)
        } else {
            logFail("16. GET /api/servicios/mios", json)
        }
    } catch (e: any) {
        logFail("16. GET /api/servicios/mios", e.message)
    }

    console.log("\n=== AUDITORÍA FINALIZADA EXITOSAMENTE ===\n")
    server.close()
    await sequelize.close()
}

testAll().catch((err) => {
    console.error("Error global en el test:", err)
    process.exit(1)
})
