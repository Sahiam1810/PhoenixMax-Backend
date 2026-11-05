import { Router } from "express"
import { ServiciosController } from "../../controllers/servicios/ServiciosController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
import { requireRole } from "../../middlewares/RoleMiddleware.js"

export const serviciosRouter = Router()

serviciosRouter.use(authenticate)
serviciosRouter.use(requireRole("cliente"))
serviciosRouter.get("/mios", ServiciosController.list)
