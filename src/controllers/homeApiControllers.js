const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const outil = require(path.join(__dirname, "..", "utils/other_utils"));
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

const usua_nuevx = (async (req, res) => {

    //console.log(req.body)
    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    if (!req.body.txtCodigo){
        return res.json({"error":true, "mensage":"No se agrego el código"})
    }

    let lcSQL = `
        SELECT p.*, SUBSTRING_INDEX(SUBSTRING_INDEX(p.DN, '"', 3), '"', -1) AS apellidos, SUBSTRING_INDEX(p.DN, '"', -1) AS nombre, 
                concat('(', IFNULL(c.clave,''), ') ',  c.dependen) as value
            FROM passfile p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
            WHERE codigo = ? 
        `
    const passfile = await util.gene_cons(lcSQL, [req.body.txtCodigo])

    console.log(passfile);

    if (passfile.length > 0){

        req.body.txtApellidos = passfile[0].apellidos;
        req.body.txtNombre = passfile[0].nombre;
        req.body.txtUser_id = passfile[0].USER_ID;
        req.body.txtCorreo = passfile[0].CORREO;
        req.body.txtPassword = passfile[0].PASSWORD;
        req.body.txtServicio = passfile[0].id_cent;
        req.body.txtDerecho = passfile[0].GROUPS;
        req.body.txtValue = passfile[0].value;
        req.body.cmbServicio = passfile[0].id_cent;
        

        return res.json({"error":false, "mensage":"El usuario ya existe", form:req.body})
    }
    else {



        if (!req.body.txtApellidos && !req.body.txtNombre){
            lcSQL = `
            SELECT CONCAT(apepat, ' ', apemat) AS apellidos, nombre 
                FROM gen_personas 
                WHERE codigo = ?
            `    
            const rows = await util.gene_cons(lcSQL, [req.body.txtCodigo])
            
            if(rows.length <= 0){
                return res.json({"error":true, "mensage":"No se contro el código en la base de la U. de G."})
            }
            req.body.txtApellidos = rows[0].apellidos;
            req.body.txtNombre = rows[0].nombre;
            req.body.txtUser_id = req.body.txtCodigo;
        }

        req.body.txtPassword = outil.gene_cont(req.body.txtNombre + ' ' + req.body.txtApellidos, req.body.txtCodigo)

        //console.log(req.body)

        return res.json({"error":false, "mensage":"El password se generó correctamente", form:req.body, nuevo:1})
    }
});

const usua_nuevx2 = (async (req, res) => {

    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT * 
            FROM passfile 
            WHERE user_id = ?
        `    
    const rows = await util.gene_cons(lcSQL, [req.body.txtUser_id])

    let lcMensaje = "", parameters = []

    if(rows.length > 0){
        lcSQL = `
        UPDATE passfile SET password = ?, codigo = ?, id_cent = ?, nombre = ?, dn = ?, \`groups\` = ?, correo = ?, 
            cambios = CONCAT(IFNULL(cambios,''),CHAR(13,10),'UPDATE|',?,'|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I')) WHERE user_id = ?
        `
        lcMensaje = "El usuario se actualizo correctamente"

        parameters = [req.body.txtPassword, req.body.txtCodigo, (!req.body.cmbServicio ? '0' : req.body.cmbServicio),
            req.body.txtApellidos + ' ' + req.body.txtNombre, '"DN "' + req.body.txtApellidos + ' "DN "' + req.body.txtNombre,
            (!req.body.txtDerecho ? '' : req.body.txtDerecho), (!req.body.txtCorreo ? '' : req.body.txtCorreo), req.userId, req.body.txtUser_id
        ]

    }
    else 
    {
        lcSQL = `
        INSERT INTO passfile (user_id, password, codigo, id_cent, nombre, dn, \`groups\`, correo, acceso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, UUID())
        `
        lcMensaje = "El usuario se registro exitomente"

        parameters = [req.body.txtUser_id, req.body.txtPassword, req.body.txtCodigo, (!req.body.cmbServicio ? '0' : req.body.cmbServicio), 
            req.body.txtApellidos + ' ' + req.body.txtNombre, '"DN "' + req.body.txtApellidos + ' "DN "' + req.body.txtNombre, 
            (!req.body.txtDerecho ? '' : req.body.txtDerecho), (!req.body.txtCorreo ? '' : req.body.txtCorreo)
        ]
    }

    const insert = await util.gene_cons(lcSQL, parameters)
    //console.log(lcSQL)
    
    
    if (rows.length <= 0 && req.body.txtCorreo.length > 0){

        const lcTexto = req.body.txtNombre + ' ' + req.body.txtApellidos + ',' + req.body.txtUser_id + ',' + req.body.txtPassword
        const laCampos = lcTexto.split(',');

        lcResp = outil.envi_corr(2, req.body.txtCorreo, laCampos);
    }
    
    return res.json({"error":false, "mensage":lcMensaje})
});

const usua_nuevx3 = (async (req, res) => {

    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT *, SUBSTRING_INDEX(SUBSTRING_INDEX(DN, '"', 3), '"', -1) AS apellidos, SUBSTRING_INDEX(DN, '"', -1) AS nombre
            FROM passfile 
            WHERE user_id = ${req.body.txtUser_id} 
        `    
    const rows = await util.gene_cons(lcSQL)

    lcMensaje = (rows.length > 0?(rows[0].CORREO.length > 0?"El correo se enviará al usuario":"El usuario no tiene correo"):"No se econtro el usuario")

    const lcTexto = rows[0].nombre + ' ' + rows[0].apellidos + ',' + rows[0].USER_ID + ',' + rows[0].PASSWORD
    const laCampos = lcTexto.split(',');

    lcResp = outil.envi_corr(2, rows[0].CORREO, laCampos);
    
    return res.json({"error":false, "mensage":lcMensaje})
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


const usuariosx = (async (req, res) => {

    if (req.groups.indexOf(",ALTA_USUA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcWhere = '', parameters = []
    if(!!req.query.txtCodigo){
        lcWhere += (lcWhere.length > 0 ? " AND " : "") + "p.user_id LIKE ?";
        parameters.push(`%${req.query.txtCodigo}%`);
    }

    if (!!req.query.txtNombre){
        /* lcWhere = lcWhere + (lcWhere.length > 0?" AND ":"") + util.cade_busc("p.nombre", req.query.txtNombre) */
        lcWhere += (lcWhere.length > 0 ? " AND " : "") + "p.nombre LIKE ?";
        parameters.push(`%${req.query.txtNombre}%`);
    }
    if (!!req.query.txtDepen){
        /* lcWhere = lcWhere + (lcWhere.length > 0?" AND ":"") + util.cade_busc("c.dependen", req.query.txtDepen) */
        lcWhere += (lcWhere.length > 0 ? " AND " : "") + "c.dependen LIKE ?";
        parameters.push(`%${req.query.txtDepen}%`);
    }

    const lcSQL = `
    SELECT p.user_id as id, p.user_id, p.codigo, p.nombre, p.correo, c.dependen, DATE_FORMAT(p.last_hit, "%d/%m/%Y %H:%i") as last_hit
        FROM passfile p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
        ${(lcWhere.length > 0?'WHERE ' + lcWhere:'')}
    `
    console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, parameters)
    return res.json(rows)

});

const prin_ca_pax = (async (req, res) => {

    let lcSQL = `
    SELECT nombre, correo, dn, password 
        FROM passfile 
        WHERE user_id = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.userId])

    if (rows.length <= 0){
        return res.json([{"status":false, "message":"No se pudo localizar el usuario"}])
    }

    if(req.body.txtPassword_old != rows[0].password){
        return res.json([{"status":false, "message":"El password no es igual al actual"}])
    }

    //console.log(req.body.txtPassword_new)
    //console.log(rows[0].nombre)

    const result = await outil.vali_Pass(req.body.txtPassword_new, rows[0].nombre)

    //console.log(result)
    
    if (!result.valida){
        return res.json([{"status":false, "message":result.mensaje}])
    }

    lcSQL = `
    UPDATE passfile 
        SET password = ?
        WHERE user_id = ?
    `

    const update = await util.gene_cons(lcSQL, [req.body.txtPassword_new, req.userId])

    return res.json([{"status":true, "message":"El password se cambio correctamente"}])

});

const camb_skin = (async (req, res) => {

//    console.log(req.body.tema)
    lcSQL = `
    UPDATE passfile 
        SET skin = ?
        WHERE user_id = ?
    `
    const update = await util.gene_cons(lcSQL, [req.body.tema, req.userId])

    let datosUsuario = midd.cacheUsuarios.get(req.userId);

    datosUsuario.skin = (req.body.tema > 0?req.body.tema:'')
    midd.cacheUsuarios.set(req.userId, datosUsuario);

    return res.json({});
});

const dere_unicx = (async (req, res) => {

    //console.log(req.body.checked);
    let lcSQL = '', params = [], rows = [], rowsd = [], rowsi = []
    const lcUsuario = req.body.userSerch;
    const laMarcado = JSON.parse(req.body.checked);
    const placeholders = laMarcado.map(() => '?').join(',');

    switch (req.body.lcDere) {
    
        case 'oficio':
            // Proceso para oficio
            console.log("Procesando oficio...");
            // ¡IMPORTANTE! Siempre pon 'break' al final de cada caso
            lcSQL = `
            UPDATE gen_dere_ofic
                SET cambio = concat(IFNULL(cambio, ''),"DELETE|", ?, '|', NOW())
                WHERE user_id = ? and cve NOT IN (${placeholders})
            `
            params = [req.userId, lcUsuario, ...laMarcado];

    
            rows = await util.gene_cons(lcSQL, params)

            lcSQL = `
            DELETE FROM gen_dere_ofic
                WHERE user_id = ? and cve NOT IN (${placeholders})
            `
            params = [lcUsuario, ...laMarcado];
            rowsd = await util.gene_cons(lcSQL, params)

            lcSQL = `
            INSERT INTO gen_dere_ofic (user_id, cve, cambio)
                SELECT ?, cve, concat("INSERT|", ?, '|', NOW(), CHR(10)) 
                    FROM gen_tipo_ofic 
                        WHERE cve IN (${placeholders})
                        and cve not in (SELECT cve 
                                        FROM gen_dere_ofic 
                                        WHERE user_id = ?)
            `
            params = [lcUsuario, req.userId, ...laMarcado, lcUsuario];
            rowsi = await util.gene_cons(lcSQL, params)
            
            //console.log(rows)
            return res.json({
                "error": false, 
                "mensage": "Se guardaron los cambios de oficialia"
            });
            break;

        case 'progap':
            // Proceso para progap
            console.log("Procesando progap...");
            
            lcSQL = `
            UPDATE gen_dere_progap
                SET cambio = concat(IFNULL(cambio, ''),"DELETE|", ?, '|', NOW())
                WHERE user_id = ? and id NOT IN (${placeholders})
            `
            params = [req.userId, lcUsuario, ...laMarcado];

    
            rows = await util.gene_cons(lcSQL, params)

            lcSQL = `
            DELETE FROM gen_dere_progap
                WHERE user_id = ? and id NOT IN (${placeholders})
            `
            params = [lcUsuario, ...laMarcado];
            rowsd = await util.gene_cons(lcSQL, params)

            lcSQL = `
            INSERT INTO gen_dere_progap (user_id, id, cambio)
                SELECT ?, id, concat("INSERT|", ?, '|', NOW(), CHR(10)) 
                    FROM progap_dependencias 
                        WHERE id IN (${placeholders})
                        and id not in (SELECT id 
                                        FROM gen_dere_progap 
                                        WHERE user_id = ?)
            `
            params = [lcUsuario, req.userId, ...laMarcado, lcUsuario];
            rowsi = await util.gene_cons(lcSQL, params)
            
            //console.log(rows)
            return res.json({
                "error": false, 
                "mensage": "Se guardaron los cambios de progap"
            });
            break;

        default:
            // Este es el equivalente al 'OTHERWISE' de FoxPro
            return res.json({
                "error": true, 
                "mensage": "Error al insertar en la tabla: Opción no válida"
            });
    }
    
});

module.exports = {
    usua_nuevx,
    usua_nuevx2,
    usua_nuevx3,
    gene_menu,
    usuariosx,
    prin_ca_pax,
    camb_skin,
    dere_unicx,
}