const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const sip = ((req, res) => {

    const lcDerecho = req.groups;
    
    //console.log(lcDerecho.indexOf(",SIP,"))
    
    if (lcDerecho.indexOf(",SIP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("sip/sip", {lcDerecho, skin:req.skin})
});


const sip_soli_prog = (async (req, res) => {
    
    if (req.groups.indexOf(",SIP_SOLI_PROG,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("sip/sip_soli_prog", {rows, skin:req.skin})
});

const sip_nsoli_prog = (async (req, res) => {
    
    if (req.groups.indexOf(",SIP_SOLI_PROG,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let rows = [], siiau = [], dictamen = [], lcSQL = ""

    if (req.query.lnID > 0){

        lcSQL = `
            SELECT s.id, s.numero, d.siglas, n.nivel, m.modalidad, s.revisor, s.programa, s.sede_hosp, np.nivel_pnpc, s.vali_snp, 
                s.referencia, s.part_snp_2025, s.estado, s.snp_2025, s.esta_letr, s.grad_otor, s.conv_cola, s.vigencia, 
                s.area_disc, s.duracion, s.cale_crea, s.dict_crea, DATE_FORMAT(s.fech_crea, "%d/%m/%Y") AS fech_crea
            FROM sip_soli_prog s
                LEFT JOIN progap_dependencias d ON s.id_centro_universitario = d.id
                LEFT JOIN sip_nivel n ON s.id_nivel = n.id
                LEFT JOIN sip_modalidad m ON s.id_modalidad = m.id
                LEFT JOIN sip_nivel_pnpc np ON s.id_nivel_pnpc = np.id
                WHERE s.id = ?
        `
        rows = await util.gene_cons(lcSQL, [req.query.lnID])

        console.log(rows)

        lcSQL = `
            SELECT ps.cve_siiau as id, ps.id as id_siiau, pps.orden, ps.cve_siiau, ps.nomb_siiau, n.nivel, ps.siglas_programa, ps.modalidad_grado, 
                ps.cve_programa, ps.cve_campodet, ps.cve_modalidad 
            FROM sip_prog_prog_siiau pps 
                LEFT JOIN sip_prog_siiau ps ON pps.cve_siiau = ps.cve_siiau
                LEFT JOIN sip_nivel n ON ps.cve_nivel = n.id
                WHERE pps.id_prog = ?
                ORDER BY pps.orden
        `
        console.log(lcSQL)

        siiau = await util.gene_cons(lcSQL, [req.query.lnID])

        lcSQL = `
            SELECT id, id_soli_prog, dictamen, if(ifnull(fe_errata,0)=1, 'SI', 'NO') as fe_errata, DATE_FORMAT(fecha, '%d/%m/%Y') as fecha, IFNULL(text_sesi, '') as text_sesi,
                    ruta_arch, cambios, if(ifnull(ruta_arch,'') = '', 0, id) as archivo
                FROM sip_soli_prog_dict 
                WHERE id_soli_prog = ?
        `
        dictamen = await util.gene_cons(lcSQL, [req.query.lnID])

        console.log(dictamen)

    }
    loEnvio = {rows, siiau, dictamen, skin:req.skin}

    return res.render("sip/sip_nsoli_prog", loEnvio)
});

const sip_materia = (async (req, res) => {
    
    if (req.groups.indexOf(",SIP_SOLI_PROG,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let rows = [], lcSQL = ""

    if (!!req.query.lnID  || req.query.lnID == ''){

        lcSQL = `
        SELECT area, clave, materia, cr, teo, pra, tipo, nivel, prereq, correq, departamento 
	        FROM sip_materia
            WHERE carrera = ?
        `
        rows = await util.gene_cons(lcSQL, [req.query.lnID])

        console.log(rows)
    }
    return res.render("sip/sip_materia", {rows, skin:req.skin})
});

module.exports = {
    sip,
    sip_soli_prog,
    sip_nsoli_prog,
    sip_materia
}