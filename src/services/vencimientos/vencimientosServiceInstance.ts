import { VencimientosRepository } from "../../repositories/vencimientos/VencimientosRepository.js"
import { enviarCorreo } from "../../utils/mailer.js"
import { VencimientosService } from "./VencimientosService.js"

export const vencimientosService = new VencimientosService(new VencimientosRepository(), enviarCorreo)
