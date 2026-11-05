export interface PantallaPublica {
    id: number
    nombrePerfil: string
    estado: "disponible" | "vendida"
}

export interface CuentaPublica {
    id: number
    plataformaId: number
    plataforma: {
        id: number
        nombre: string
    }
    emailAcceso: string
    estado: "disponible" | "parcial" | "vendida" | "inactiva"
    pantallasTotal: number
    pantallasDisponibles: number
    pantallasVendidas: number
    pantallas: PantallaPublica[]
}
