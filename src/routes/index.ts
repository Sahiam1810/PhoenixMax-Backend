import { Router } from "express"
import { sequelize } from "../config/database.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { authRouter } from "./AuthRoutes.js"
import { carritoRouter } from "./carrito/CarritoRoutes.js"
import { comprasRouter } from "./compras/ComprasRoutes.js"
import { plataformasRouter } from "./plataformas/PlataformasRoutes.js"
import { productosRouter } from "./productos/ProductosRoutes.js"
import { serviciosRouter } from "./servicios/ServiciosRoutes.js"
import { adminCuentasRouter } from "./admin/cuentas/CuentasRoutes.js"
import { adminComprasRouter } from "./admin/compras/AdminComprasRoutes.js"
import { adminCronRouter } from "./admin/cron/AdminCronRoutes.js"
import { adminPlataformasRouter } from "./admin/plataformas/AdminPlataformasRoutes.js"
import { adminProductosRouter } from "./admin/productos/AdminProductosRoutes.js"
import { adminResumenRouter } from "./admin/resumen/AdminResumenRoutes.js"
import { authenticate } from "../middlewares/AuthMiddleware.js"
import { requireRole } from "../middlewares/RoleMiddleware.js"

export const apiRouter = Router()

apiRouter.get("/health", async (_req, res) => {
    try {
        await sequelize.authenticate()
        ApiResponse.success(res, { database: "connected" }, "Servicio disponible")
    } catch {
        res.status(503).json({ error: "Base de datos no disponible" })
    }
})

apiRouter.use("/auth", authRouter)
apiRouter.use("/plataformas", plataformasRouter)
apiRouter.use("/productos", productosRouter)
apiRouter.use("/carrito", carritoRouter)
apiRouter.use("/compras", comprasRouter)
apiRouter.use("/servicios", serviciosRouter)
apiRouter.use("/admin", authenticate, requireRole("admin"))
apiRouter.use("/admin/cuentas", adminCuentasRouter)
apiRouter.use("/admin/plataformas", adminPlataformasRouter)
apiRouter.use("/admin/productos", adminProductosRouter)
apiRouter.use("/admin/compras", adminComprasRouter)
apiRouter.use("/admin/resumen", adminResumenRouter)
apiRouter.use("/admin/cron", adminCronRouter)
