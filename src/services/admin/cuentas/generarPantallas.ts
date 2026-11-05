import { randomInt } from "node:crypto"

export interface PantallaGenerada {
    cuentaId: number
    nombrePerfil: string
    pin: string
    estado: "disponible"
}

export const generarPantallas = (cuentaId: number, maxPantallas: number, generarPin = (): string => String(randomInt(1000, 10000))): PantallaGenerada[] => {
    const pines = new Set<string>()
    const pantallas: PantallaGenerada[] = []

    for (let posicion = 1; posicion <= maxPantallas; posicion += 1) {
        let pin = generarPin()

        while (pines.has(pin)) {
            pin = generarPin()
        }

        pines.add(pin)
        pantallas.push({
            cuentaId,
            nombrePerfil: `Perfil ${posicion}`,
            pin,
            estado: "disponible"
        })
    }

    return pantallas
}
