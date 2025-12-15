const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const intro = (async (req, res) => {
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups;
    
    //console.log(rows)
        
    res.render("intro", {lcNombre})
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

const principal = ((req, res) => {
    res.render("principal")
});

const usuarios = ((req, res) => {
    if (req.groups.indexOf(",USUARIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("usuarios")
});

const usua_nuev = (async(req, res) => {
    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = "SELECT * FROM `group`" 
    
    const rows = await util.gene_cons(lcSQL)

    console.log(rows)
    res.render("usua_nuev", {rows})
});



module.exports = {
    logout,
    intro,
    sin_derecho,
    principal,
    usuarios,
    usua_nuev
}