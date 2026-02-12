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

    let lcSQL = `
    SELECT c.id_cent, c.dependen, c.campus, p.proyecto, p.fondo, p.nombre
	FROM fin_proyecto p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
	WHERE p.id_cent IN 
		(SELECT id_cent 
			FROM gen_dere_proy
			WHERE user_id = ?)
			ORDER BY c.campus, p.fondo, p.proyecto
    `
    const rows = await util.gene_cons(lcSQL, [req.userId])


    lcSQL = `
    SELECT o.id as id_orde_comp, o.tipo_orde, o.fech_emis, o.proyecto, o.rfc, o.proveedor, o.domi_prov, 
					o.tele_prov, o.corr_prov, o.fech_entr, o.luga_entr, o.forma_pago, o.porc_anti, o.fech_inic, o.fech_fin, o.nume_parc, 
					o.subtotal, o.iva_total, o.total, o.observaciones, o.estatus, o.fech_crea
        FROM fin_orde_comp o INNER JOIN fin_proyecto p on o.proyecto = p.proyecto
            LEFT join gen_centros c ON p.id_cent = c.id_cent
        WHERE o.id = ?
    `
    //console.log(req.query.lnID)
    const rows2 = await util.gene_cons(lcSQL, [req.query.lnID])
    //console.log(rows2)

    lcSQL = `
    SELECT id, articulo, cantidad, unidad, cost_unit, tasa_iva, cantidad*cost_unit AS subtotal, 
            cantidad*cost_unit*(tasa_iva/100) AS montoiva, cantidad*cost_unit*(1+(tasa_iva/100)) AS total
        FROM fin_dorde_comp 
        WHERE id_orde_comp = ?
    `
    const rows3 = await util.gene_cons(lcSQL, [req.query.lnID])

    return res.render("fin/fin_norde_comp", {rows, rows2, rows3, skin:req.skin})
});

module.exports = {
    fin,
    fin_orde_comp,
    fin_norde_comp
}