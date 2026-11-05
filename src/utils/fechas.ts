const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

export const sumarDias = (fecha: Date, dias: number): Date => new Date(fecha.getTime() + dias * MILISEGUNDOS_POR_DIA)
