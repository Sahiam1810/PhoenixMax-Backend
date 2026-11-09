import type { Plataforma } from "../models/Plataforma.js"
import type { Producto } from "../models/Producto.js"
import type { Usuario } from "../models/Usuario.js"
import type { PlataformaPublica, ProductoPublico } from "../interfaces/Catalogo.js"
import type { UsuarioPublico } from "../interfaces/User.js"

export const toCentavos = (valor: string | number): bigint => {
    const decimal = String(valor).trim()
    const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(decimal)

    if (!match) {
        throw new Error("Valor monetario inválido")
    }

    const signo = match[1] === "-" ? -1n : 1n
    const enteros = BigInt(match[2])
    const decimales = (match[3] ?? "").padEnd(2, "0")

    return signo * (enteros * 100n + BigInt(decimales))
}

export const fromCentavos = (centavos: bigint): string => {
    const signo = centavos < 0n ? "-" : ""
    const absoluto = centavos < 0n ? -centavos : centavos
    const enteros = absoluto / 100n
    const decimales = (absoluto % 100n).toString().padStart(2, "0")

    return `${signo}${enteros}.${decimales}`
}

export const toMoney = (value: string | number): string => fromCentavos(toCentavos(value))

export const toUsuarioPublico = (usuario: Usuario): UsuarioPublico => ({
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt.toISOString()
})

export const toPlataformaPublica = (plataforma: Plataforma): PlataformaPublica => ({
    id: plataforma.id,
    nombre: plataforma.nombre,
    descripcion: plataforma.descripcion,
    logoUrl: plataforma.logoUrl,
    maxPantallas: plataforma.maxPantallas
})

export const toProductoPublico = (producto: Producto, stock: number): ProductoPublico => {
    if (!producto.plataforma) {
        throw new Error("El producto no tiene la plataforma cargada")
    }

    return {
        id: producto.id,
        plataformaId: producto.plataformaId,
        tipo: producto.tipo,
        duracionDias: producto.duracionDias,
        precio: toMoney(producto.precio),
        stock,
        agotado: stock === 0,
        plataforma: {
            id: producto.plataforma.id,
            nombre: producto.plataforma.nombre,
            logoUrl: producto.plataforma.logoUrl
        }
    }
}
