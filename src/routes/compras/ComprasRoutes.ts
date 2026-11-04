import { Router } from "express"
import { ComprasController } from "../../controllers/compras/ComprasController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
export const comprasRouter = Router()
comprasRouter.use(authenticate)
comprasRouter.post("/", ComprasController.create).post("/:id/pagar", ComprasController.pay).get("/mias", ComprasController.mine).get("/:id", ComprasController.detail)
