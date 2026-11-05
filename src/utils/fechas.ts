import type { ServicioEstado } from "../interfaces/Servicio.js"

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000
const DIAS_POR_VENCER = 3

export const sumarDias = (fecha: Date, dias: number): Date => new Date(fecha.getTime() + dias * MILISEGUNDOS_POR_DIA)

export const diasRestantes = (fechaVencimiento: Date, ahora: Date): number => {
    const diferencia = fechaVencimiento.getTime() - ahora.getTime()
    const dias = Math.ceil(diferencia / MILISEGUNDOS_POR_DIA)

    return Math.max(0, dias)
}

export const estadoServicio = (fechaVencimiento: Date, ahora: Date): ServicioEstado => {
    if (fechaVencimiento.getTime() <= ahora.getTime()) {
        return "vencido"
    }

    if (diasRestantes(fechaVencimiento, ahora) <= DIAS_POR_VENCER) {
        return "por_vencer"
    }

    return "activo"
}

const diaCalendarioUtc = (fecha: Date, timeZone: string): number => {
    const formato = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    })
    const partes = formato.formatToParts(fecha)
    const valor = (tipo: "year" | "month" | "day"): number => Number(partes.find((parte) => parte.type === tipo)?.value)

    return Date.UTC(valor("year"), valor("month") - 1, valor("day"))
}

export const diferenciaDiasCalendario = (fechaVencimiento: Date, ahora: Date, timeZone: string): number => {
    const diferencia = diaCalendarioUtc(fechaVencimiento, timeZone) - diaCalendarioUtc(ahora, timeZone)

    return Math.round(diferencia / MILISEGUNDOS_POR_DIA)
}
