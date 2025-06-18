/**
 * Middleware para validar el token en las peticiones.
 * @param req - Objeto de solicitud
 * @param res - Objeto de respuesta
 * @param next - Función para pasar al siguiente middleware
 */
export const validateToken = (req:any, res:any, next:any) => {
    // GET token form header
    // const authHeader = req.headers['x-tb'];
    const token = req.headers['x-tkn'];


    // Verificar si el token está presente en los headers
    if (!token) {
    return res.status(401).json(
        { error: "Token not provided" }
    );
    }

    // const [bearer, token] = authHeader.split(" "); // Separar "Bearer" del token

    if (token !== process.env.TOKEN) {
    return res.status(401).json(
        { error: "Invalid token" });
    }

    next(); // Token válido, continúa al siguiente middleware
};