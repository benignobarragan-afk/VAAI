const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
//const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));
const oplantilla = require(path.join(__dirname, "..", "utils/plantilla_pdf"));
const PDFDocument = require("pdfkit-table");
const fs = require('fs');
const { cacheUsuarios } = require("../middlewares/authjwt");


const fin_orde_compx = (async (req, res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    let parameters = []
    let lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.foli_orde) AS RANK, o.id, o.tipo_orde, o.fech_emis, o.proyecto, o.rfc, o.proveedor, o.domi_prov, 
					o.tele_prov, o.corr_prov, o.fech_entr, o.luga_entr, o.forma_pago, o.porc_anti, o.fech_inic, o.fech_fin, o.nume_parc, 
					o.subtotal, o.iva_total, o.total, o.observaciones, o.estatus, o.fech_crea
        FROM fin_orde_comp o INNER JOIN fin_proyecto p on o.proyecto = p.proyecto
            LEFT join gen_centros c ON p.id_cent = c.id_cent
        ORDER BY o.foli_orde
    `
    if (!!req.query.anio){
        lcSQL = lcSQL + " WHERE YEAR(o.fech_emis) = ? "
        parameters.push(req.query.lnConv);
    }

    const rows = await util.gene_cons(lcSQL, parameters)
    return res.json(rows)
});


const fin_norde_compx2 = (async (req, res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0 || !req.body.proyecto)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
    SELECT p.proyecto, c.cve_conv, c.descrip, c.dependen, c.telefono, c.direccion
	    FROM fin_proyecto p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
	    WHERE p.proyecto = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.proyecto])

    return res.json(rows[0])

});

const fin_norde_compx = (async (req,res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const encabezado = JSON.parse(req.body.encabezado)
    const detalle = JSON.parse(req.body.detalles)
    let insertD = []

    console.log(detalle)

    if (!encabezado.id_orde_comp || encabezado.id_orde_comp <= 0){
        lcSQL = `
        INSERT INTO fin_orde_comp (tipo_orde, fech_emis, proyecto, rfc, proveedor, domi_prov, tele_prov, corr_prov, fech_entr, luga_entr, forma_pago,
	            porc_anti, fech_inic, fech_fin, nume_parc, subtotal, iva_total, total, observaciones, estatus, fech_crea, cambios) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0, NOW(), CONCAT(?,'|INSERT|',NOW(),CHR(13)))
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones, req.userId]

        const insert = await util.gene_cons(lcSQL, laSend)
        
        console.log(insert.insertId)

        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, precio, iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [insert.insertId, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].precio, detalle[i].iva])
        }

        return res.json({"status" : "success", "message": "La orden se guardo exitosamente, recuerda que aun no se genera", id:insert.insertId})

    }

    if(encabezado.id_orde_comp > 0){
        lcSQL = `
        UPDATE fin_orde_comp  SET tipo_orde = ?, fech_emis = ?, proyecto = ?, rfc = ?, proveedor = ?, domi_prov = ?, tele_prov = ?, corr_prov = ?, 
                fech_entr = ?, luga_entr = ?, forma_pago = ?, porc_anti = ?, fech_inic = ?, fech_fin = ?, nume_parc = ?, subtotal = 0, iva_total = 0, total = 0, 
                observaciones = ?, cambios = CONCAT(IFNULL(cambios,''), ?,'|UPDATE|',NOW(),CHR(13)) 
            WHERE id = ?
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones, req.userId, encabezado.id_orde_comp]

        const update = await util.gene_cons(lcSQL, laSend)

        const deleted = await util.gene_cons("DELETE FROM fin_dorde_comp WHERE id_orde_comp = ?", [encabezado.id_orde_comp])
        
        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, cost_unit, tasa_iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [encabezado.id_orde_comp, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].cost_unit, detalle[i].tasa_iva])
        }


        return res.json({"status" : "success", "message": "El registro se actualizo exitosamente, recuerda que aun no se generas la orden"})
    }

    





});

module.exports = {
    fin_orde_compx,
    fin_norde_compx2,
    fin_norde_compx
}