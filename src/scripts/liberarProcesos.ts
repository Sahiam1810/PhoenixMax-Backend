import { execFileSync } from "node:child_process"
import { config } from "../config/config.js"
import { z } from "../config/zod.js"
import { logger } from "../utils/logger.js"

const procesoWindowsSchema = z.object({
    ProcessId: z.number(),
    CommandLine: z.string().nullable()
})

const listaProcesosWindowsSchema = z.union([procesoWindowsSchema, z.array(procesoWindowsSchema)])

type ProcesoWindows = z.infer<typeof procesoWindowsSchema>

interface Proceso {
    pid: number
    comando: string
}

const PATRON_SERVIDOR = /tsx.*src[\\/]+server\.ts/

const ejecutar = (comando: string, argumentos: string[]): string => {
    try {
        return execFileSync(comando, argumentos, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    } catch {
        return ""
    }
}

const powershell = (script: string): string => ejecutar("powershell", ["-NoProfile", "-NonInteractive", "-Command", script])

const procesosNodeWindows = (): Proceso[] => {
    const salida = powershell("Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress").trim()

    if (!salida) {
        return []
    }

    const resultado = listaProcesosWindowsSchema.safeParse(JSON.parse(salida))

    if (!resultado.success) {
        return []
    }

    const procesos: ProcesoWindows[] = Array.isArray(resultado.data) ? resultado.data : [resultado.data]

    return procesos.map((proceso) => ({
        pid: proceso.ProcessId,
        comando: proceso.CommandLine ?? ""
    }))
}

const procesosNodeUnix = (): Proceso[] => {
    const salida = ejecutar("ps", ["-eo", "pid=,args="])

    return salida
        .split("\n")
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0)
        .map((linea) => {
            const [pid, ...comando] = linea.split(/\s+/)

            return {
                pid: Number(pid),
                comando: comando.join(" ")
            }
        })
        .filter((proceso) => /node|tsx/.test(proceso.comando))
}

const pidsEnPuertoWindows = (puerto: number): number[] => {
    const salida = powershell(`Get-NetTCPConnection -LocalPort ${puerto} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`)

    return salida
        .split(/\r?\n/)
        .map((linea) => Number(linea.trim()))
        .filter((pid) => Number.isInteger(pid) && pid > 0)
}

const pidsEnPuertoUnix = (puerto: number): number[] => {
    const salida = ejecutar("lsof", ["-ti", `tcp:${puerto}`, "-sTCP:LISTEN"])

    return salida
        .split("\n")
        .map((linea) => Number(linea.trim()))
        .filter((pid) => Number.isInteger(pid) && pid > 0)
}

const terminar = (pid: number): void => {
    if (process.platform === "win32") {
        ejecutar("taskkill", ["/PID", String(pid), "/T", "/F"])
        return
    }

    try {
        process.kill(pid, "SIGTERM")
    } catch {
        return
    }
}

const liberarProcesos = (): void => {
    const esWindows = process.platform === "win32"
    const procesos = esWindows ? procesosNodeWindows() : procesosNodeUnix()
    const pidsEnPuerto = esWindows ? pidsEnPuertoWindows(config.port) : pidsEnPuertoUnix(config.port)
    const pidsNode = new Set(procesos.map((proceso) => proceso.pid))
    const propios = new Set([process.pid, process.ppid])

    const servidoresHuerfanos = procesos
        .filter((proceso) => PATRON_SERVIDOR.test(proceso.comando))
        .map((proceso) => proceso.pid)

    const ocupanPuerto = pidsEnPuerto.filter((pid) => pidsNode.has(pid))
    const ajenos = pidsEnPuerto.filter((pid) => !pidsNode.has(pid))
    const objetivos = [...new Set([...servidoresHuerfanos, ...ocupanPuerto])].filter((pid) => !propios.has(pid))

    for (const pid of objetivos) {
        terminar(pid)
    }

    if (objetivos.length > 0) {
        logger.info("Procesos anteriores del servidor terminados", { pids: objetivos, puerto: config.port })
    }

    if (ajenos.length > 0) {
        logger.warn("El puerto está ocupado por un proceso que no es node, no se terminó", { pids: ajenos, puerto: config.port })
    }
}

liberarProcesos()
