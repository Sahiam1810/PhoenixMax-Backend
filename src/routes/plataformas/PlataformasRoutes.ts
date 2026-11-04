import { Router } from "express"
import { PlataformasController } from "../../controllers/plataformas/PlataformasController.js"
export const plataformasRouter = Router()
plataformasRouter.get("/", PlataformasController.list)
