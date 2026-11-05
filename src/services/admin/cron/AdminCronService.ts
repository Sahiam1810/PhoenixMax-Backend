import type { ResultadoVencimientos } from "../../../interfaces/Servicio.js"
import type { VencimientosService } from "../../vencimientos/VencimientosService.js"

export class AdminCronService {
    constructor(private readonly vencimientosService: VencimientosService) {}

    async run(): Promise<ResultadoVencimientos> {
        return this.vencimientosService.ejecutar()
    }
}
