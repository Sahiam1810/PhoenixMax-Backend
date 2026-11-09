import type { PlataformaResumen, TipoProducto } from "./Catalogo.js"

export type ServicioEstado = "activo" | "por_vencer" | "vencido"

export type TipoAlerta = "3_dias" | "1_dia" | "vencido"

export interface ServicioPublico {
    id: number
    productoId: number
    puedeRenovarse: boolean
    plataforma: PlataformaResumen
    tipo: TipoProducto
    emailAcceso: string | null
    passwordAcceso: string | null
    nombrePerfil: string | null
    pin: string | null
    fechaInicio: string
    fechaVencimiento: string
    diasRestantes: number
    estado: ServicioEstado
}

export interface ResultadoVencimientos {
    revisados: number
    notificacionesEnviadas: number
    serviciosVencidos: number
    errores: number
}
