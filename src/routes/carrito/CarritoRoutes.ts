import { Router } from "express"
import { CarritoController } from "../../controllers/carrito/CarritoController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
import { requireRole } from "../../middlewares/RoleMiddleware.js"
import { validateSchema } from "../../middlewares/ValidateSchema.js"
import { addCarritoItemSchema, itemIdParamSchema, updateCarritoItemSchema } from "../../validators/carrito/CarritoValidators.js"

export const carritoRouter = Router()

carritoRouter.use(authenticate)
carritoRouter.use(requireRole("cliente"))
carritoRouter.get("/", CarritoController.get)
carritoRouter.post("/", validateSchema(addCarritoItemSchema, "body"), CarritoController.add)
carritoRouter.patch("/:itemId", validateSchema(itemIdParamSchema, "params"), validateSchema(updateCarritoItemSchema, "body"), CarritoController.updateCantidad)
carritoRouter.delete("/", CarritoController.clear)
carritoRouter.delete("/:itemId", validateSchema(itemIdParamSchema, "params"), CarritoController.removeItem)
