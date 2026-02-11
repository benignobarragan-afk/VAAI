const path = require("path")
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
    //console.log(lcSQL)   
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
    
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)
});

const cmb_progap_depe = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']
    
    const lcWhere = util.cade_busc('siglas,dependencia', lcBusca)
    //console.log(lcWhere)

    const lcSQL = `
        SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
            FROM progap_dependencias
            WHERE id_antecesor = 0 and ${lcWhere.sql}
            LIMIT 20
    ` 
    //console.log(lcSQL)  
    //console.log(lcWhere.params) 
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    //console.log(rows)
    res.json(rows)
});

const cmb_progap_prog = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']
    
    const lcWhere = util.cade_busc('nivel,programa', lcBusca)
    //console.log(lcWhere)

    const lcSQL = `
        SELECT  id, clave_cgipv, programa, concat('(',clave_cgipv ,') ', programa) as value 
            FROM progap_programa
            WHERE ${lcWhere.sql}
            LIMIT 20
    ` 
    //console.log(lcSQL)   
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    //console.log(rows)
    res.json(rows)
});

const cmb_prov = (async (req,res) => {
    
    const lcBusca = req.query['filter[value]']

    const lcWhere = util.cade_busc((req.query.lnTipo == 1?'rfc':'proveedor'), lcBusca)

    console.log(lcWhere)

    const lcSQL = `
        SELECT  rfc, proveedor, domi_prov, tele_prov, corr_prov, CONCAT('(',rfc,') ', proveedor) as value 
            FROM fin_orde_comp
            WHERE ${lcWhere.sql}
            GROUP BY rfc, proveedor, domi_prov, tele_prov, corr_prov 
            LIMIT 20
    ` 
    //console.log(lcSQL)   
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    //console.log(rows)
    res.json(rows)
});


module.exports = {
    cmb_depew,
    cmb_persw,
    cmb_progap_depe,
    cmb_progap_prog,
    cmb_prov
}