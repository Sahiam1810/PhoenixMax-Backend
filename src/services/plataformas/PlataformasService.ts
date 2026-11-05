import type { PlataformaPublica } from "../../interfaces/Catalogo.js"
import { PlataformasRepository } from "../../repositories/plataformas/PlataformasRepository.js"
import { toPlataformaPublica } from "../../utils/formatters.js"

export class PlataformasService {
    constructor(private readonly plataformasRepository: PlataformasRepository) {}

    async list(): Promise<PlataformaPublica[]> {
        const plataformas = await this.plataformasRepository.findActivas()

        return plataformas.map(toPlataformaPublica)
    }
}
