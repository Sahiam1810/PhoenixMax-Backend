import { Plataforma } from "../../models/Plataforma.js"

export class PlataformasRepository {
    async findActivas(): Promise<Plataforma[]> {
        return Plataforma.findAll({
            where: { activo: true },
            order: [["id", "ASC"]]
        })
    }
}
