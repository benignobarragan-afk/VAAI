const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));


const progap = ((req, res) => {

    const lcDerecho = req.groups;
    console.log(lcDerecho.indexOf(",PROGAP,"))
    if (lcDerecho.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("PROGAP/progap", {lcDerecho})
});

const progap_dashboard = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL);
    
    return res.render("progap/progap_dashboard", {rows})
});

const progap_cata = ((req, res) => {

    const lcDerecho = req.groups;

    if (lcDerecho.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("PROGAP/progap_cata", {lcDerecho})
});

const progap_usuario = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_usuario", {rows})
});

const progap_directivo = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT cargo AS id, cargo AS nombre 
        FROM  progap_altos_mandos
        GROUP BY cargo
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_directivo", {rows})
});

const progap_estudia = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_estudia", {rows})
});

const progap_convoca = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    return res.render("progap/progap_convoca")
});

const progap_exacam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_exacam", {rows})
});

const progap_focam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_focam", {rows})
});


module.exports = {
    progap,
    progap_dashboard,
    progap_cata,
    progap_usuario,
    progap_directivo,
    progap_estudia,
    progap_convoca,
    progap_exacam,
    progap_focam,
}
