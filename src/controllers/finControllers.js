const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const fin = ((req, res) => {

    const lcDerecho = req.groups;
    
    //console.log(lcDerecho.indexOf(",SIP,"))
    
    if (lcDerecho.indexOf(",FINANZAS,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("fin/fin", {lcDerecho, skin:req.skin})
});


const fin_orde_comp = (async (req, res) => {
    
    if (req.groups.indexOf(",ORDE_COMP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT p.user_id, p.id_cent, c.campus, c.descrip
	    FROM gen_dere_proy p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
    	WHERE p.user_id = ?

    `
    const rows = await util.gene_cons(lcSQL, [req.userId])
    
    return res.render("fin/fin_orde_comp", {rows, skin:req.skin})
});

const fin_norde_comp = (async (req, res) => {
    
    if (req.groups.indexOf(",ORDE_COMP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT c.id_cent, c.dependen, c.campus, p.proyecto, p.fondo, p.nombre
	FROM fin_proyecto p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
	WHERE p.id_cent IN 
		(SELECT id_cent 
			FROM gen_dere_proy
			WHERE user_id = ?)
			ORDER BY c.campus, p.fondo, p.proyecto
    `
    const rows = await util.gene_cons(lcSQL, [req.userId])
    
    return res.render("fin/fin_norde_comp", {rows, skin:req.skin})
});

module.exports = {
    fin,
    fin_orde_comp,
    fin_norde_comp
}