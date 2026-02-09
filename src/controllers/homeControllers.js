const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const { cacheUsuarios } = require("../middlewares/authjwt");

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
    res.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Mismo valor que al crear
            sameSite: 'strict', // Mismo valor que al crear
            // path: '/' // (Si usaste path, inclúyelo aquí)            
        }).clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Mismo valor que al crear
            sameSite: 'strict', // Mismo valor que al crear
            // path: '/' // (Si usaste path, inclúyelo aquí)            
        });

    cacheUsuarios.delete(req.userId);

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
    return res.render("usua_nuev", {rows})
});


const otro_equi = (async(req, res) => {
    return res.render("otro_equi")
});

const prin_ca_pa = (async (req, res) => {
    
    lcSQL = `
    SELECT nombre, correo, dn 
        FROM passfile 
        WHERE user_id = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.userId])

    if (rows.length <= 0){
        return res.render("sin_derecho");
    }
    const winId = req.query.winId;
    
    console.log(winId)
    res.render("prin_ca_pa", {rows, winId})
    
});

const dere_unic = (async (req, res) => {
    
    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
    SELECT cve, depen 
	    FROM gen_tipo_ofic
    `
    const rows = await util.gene_cons(lcSQL)

    lcSQL = `
    SELECT o.cve, o.depen, if(d.titular = 1, "SI", "NO") AS titular
        FROM gen_tipo_ofic o INNER JOIN gen_dere_ofic d ON o.cve = d.cve 
        WHERE d.user_id = ?

    `
    const rowsd = await util.gene_cons(lcSQL, req.userId)

    res.render("dere_unic", {rows, rowsd})
});

module.exports = {
    logout,
    intro,
    sin_derecho,
    principal,
    usuarios,
    usua_nuev,
    otro_equi,
    prin_ca_pa,
    dere_unic,
}