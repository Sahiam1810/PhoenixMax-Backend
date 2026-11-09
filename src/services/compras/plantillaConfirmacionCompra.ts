import type { TipoProducto } from "../../interfaces/Catalogo.js"

export interface ItemConfirmacionCompra {
    plataforma: string
    tipo: TipoProducto
    esRenovacion: boolean
    duracionDias: number
    cantidad: number
    precioUnitario: string
    subtotal: string
}

export interface PlantillaConfirmacionCompraInput {
    nombreCliente: string
    compraId: number
    fechaCompra: Date
    items: ItemConfirmacionCompra[]
    total: string
    timeZone: string
    urlMisServicios: string
}

export interface PlantillaConfirmacionCompra {
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

const modalidad = (tipo: TipoProducto): string => tipo === "pantalla" ? "Pantalla individual" : "Cuenta completa"
const descripcionItem = (item: ItemConfirmacionCompra): string => `${item.esRenovacion ? "Renovación · " : ""}${modalidad(item.tipo)}`

const formatearDinero = (valor: string): string => new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
}).format(Number(valor))

const formatearFecha = (fecha: Date, timeZone: string): string => new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone
}).format(fecha)

export const plantillaConfirmacionCompra = (input: PlantillaConfirmacionCompraInput): PlantillaConfirmacionCompra => {
    const subject = `Tu compra #${input.compraId} en StreamStore fue confirmada`
    const fecha = formatearFecha(input.fechaCompra, input.timeZone)
    const total = formatearDinero(input.total)
    const text = [
        `Hola, ${input.nombreCliente}:`,
        "",
        subject,
        `Fecha: ${fecha}`,
        "",
        "Detalle del pedido:",
        ...input.items.map((item) => `${item.plataforma} · ${modalidad(item.tipo)} · ${item.duracionDias} días · Cantidad: ${item.cantidad} · Unitario: ${formatearDinero(item.precioUnitario)} · Subtotal: ${formatearDinero(item.subtotal)}`),
        "",
        `Total: ${total}`,
        "",
        `Consulta tus credenciales en Mis servicios: ${input.urlMisServicios}`,
        "",
        "Equipo StreamStore"
    ].join("\n")

    const filas = input.items.map((item) => [
        "<tr>",
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb">${escaparHtml(item.plataforma)}</td>`,
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb">${escaparHtml(descripcionItem(item))}</td>`,
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb">${item.duracionDias} días</td>`,
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">${item.cantidad}</td>`,
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${escaparHtml(formatearDinero(item.precioUnitario))}</td>`,
        `<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${escaparHtml(formatearDinero(item.subtotal))}</td>`,
        "</tr>"
    ].join("")).join("")

    const html = [
        "<div style=\"font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;padding:24px\">",
        "<div style=\"max-width:720px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;color:#1f2937\">",
        `<p style="font-size:16px;margin:0 0 16px">Hola, ${escaparHtml(input.nombreCliente)}:</p>`,
        `<h1 style="font-size:20px;margin:0 0 8px;color:#111827">${escaparHtml(subject)}</h1>`,
        `<p style="font-size:14px;color:#6b7280;margin:0 0 24px">Compra #${input.compraId} · ${escaparHtml(fecha)}</p>`,
        "<table style=\"width:100%;border-collapse:collapse;font-size:14px;margin:0 0 16px\">",
        "<thead><tr style=\"background:#f9fafb;text-align:left\"><th style=\"padding:8px\">Plataforma</th><th style=\"padding:8px\">Modalidad</th><th style=\"padding:8px\">Duración</th><th style=\"padding:8px\">Cantidad</th><th style=\"padding:8px;text-align:right\">Unitario</th><th style=\"padding:8px;text-align:right\">Subtotal</th></tr></thead>",
        `<tbody>${filas}</tbody>`,
        "</table>",
        `<p style="font-size:16px;font-weight:bold;text-align:right;margin:0 0 24px">Total: ${escaparHtml(total)}</p>`,
        `<a href="${escaparHtml(input.urlMisServicios)}" style="display:inline-block;background:#e50914;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold">Ver mis servicios</a>`,
        "<p style=\"font-size:12px;color:#9ca3af;margin:24px 0 0\">Las credenciales de tus servicios están disponibles únicamente en Mis servicios.</p>",
        "<p style=\"font-size:12px;color:#9ca3af;margin:8px 0 0\">Equipo StreamStore</p>",
        "</div>",
        "</div>"
    ].join("")

    return { subject, text, html }
}
