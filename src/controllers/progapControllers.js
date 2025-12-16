const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));


const progap = ((req, res) => {
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("PROGAP/progap", {lcDerecho})
});

const progap_dashboard = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
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


module.exports = {
    progap,
    progap_dashboard,
}
