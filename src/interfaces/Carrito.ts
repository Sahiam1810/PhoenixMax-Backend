import type { TipoProducto } from "./Catalogo.js"

export interface CarritoItemPublico {
    id: number
    productoId: number
    servicioId: number | null
    esRenovacion: boolean
    servicio: { id: number, emailAcceso: string | null, nombrePerfil: string | null } | null
    cantidad: number
    precioUnitario: string
    subtotal: string
    stock: number
    agotado: boolean
    excedeStock: boolean
    noDisponible: boolean
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

export interface CarritoPublico {
    items: CarritoItemPublico[]
    totalItems: number
    total: string
}
