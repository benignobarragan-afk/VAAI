const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));


const intro = (async (req, res) => {
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups
    let rows = {}

    try {
        conn = await pool.getConnection();
        
        // 3. Ejecutar la consulta

        const lcSQL = `
        SELECT min(orden) as orden, nombre, ruta, icono 
            FROM gen_menu WHERE LOCATE(derecho, '${lcGROUPS}') > 0 
            GROUP BY nombre, ruta, icono 
            ORDER BY MIN(orden)
        `
        rows = await conn.query(lcSQL, [1]);
        console.log(rows);

    } catch (err) {
        console.log(err)
        res.json({err})
        throw err;
    } finally {
        // 4. Devolver la conexión al pool (¡Muy Importante!)
        if (conn) conn.release(); 
    }

    console.log(rows)
    res.render("intro", {lcNombre,rows})
});


const logout = ((req, res) => {
    
    const nombreCookie = 'access_token';

    // 1. Llamar a res.clearCookie()
    // Debes especificar el mismo 'path' (ruta) que usaste al crearla.
    // Si no especificaste 'path' al crearla, no es necesario aquí.
    res.clearCookie(nombreCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Mismo valor que al crear
        sameSite: 'strict', // Mismo valor que al crear
        // path: '/' // (Si usaste path, inclúyelo aquí)
    });

    // 2. Enviar una respuesta al cliente
    //res.status(200).json({ 
    //    ok: true,
    //    mensaje: "Sesión cerrada. Cookie eliminada." 
    //});
    return res.render("login");
});

const sin_derecho = ((req, res) => {
    res.render("sin_derecho")
});


module.exports = {
    logout: logout,
    intro: intro,
    sin_derecho
}