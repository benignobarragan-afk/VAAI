const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const outil = require(path.join(__dirname, "..", "utils/other_utils"));

const usua_nuevx = (async (req, res) => {

    //console.log(req.body)
    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    if (!req.body.txtCodigo){
        return res.json({"error":true, "mensage":"No se agrego el código"})
    }

    if (!req.body.txtApellidos && !req.body.txtNombre){
        const lcSQL = `
        SELECT CONCAT(apepat, ' ', apemat) AS apellidos, nombre 
            FROM gen_personas 
            WHERE codigo = ${req.body.txtCodigo} 
        `    
        const rows = await util.gene_cons(lcSQL)
        
        if(rows.length <= 0){
            return res.json({"error":true, "mensage":"No se contro el código en la base de la U. de G."})
        }
        req.body.txtApellidos = rows[0].apellidos;
        req.body.txtNombre = rows[0].nombre;
        req.body.txtUser_id = req.body.txtCodigo;
    }

    req.body.txtPassword = outil.gene_cont(req.body.txtNombre + ' ' + req.body.txtApellidos, req.body.txtCodigo)

    //console.log(req.body)

    return res.json({"error":false, "mensage":"El password se generó correctamente", form:req.body})
});

const usua_nuevx2 = (async (req, res) => {

    let lcSQL = `
        SELECT *
            FROM passfile 
            WHERE user_id = ${req.body.txtUser_id} 
        `    
        const rows = await util.gene_cons(lcSQL)
        
    if(rows.length > 0){
        return res.json({"error":true, "mensage":"El usuario ya se encuentra registrado"})
    }

    //console.log(req.body)

     lcSQL = `
        INSERT INTO passfile (user_id, password, codigo, id_cent, nombre, dn, \`groups\`, correo, acceso)
            VALUES ('${req.body.txtUser_id}', '${req.body.txtPassword}', ${req.body.txtCodigo}, ${(!req.body.txtServicio ? '0' : req.body.txtServicio)},
            '${req.body.txtApellidos + ' ' + req.body.txtNombre}', '"DN "${req.body.txtApellidos + ' "DN "' + req.body.txtNombre}',
            '${(!req.body.txtDerecho ? '' : req.body.txtDerecho)}', '${(!req.body.txtCorreo ? '' : req.body.txtCorreo)}', UUID())
        `    

    //console.log(lcSQL)
    const insert = await util.gene_cons(lcSQL)
    
    if (req.body.txtCorreo.length > 0){

    const lcTexto = req.body.txtNombre + ' ' + req.body.txtApellidos + ',' + req.body.txtUser_id + ',' + req.body.txtPassword
    const laCampos = lcTexto.split(',');

        lcResp = outil.envi_corr(2, req.body.txtCorreo, laCampos);
    }
    
    return res.json({"error":false, "mensage":"El usuario se registro exitomente"})
});

const gene_menu = (async (req, res) => {

    const lcGROUPS = req.groups;

    const lcSQL = `
    SELECT min(orden) as orden, nombre, ruta, icono, submenu  
        FROM gen_menu WHERE LOCATE(derecho, '${lcGROUPS}') > 0 
        GROUP BY nombre, ruta, icono, submenu
        ORDER BY MIN(orden), submenu DESC
    `
    const rows = await util.gene_cons(lcSQL);
    

    let lnOrden = -1
	let loHijo = [], loMenu = []
			
    for (i = 0; i < rows.length; i++){
        if (!!rows[i].submenu){
            loHijo.push({id:rows[i].ruta, value:rows[i].nombre, icon:rows[i].icono})
        }
        if (lnOrden != rows[i].orden && !rows[i].submenu){
        
        loMenu.push({id:rows[i].ruta, value:rows[i].nombre, icon:rows[i].icono, data:loHijo})
            loHijo = [];
            lnOrden = rows[i].orden;
        }
    }

    //console.log(loMenu)
    return res.json(loMenu)

});

module.exports = {
    usua_nuevx,
    usua_nuevx2,
    gene_menu,
}