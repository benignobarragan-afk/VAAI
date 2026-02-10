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
    SELECT ROW_NUMBER() OVER (ORDER BY o.foli_orde) AS RANK, o.*
        FROM fin_orde_comp o INNER JOIN gen_centros c ON o.id_cent = c.id_cent
        ORDER BY o.foli_orde
    `
    if (!!req.query.anio){
        lcSQL = lcSQL + " WHERE YEAR(o.fech_emis) = ? "
        parameters.push(req.query.lnConv);
    }

    const rows = await util.gene_cons(lcSQL, parameters)
    return res.json(rows)
});

module.exports = {
    fin_orde_compx,
}