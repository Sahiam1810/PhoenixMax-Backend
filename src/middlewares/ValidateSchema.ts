import type { NextFunction, Request, Response } from "express"
import type { ZodType } from "zod"

export const validateSchema = (schema: ZodType, location: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[location])
    if (!result.success) {
        const errors: Record<string, string[]> = {}
        for (const issue of result.error.issues) {
            const field = issue.path.join(".") || "general"
            errors[field] = [...(errors[field] ?? []), issue.message]
        }
        res.status(400).json({ error: "Datos inválidos", errors })
        return
    }
    if (location === "body") req.body = result.data
    else res.locals[location] = result.data
    next()
}
