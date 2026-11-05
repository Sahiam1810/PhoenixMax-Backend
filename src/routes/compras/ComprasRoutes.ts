import { Router } from "express"
import { ComprasController } from "../../controllers/compras/ComprasController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
import { requireRole } from "../../middlewares/RoleMiddleware.js"
import { validateSchema } from "../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../validators/CommonValidators.js"
import { listComprasQuerySchema, payCompraSchema } from "../../validators/compras/ComprasValidators.js"

export const comprasRouter = Router()

comprasRouter.use(authenticate)
comprasRouter.use(requireRole("cliente"))
comprasRouter.post("/", ComprasController.create)
comprasRouter.post("/:id/pagar", validateSchema(idParamSchema, "params"), validateSchema(payCompraSchema, "body"), ComprasController.pagar)
comprasRouter.get("/mias", validateSchema(listComprasQuerySchema, "query"), ComprasController.list)
comprasRouter.get("/:id", validateSchema(idParamSchema, "params"), ComprasController.getById)
