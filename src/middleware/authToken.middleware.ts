/**
 * Middleware para validar el token en las peticiones.
 * @param req - Objeto de solicitud
 * @param res - Objeto de respuesta
 * @param next - Función para pasar al siguiente middleware
 */
export const validateToken = (req:any, res:any, next:any) => {
    // GET token form header
    // const authHeader = req.headers['Authorization'];
    const token = req.headers['x-auth-token'];

    // Verificar si el token está presente en los headers
    if (!token) {
        return res.status(401).json(
            {   
                status: 401,
                message: "Token is required",
                error: "Token not provided" 
            }
        );
    }

    if (token !== process.env.TOKEN) {
        return res.status(422).json(
            { 
                status: 422,
                message: "Unauthorized",
                error: "Invalid token",
                'x-auth-token': token,
                token: process.env.TOKEN || "Token not set in environment variables"
            }
        );
    }

    next(); // Token válido, continúa al siguiente middleware
};