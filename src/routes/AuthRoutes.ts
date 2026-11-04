import { Router } from "express"
import { AuthController } from "../controllers/AuthController.js"
import { authenticate } from "../middlewares/AuthMiddleware.js"
import { validateSchema } from "../middlewares/ValidateSchema.js"
import { loginSchema, registerSchema } from "../validators/AuthValidators.js"

export const authRouter = Router()
authRouter.post("/register", validateSchema(registerSchema, "body"), AuthController.register)
authRouter.post("/login", validateSchema(loginSchema, "body"), AuthController.login)
authRouter.get("/me", authenticate, AuthController.me)
