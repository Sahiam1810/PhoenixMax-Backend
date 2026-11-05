import nodemailer from "nodemailer"
import { config } from "../config/config.js"

export interface Correo {
    to: string
    subject: string
    text: string
    html: string
}

export type EnviarCorreo = (correo: Correo) => Promise<void>

export const mailer = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    auth: {
        user: config.mail.user,
        pass: config.mail.pass
    }
})

export const enviarCorreo: EnviarCorreo = async (correo) => {
    await mailer.sendMail({
        from: config.mail.from,
        to: correo.to,
        subject: correo.subject,
        text: correo.text,
        html: correo.html
    })
}
