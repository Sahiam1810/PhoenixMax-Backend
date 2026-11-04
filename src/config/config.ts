import "dotenv/config"

const requiredInProduction = (value: string | undefined, name: string): string => {
    if (process.env.NODE_ENV === "production" && !value) {
        throw new Error(`${name} es obligatorio en producción`)
    }
    return value ?? ""
}

export const config = {
    env: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3000),
    clientUrls: (process.env.CLIENT_URL ?? "http://localhost:5173").split(",").map((url) => url.trim()),
    database: {
        host: process.env.DB_HOST ?? "127.0.0.1",
        port: Number(process.env.DB_PORT ?? 3306),
        name: process.env.DB_DATABASE ?? "streamstoreDb",
        username: process.env.DB_USERNAME ?? "root",
        password: process.env.DB_PASSWORD ?? "",
        timezone: process.env.DB_TIMEZONE ?? "-05:00"
    },
    jwt: {
        secret: requiredInProduction(process.env.JWT_SECRET, "JWT_SECRET"),
        refreshSecret: requiredInProduction(process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "8h",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d"
    },
    aesSecret: requiredInProduction(process.env.AES_SECRET, "AES_SECRET"),
    mail: {
        host: process.env.MAIL_HOST ?? "",
        port: Number(process.env.MAIL_PORT ?? 587),
        user: process.env.MAIL_USER ?? "",
        pass: process.env.MAIL_PASS ?? "",
        from: process.env.MAIL_FROM ?? ""
    },
    timezone: process.env.APP_TIMEZONE ?? "America/Bogota"
}
