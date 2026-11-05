import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { config } from "../config/config.js"

const key = (): Buffer => createHash("sha256").update(config.aesSecret).digest()

export const encrypt = (value: string): string => {
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()

    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export const decrypt = (value: string): string => {
    try {
        const [ivBase64, tagBase64, encryptedBase64, extra] = value.split(":")
        const base64 = /^[A-Za-z0-9+/]+={0,2}$/

        if (!ivBase64 || !tagBase64 || !encryptedBase64 || extra || !base64.test(ivBase64) || !base64.test(tagBase64) || !base64.test(encryptedBase64)) {
            throw new Error("Formato inválido")
        }

        const iv = Buffer.from(ivBase64, "base64")
        const tag = Buffer.from(tagBase64, "base64")
        const encrypted = Buffer.from(encryptedBase64, "base64")

        if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
            throw new Error("Formato inválido")
        }

        const decipher = createDecipheriv("aes-256-gcm", key(), iv)
        decipher.setAuthTag(tag)

        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
    } catch {
        throw new Error("Texto cifrado inválido")
    }
}
