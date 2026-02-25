const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const { cacheUsuarios } = require("../middlewares/authjwt");
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));

const intro = (async (req, res) => {
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups;
    
    //console.log(req.userId)
    //console.log(req.skin)
        
    res.render("intro", {lcNombre, skin:req.skin})
});


const logout = ((req, res) => {
    
    const nombreCookie = 'access_token';

    // 1. Llamar a res.clearCookie()
    // Debes especificar el mismo 'path' (ruta) que usaste al crearla.
    // Si no especificaste 'path' al crearla, no es necesario aquí.
    other_utils.regi_even_segu(req.userId, 'LOG_OUT', req.ip)
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
    return res.render("login", {skin:req.skin});
});

const sin_derecho = ((req, res) => {
    res.render("sin_derecho")
});

const principal = (async (req, res) => {

    let lcSQL = `
    SELECT user_id, evento, date_format(fecha, "%d/%m/%Y") AS dia, ip_address, COUNT(*) as total
        FROM logs_seguridad 
        WHERE user_id = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        group BY 1,2,3,4
        ORDER BY fecha DESC 
    `

    const token = await util.gene_cons(lcSQL, req.userId);

    lcSQL = `
    SELECT DATE_FORMAT(fecha_visita, "%d/%m/%Y") AS dia, SUM(if(es_api = 0, 1, 0)) AS pagina, SUM(if(es_api = 1, 1, 0)) AS consulta, COUNT(*) AS total
        FROM log_visitas 
        WHERE usuario_id = ? AND fecha_visita >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        group BY 1
        ORDER BY fecha_visita  
    `
    const visitas = await util.gene_cons(lcSQL, req.userId);

    lcSQL = `
    SELECT 
        DATE_FORMAT(fecha_visita, "%d/%m/%Y") AS dia,
        CASE 
            -- Si solo hay una diagonal (ej. /usua_nuev), devolvemos 'home'
            WHEN CHAR_LENGTH(url) - CHAR_LENGTH(REPLACE(url, '/', '')) = 1 
            THEN 'home'
            
            -- Si tiene niveles (ej. /op/op_plan), extraemos lo que está entre la 1ra y 2da diagonal
            ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 2), '/', -1)
        END as apartado, COUNT(*) AS total, SUM(tiempo_respuesta_ms) AS tiempo
    FROM log_visitas 
    WHERE es_api = 0 and usuario_id = '2315513' AND fecha_visita >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    group BY 1,2
    ORDER BY 1 DESC 
    `

    const pagina = await util.gene_cons(lcSQL, req.userId);

        lcSQL = `
    SELECT 
        CASE 
            -- Si solo hay una diagonal (ej. /usua_nuev), devolvemos 'home'
            WHEN CHAR_LENGTH(url) - CHAR_LENGTH(REPLACE(url, '/', '')) = 1 
            THEN 'home'
            
            -- Si tiene niveles (ej. /op/op_plan), extraemos lo que está entre la 1ra y 2da diagonal
            ELSE SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 2), '/', -1)
        END as apartado, COUNT(*) AS total, SUM(tiempo_respuesta_ms)/100 AS tiempo
    FROM log_visitas 
    WHERE es_api = 0 and usuario_id = '2315513' AND fecha_visita >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    group BY 1
    ORDER BY 1 DESC 
    `

    const pagina_t = await util.gene_cons(lcSQL, req.userId);

    res.render("principal", {token, visitas, pagina, pagina_t, skin:req.skin})
});

const usuarios = ((req, res) => {
    if (req.groups.indexOf(",USUARIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("usuarios", {skin:req.skin})
});

const usua_nuev = (async(req, res) => {
    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = "SELECT * FROM `group`" 
    
    const rows = await util.gene_cons(lcSQL)

    console.log(rows)
    return res.render("usua_nuev", {rows, skin:req.skin})
});


const otro_equi = (async(req, res) => {
    return res.render("otro_equi", {skin:req.skin})
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
    res.render("prin_ca_pa", {rows, winId, skin:req.skin})
    
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

    res.render("dere_unic", {rows, rowsd, skin:req.skin})
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