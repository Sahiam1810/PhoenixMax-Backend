import { Router } from "express"
import { ProductosController } from "../../controllers/productos/ProductosController.js"
import { validateSchema } from "../../middlewares/ValidateSchema.js"
import { idParamSchema } from "../../validators/CommonValidators.js"
import { productosQuerySchema } from "../../validators/productos/ProductosValidators.js"
export const productosRouter = Router()
productosRouter.get("/", validateSchema(productosQuerySchema, "query"), ProductosController.list)
productosRouter.get("/:id", validateSchema(idParamSchema, "params"), ProductosController.detail)
