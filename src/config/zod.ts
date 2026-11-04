import { z } from "zod"

z.setErrorMap((issue) => ({ message: issue.code === "invalid_type" ? "Tipo de dato inválido" : "Dato inválido" }))

export { z }
