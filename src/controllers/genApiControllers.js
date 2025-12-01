const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));



const cmb_depew = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']
    const lnTipo = req.query.lnTipo
    
    const lcWhere = util.construirClausulaBusqueda(lcBusca,lnTipo)
    //console.log(lcWhere)

    const lcSQL = `
        SELECT  id_cent as id, clave, descrip, concat('(', IFNULL(${lnTipo ==='2' ? 'clave': 'IFNULL(campus, clave)'},''), ') ',  dependen) as value, IFNULL(unid_consu, 0) as unid_consu 
            FROM ${lnTipo ==='2' ? 'gen_otro_cent': 'gen_centros'} 
            WHERE activo = 1 and ${lcWhere}
            LIMIT 20
    ` 
    console.log(lcSQL)   
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    res.json(rows)
});

const cmb_persw = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']
    const lnTipo = req.query.lnTipo
    
    if (!lcBusca){
        return res.json([]) 
    }

    const lcSQL = util.construirClausulaBusquedaP(lcBusca,lnTipo)
    //console.log(lcWhere)
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)
});


module.exports = {
    cmb_depew,
    cmb_persw
}