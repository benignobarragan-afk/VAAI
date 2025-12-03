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

module.exports = {
    usua_nuevx
}