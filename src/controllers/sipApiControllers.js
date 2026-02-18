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


const sip_soli_progx = (async (req, res) => {
    if (req.groups.indexOf(",SIP_SOLI_PROG,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY s.numero) AS rank, s.id, s.numero, d.siglas, n.nivel, m.modalidad, s.revisor, s.programa, s.sede_hosp, np.nivel_pnpc, s.vali_snp, 
		s.referencia, s.part_snp_2025, s.estado, s.snp_2025, s.esta_letr, s.grad_otor, s.conv_cola, s.vigencia, 
		s.area_disc, s.duracion, s.cale_crea, s.dict_crea, DATE_FORMAT(s.fech_crea, "%d/%m/%Y") AS fech_crea
	FROM sip_soli_prog s
		LEFT JOIN progap_dependencias d ON s.id_centro_universitario = d.id
		LEFT JOIN sip_nivel n ON s.id_nivel = n.id
		LEFT JOIN sip_modalidad m ON s.id_modalidad = m.id
		LEFT JOIN sip_nivel_pnpc np ON s.id_nivel_pnpc = np.id
    ORDER BY s.numero
    `

    console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

module.exports = {
    sip_soli_progx
}