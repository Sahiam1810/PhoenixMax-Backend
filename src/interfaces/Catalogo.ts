export type TipoProducto = "cuenta" | "pantalla"

export interface PlataformaPublica {
    id: number
    nombre: string
    descripcion: string | null
    logoUrl: string | null
    maxPantallas: number
}

export interface PlataformaResumen {
    id: number
    nombre: string
    logoUrl: string | null
}

export interface ProductoPublico {
    id: number
    plataformaId: number
    tipo: TipoProducto
    duracionDias: number
    precio: string
    stock: number
    agotado: boolean
    plataforma: PlataformaResumen
}
