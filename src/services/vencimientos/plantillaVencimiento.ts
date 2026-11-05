import type { TipoProducto } from "../../interfaces/Catalogo.js"
import type { TipoAlerta } from "../../interfaces/Servicio.js"

export interface PlantillaVencimientoInput {
    nombreCliente: string
    plataforma: string
    tipoServicio: TipoProducto
    tipoAlerta: TipoAlerta
    fechaVencimiento: Date
    yaVencio: boolean
    timeZone: string
    urlRenovar: string
}

export interface PlantillaVencimiento {
    subject: string
    text: string
    html: string
}

const ESCAPES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
}

const escaparHtml = (valor: string): string => valor.replace(/[&<>"']/g, (caracter) => ESCAPES[caracter])

const fraseVencimiento = (tipoAlerta: TipoAlerta, yaVencio: boolean): string => {
    if (tipoAlerta === "3_dias") {
        return "vence en 3 días"
    }

    if (tipoAlerta === "1_dia") {
        return "vence mañana"
    }

    return yaVencio ? "venció hoy" : "vence hoy"
}

const formatearFecha = (fecha: Date, timeZone: string): string => {
    const formato = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone
    })

    return formato.format(fecha)
}

export const plantillaVencimiento = (input: PlantillaVencimientoInput): PlantillaVencimiento => {
    const servicio = input.tipoServicio === "pantalla" ? "pantalla" : "cuenta"
    const modalidad = input.tipoServicio === "pantalla" ? "Pantalla individual" : "Cuenta completa"
    const frase = fraseVencimiento(input.tipoAlerta, input.yaVencio)
    const fecha = formatearFecha(input.fechaVencimiento, input.timeZone)
    const subject = `Tu ${servicio} de ${input.plataforma} ${frase}`
    const etiquetaFecha = input.yaVencio ? "Venció el" : "Vence el"

    const text = [
        `Hola, ${input.nombreCliente}:`,
        "",
        `${subject}.`,
        "",
        `Plataforma: ${input.plataforma}`,
        `Modalidad: ${modalidad}`,
        `${etiquetaFecha}: ${fecha}`,
        "",
        `Renueva tu servicio aquí: ${input.urlRenovar}`,
        "",
        "Equipo StreamStore"
    ].join("\n")

    const nombre = escaparHtml(input.nombreCliente)
    const plataforma = escaparHtml(input.plataforma)
    const asunto = escaparHtml(subject)
    const url = escaparHtml(input.urlRenovar)
    const fechaHtml = escaparHtml(fecha)

    const html = [
        "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;padding:24px\">",
        "<div style=\"max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;color:#1f2937\">",
        `<p style="font-size:16px;margin:0 0 16px">Hola, ${nombre}:</p>`,
        `<h1 style="font-size:20px;margin:0 0 16px;color:#111827">${asunto}</h1>`,
        "<table style=\"width:100%;border-collapse:collapse;font-size:14px;margin:0 0 24px\">",
        `<tr><td style="padding:6px 0;color:#6b7280">Plataforma</td><td style="padding:6px 0;font-weight:bold">${plataforma}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#6b7280">Modalidad</td><td style="padding:6px 0;font-weight:bold">${modalidad}</td></tr>`,
        `<tr><td style="padding:6px 0;color:#6b7280">${etiquetaFecha}</td><td style="padding:6px 0;font-weight:bold">${fechaHtml}</td></tr>`,
        "</table>",
        `<a href="${url}" style="display:inline-block;background:#e50914;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold">Renovar</a>`,
        "<p style=\"font-size:12px;color:#9ca3af;margin:24px 0 0\">Equipo StreamStore</p>",
        "</div>",
        "</div>"
    ].join("")

    return { subject, text, html }
}
