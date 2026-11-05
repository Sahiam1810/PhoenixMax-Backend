export interface PlataformaPublica {
    id: number
    nombre: string
    descripcion: string | null
    logoUrl: string | null
    maxPantallas: number
}

export interface ProductoPublico {
    id: number
    plataformaId: number
    tipo: "cuenta" | "pantalla"
    duracionDias: number
    precio: string
    stock: number
    agotado: boolean
    plataforma: {
        id: number
        nombre: string
        logoUrl: string | null
    }
}
