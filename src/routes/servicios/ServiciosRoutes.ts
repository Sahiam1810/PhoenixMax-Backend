import { Router } from "express"
import { ServiciosController } from "../../controllers/servicios/ServiciosController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
export const serviciosRouter = Router()
serviciosRouter.get("/mios", authenticate, ServiciosController.mine)
