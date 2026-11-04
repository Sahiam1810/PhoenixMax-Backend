import { Router } from "express"
import { CarritoController } from "../../controllers/carrito/CarritoController.js"
import { authenticate } from "../../middlewares/AuthMiddleware.js"
export const carritoRouter = Router()
carritoRouter.use(authenticate)
carritoRouter.get("/", CarritoController.get).post("/", CarritoController.add).patch("/:itemId", CarritoController.update).delete("/:itemId", CarritoController.remove).delete("/", CarritoController.clear)
