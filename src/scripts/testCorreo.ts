/**
 * Test rápido: envía un correo de alerta de vencimiento a una dirección real.
 * Uso: npx tsx src/scripts/testCorreo.ts
 */

import "dotenv/config"
import { enviarCorreo } from "../utils/mailer.js"
import { plantillaVencimiento } from "../services/vencimientos/plantillaVencimiento.js"
import { config } from "../config/config.js"

const DESTINATARIO = "jovennegociante@gmail.com"
const TIMEZONE = config.timezone || "America/Bogota"

const ahora = new Date()
const fechaVencimiento = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 días desde ahora

const correo = plantillaVencimiento({
    nombreCliente: "Administrador",
    plataforma: "Netflix",
    tipoServicio: "pantalla",
    tipoAlerta: "3_dias",
    fechaVencimiento,
    yaVencio: false,
    timeZone: TIMEZONE,
    urlRenovar: "http://localhost:5173/mi-cuenta"
})

console.log("Configuración de correo:")
console.log(`  Host : ${config.mail.host}`)
console.log(`  Puerto: ${config.mail.port}`)
console.log(`  Usuario: ${config.mail.user}`)
console.log(`  From: ${config.mail.from}`)
console.log(`  Para: ${DESTINATARIO}`)
console.log(`  Asunto: ${correo.subject}`)
console.log("")
console.log("Enviando...")

enviarCorreo({ to: DESTINATARIO, subject: correo.subject, text: correo.text, html: correo.html })
    .then(() => {
        console.log(`✅ Correo enviado exitosamente a ${DESTINATARIO}`)
    })
    .catch((error: unknown) => {
        console.error("❌ Error al enviar:", error instanceof Error ? error.message : error)
        process.exit(1)
    })

