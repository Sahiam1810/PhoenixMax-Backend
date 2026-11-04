import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { config } from "../config/config.js"

const key = (): Buffer => createHash("sha256").update(config.aesSecret).digest()

export const encrypt = (value: string): string => {
    const iv = randomBytes(16)
    const cipher = createCipheriv("aes-256-cbc", key(), iv)
    return `${iv.toString("hex")}:${Buffer.concat([cipher.update(value, "utf8"), cipher.final()]).toString("hex")}`
}

export const decrypt = (value: string): string => {
    const [ivHex, encrypted] = value.split(":")
    if (!ivHex || !encrypted) throw new Error("Texto cifrado inválido")
    const decipher = createDecipheriv("aes-256-cbc", key(), Buffer.from(ivHex, "hex"))
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]).toString("utf8")
}
