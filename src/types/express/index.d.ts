import type { AuthUser } from "../../interfaces/User.js"

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

export {}
