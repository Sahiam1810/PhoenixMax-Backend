import type { TipoProducto } from "../../interfaces/Catalogo.js"

export interface PantallaBloqueada {
    id: number
    estado: "disponible" | "vendida"
}

export interface CuentaBloqueada {
    id: number
    estado: "disponible" | "parcial" | "vendida" | "inactiva"
    pantallas: PantallaBloqueada[]
}

export interface UnidadPedida {
    itemId: number
    tipo: TipoProducto
}

export interface Asignacion {
    itemId: number
    cuentaId: number
    pantallaId: number | null
}

export interface PlanAsignacion {
    asignaciones: Asignacion[]
    cuentasVendidas: number[]
    cuentasParciales: number[]
    pantallasVendidas: number[]
}

export type ResultadoPlan =
    | { ok: true, plan: PlanAsignacion }
    | { ok: false, faltante: Record<TipoProducto, number> }

interface PantallaLibre {
    cuentaId: number
    pantallaId: number
    cuentaDisponible: boolean
}

const porId = <T extends { id: number }>(a: T, b: T): number => a.id - b.id

const esCuentaCompletaElegible = (cuenta: CuentaBloqueada): boolean => {
    if (cuenta.estado !== "disponible") {
        return false
    }

    if (cuenta.pantallas.length === 0) {
        return false
    }

    return cuenta.pantallas.every((pantalla) => pantalla.estado === "disponible")
}

const pantallasLibres = (cuentas: CuentaBloqueada[]): PantallaLibre[] => {
    const libres: PantallaLibre[] = []

    for (const cuenta of cuentas) {
        const pantallas = [...cuenta.pantallas].sort(porId)

        for (const pantalla of pantallas) {
            if (pantalla.estado === "disponible") {
                libres.push({
                    cuentaId: cuenta.id,
                    pantallaId: pantalla.id,
                    cuentaDisponible: cuenta.estado === "disponible"
                })
            }
        }
    }

    return libres
}

export const planificarAsignacion = (cuentas: CuentaBloqueada[], unidades: UnidadPedida[]): ResultadoPlan => {
    const ordenadas = [...cuentas].sort(porId)
    const unidadesCuenta = unidades.filter((unidad) => unidad.tipo === "cuenta")
    const unidadesPantalla = unidades.filter((unidad) => unidad.tipo === "pantalla")

    const cuentasElegibles = ordenadas.filter(esCuentaCompletaElegible)
    const cuentasAsignadas = cuentasElegibles.slice(0, unidadesCuenta.length)
    const idsCuentasAsignadas = new Set(cuentasAsignadas.map((cuenta) => cuenta.id))

    const parciales = ordenadas.filter((cuenta) => cuenta.estado === "parcial")
    const disponiblesRestantes = ordenadas.filter((cuenta) => cuenta.estado === "disponible" && !idsCuentasAsignadas.has(cuenta.id))
    const pantallasCandidatas = [...pantallasLibres(parciales), ...pantallasLibres(disponiblesRestantes)]
    const pantallasAsignadas = pantallasCandidatas.slice(0, unidadesPantalla.length)

    const faltante: Record<TipoProducto, number> = {
        cuenta: Math.max(0, unidadesCuenta.length - cuentasAsignadas.length),
        pantalla: Math.max(0, unidadesPantalla.length - pantallasAsignadas.length)
    }

    if (faltante.cuenta > 0 || faltante.pantalla > 0) {
        return { ok: false, faltante }
    }

    const asignaciones: Asignacion[] = []

    unidadesCuenta.forEach((unidad, indice) => {
        asignaciones.push({
            itemId: unidad.itemId,
            cuentaId: cuentasAsignadas[indice].id,
            pantallaId: null
        })
    })

    unidadesPantalla.forEach((unidad, indice) => {
        asignaciones.push({
            itemId: unidad.itemId,
            cuentaId: pantallasAsignadas[indice].cuentaId,
            pantallaId: pantallasAsignadas[indice].pantallaId
        })
    })

    const cuentasParciales = new Set<number>()

    for (const pantalla of pantallasAsignadas) {
        if (pantalla.cuentaDisponible) {
            cuentasParciales.add(pantalla.cuentaId)
        }
    }

    return {
        ok: true,
        plan: {
            asignaciones,
            cuentasVendidas: cuentasAsignadas.map((cuenta) => cuenta.id),
            cuentasParciales: [...cuentasParciales],
            pantallasVendidas: pantallasAsignadas.map((pantalla) => pantalla.pantallaId)
        }
    }
}
