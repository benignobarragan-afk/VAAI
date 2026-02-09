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

    res.render("fin/fin", {lcDerecho})
});


const fin_orde_comp = (async (req, res) => {
    
    if (req.groups.indexOf(",ORDE_COMP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("fin/fin_orde_comp", {rows})
});


module.exports = {
    fin,
    fin_orde_comp
}