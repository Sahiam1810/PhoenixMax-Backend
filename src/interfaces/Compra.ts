import type { TipoProducto } from "./Catalogo.js"

export type EstadoCompra = "pendiente" | "pagada" | "cancelada"

export interface CompraItemPublico {
    id: number
    productoId: number
    cantidad: number
    precioUnitario: string
    subtotal: string
    producto: {
        tipo: TipoProducto
        duracionDias: number
        plataforma: {
            id: number
            nombre: string
            logoUrl: string | null
        }
    }
}

export interface CompraPublica {
    id: number
    estado: EstadoCompra
    total: string
    metodoPago: string | null
    pagadaAt: string | null
    createdAt: string
    items: CompraItemPublico[]
}
