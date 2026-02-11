const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const op_cucs = (async (req, res) => {
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    const lcSQL = `
    SELECT cve, depen as descrip, clave,
            (SELECT COUNT(*) as total FROM gen_oficio WHERE cve = t.cve AND IFNULL(status,0) < 3) as cant,
            (SELECT COUNT(*) AS MODI FROM gen_oficio WHERE cve = t.cve AND IFNULL(status,0) < 3 AND modificado = 1) AS modificado 
        FROM gen_tipo_ofic t
        WHERE cve in (SELECT DISTINCT cve FROM gen_dere_ofic WHERE user_id = ?)
        ORDER BY cve
    `
    const rows = await util.gene_cons(lcSQL, [req.userId])
    const lcDerecho = req.groups;
    const lnOficio = req.query.lnOficio;

    res.render("op/op_cucs", {lcDerecho, rows, lnOficio, skin:req.skin})
});

const op_ofic = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("op/op_ofic", {lcDerecho, skin:req.skin})
});


const op_aingr = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_depe, corto, cve 
            FROM ser_depen 
            WHERE ID_DEPE IN (SELECT id_Depe FROM ser_pers_serv WHERE USER_ID = ?) 
            ORDER BY cve,corto
        `

    const rows = await util.gene_cons(lcSQL, [req.userId])
    //console.log(rows)
    return res.render("op/op_aingr", {rows, skin:req.skin})
});

const op_nofic = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_nofic", {rows, skin:req.skin})
});

const op_ningr = (async (req, res) => {

    const llDirectorio = (req.groups.indexOf(",DIRE_RECT,") < 0 ? true : false)
    const laQuery = req.query
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    loTipo = await util.gene_cons("SELECT id_tiof, descrip FROM OPC_TIPO_OFIC")
    loClas = await util.gene_cons("SELECT id_clof, descrip FROM OPC_CLAS_OFIC WHERE activo = 1")

    return res.render("op/op_ningr", {rows, laQuery, llDirectorio, loTipo, loClas, skin:req.skin})
});

const op_admi = ((req, res) => {
    if (req.groups.indexOf(",OP_TOTA,") < 0)
    {
        return res.render("sin_derecho")
    }
    return res.render("op/op_admi", {skin:req.skin})
});

const op_reof0 = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(req.query)
    //console.log(rows)
    lcSQL = `
        SELECT * 
            FROM gen_ofic_stat
            ORDER BY status
        `
    
    const rows2 = await util.gene_cons(lcSQL)
    
    return res.render("op/op_reof0", {rows, rows2, skin:req.skin})
});

const op_sofic = (async (req, res) => {

    //console.log(req.query.lnIden)
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    try {
            conn = await pool.getConnection();
            
            // 3. Ejecutar la consulta
            //verifica que el usuario tenga derecho al oficio
            const lcSQL = `
            SELECT COUNT(*) AS total
                FROM gen_oficio o INNER JOIN gen_dere_ofic d ON o.CVE = d.cve
                WHERE d.user_id = ${req.userId} AND o.id_iden = ${req.query.lnIden}
            `
            rows = await conn.query(lcSQL, [1]);
            //console.log(rows);

        } catch (err) {
            console.log(err)
            res.json({err})
            throw err;
        } finally {
            // 4. Devolver la conexión al pool (¡Muy Importante!)
            if (conn) conn.release(); 
        }

    if (rows[0].total <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    const laQuery = req.query
    
    //console.log(req.query)

    return res.render("op/op_sofic", {laQuery, skin:req.skin})
});

const op_seofic = (async (req, res) => {

    let lcSQL = ''
    //console.log(req.query.lnIden)
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
            SELECT COUNT(*) AS total
                FROM gen_oficio o INNER JOIN gen_dere_ofic d ON o.CVE = d.cve
                WHERE d.user_id = ${req.userId} AND o.id_iden = ${req.query.lnIden}
            `
    const rows = await util.gene_cons(lcSQL)

    if (rows[0].total <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
            SELECT * 
                FROM gen_oficio 
                WHERE id_iden = ${req.query.lnIden}
            `
    
    const rows2 = await util.gene_cons(lcSQL)

    //console.log(rows2)

    lcSQL = `
        SELECT STATUS AS id, descrip, titular 
            FROM gen_ofic_stat 
            WHERE STATUS = ${rows2[0].STATUS}+1 ${(rows2[0].STATUS<4?' OR STATUS = 99 ': '')}  
            ORDER BY status 
    `

    const rows3 = await util.gene_cons(lcSQL)

    lcSQL = `
        SELECT os.status as id, os.descrip, s.nota, s.usuario, s.inicio, s.fin, TIMESTAMPDIFF(MINUTE, inicio, fin) AS duracion  
            FROM gen_stat_ofic s LEFT JOIN gen_ofic_stat os ON IFNULL(s.status,0) = os.status 
            WHERE id_iden = ${req.query.lnIden}
            ORDER BY os.status desc
    `

    const rows4 = await util.gene_cons(lcSQL)

        lcSQL = `
        SELECT o.*, c.dependen, t.descrip as dtipo_ofic, cl.descrip as dclas_ofic, 1 as tipo  
            FROM opc_oficio o INNER JOIN gen_centros c ON o.id_cent = c.id_cent 
            left join opc_TIPO_OFIC t ON o.ID_TIOF = t.ID_TIOF 
            left join OPC_CLAS_OFIC cl on o.ID_CLOF = cl.ID_CLOF  
            WHERE o.id_ofic	in (select ofic_in from OPC_LIGA_OFIC where tipo = 1 and ofic_out = ${req.query.lnIden}) 
            UNION ALL( 
            SELECT o.*, c.dependen, t.descrip as dtipo_ofic, cl.descrip as dclas_ofic, 3 as tipo 
            FROM opc_oficio o INNER JOIN gen_centros c ON o.id_cent = c.id_cent 
            left join opc_TIPO_OFIC t ON o.ID_TIOF = t.ID_TIOF 
            left join OPC_CLAS_OFIC cl on o.ID_CLOF = cl.ID_CLOF  
            WHERE o.id_ofic	in (select ofic_out from OPC_LIGA_OFIC where tipo = 3 and ofic_in = ${req.query.lnIden}))
    `
    
    const rows5 = await util.gene_cons(lcSQL)
    //console.log(rows5)

    lcSQL = `
    SELECT titular 
        FROM gen_dere_ofic
        WHERE user_id = '2315513' AND cve = 'VAAI'
    `
    const rows6 = await util.gene_cons(lcSQL)

    return res.render("op/op_seofic", {rows2, rows3, rows4, rows5, rows6, skin:req.skin})
});

const op_plan = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    return res.render("op/op_plan", {skin:req.skin})
});

const op_bplan = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_bplan", {rows, skin:req.skin})
});

const op_nplanti = (async (req, res) => {
 
    let rows2 = {}
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)

    if (req.query.lnID > 0){
        const lcSQL = `
        SELECT * 
            FROM gen_ofic_plan 
            WHERE id_plantilla_pk = ${req.query.lnID}
        `
        rows2 = await util.gene_cons(lcSQL)
    }

    //console.log(rows2)
    return res.render("op/op_nplanti", {rows, id: req.query.lnID, rows2, skin:req.skin})
});

const op_grup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("op/op_grup", {skin:req.skin})
});

const op_bgrup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_bgrup", {rows, skin:req.skin})
});

const op_ngrup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_ngrup", {rows, skin:req.skin})
});

const op_sdofic = (async (req, res) => {
    
    const llEditar = (req.groups.indexOf(",OP_EDITA,") < 0 ? true : false) 
    const llEdit_ofic = (req.groups.indexOf(",TOT_DIRE,") < 0 ? true : false) 
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    loDatos = req.query
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `
    const rows = await util.gene_cons(lcSQL);
    
    lcSQLo = `
    SELECT o.*, c.clave as cclave, c.descrip as cdescrip, oc.clave as oclave, oc.descrip as odescrip 
        FROM gen_oficio o LEFT JOIN gen_centros c ON o.id_cent = c.id_cent 
        LEFT JOIN gen_otro_cent oc ON o.id_cent = oc.id_cent 
        WHERE o.id_iden = ${req.query.lnIden}
    `
    const rowso = await util.gene_cons(lcSQLo);

    const ldDere = await util.gene_cons("SELECT * FROM gen_dere_ofic WHERE user_id = '" + req.userId + "' AND cve = '" + req.query.lcCVE + "'")

    //console.log(ldDere)
    return res.render("op/op_sdofic", {rows, ldDere, loDatos, rowso, llEditar, llEdit_ofic, skin:req.skin})
});

const op_rgraf = (async (req, res) => {
    
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
    
    return res.render("op/op_rgraf", {rows, skin:req.skin})
});

const op_hofic = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)

    
    return res.render("op/op_hofic", {rows, skin:req.skin})
});

const op_pend = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)

    //console.log(req.query)

    
    return res.render("op/op_pend", {lcCVE:req.query.lcCVE, skin:req.skin})
});

const op_ingr = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(req.query)
    //console.log(rows)
    
    return res.render("op/op_ingr", {rows, skin:req.skin})
});


const op_detalle = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)

    let lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(req.query)
    //console.log(rows)
    lcSQL = `   
    SELECT o.cve, s.id_depe, s.descrip  
        FROM opc_oficio o LEFT JOIN ser_soli_serv s ON o.ID_OFIC = s.id_oficio 
        WHERE o.id_ofic = ${req.query.lnOficio}
    `
    const loSeek = await util.gene_cons(lcSQL)
    
    loCVE = loSeek[0].cve
    loDepe = loSeek[0].id_depe
    loTexto = loSeek[0].descrip


    return res.render("op/op_detalle", {rows,lnXX:req.query.xx,lnOfic:req.query.lnOficio, loCVE, loDepe, loTexto, skin:req.skin})
});

const detalle_ofic_No = (async (req, res) => {

    const llDirectorio = (req.groups.indexOf(",DIRE_RECT,") < 0 ? true : false)
    const laQuery = req.query
    let lcSQL
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    loOficio = (!req.query.lnOficio, 0, req.query.lnOficio)
    const rows = await util.gene_cons(lcSQL)
    loTipo = await util.gene_cons("SELECT id_tiof, descrip FROM OPC_TIPO_OFIC")
    loClas = await util.gene_cons("SELECT id_clof, descrip FROM OPC_CLAS_OFIC WHERE activo = 1")

    return res.render("op/detalle_ofic_No", {rows, laQuery, llDirectorio, loTipo, loClas, loOficio, skin:req.skin})

});

const busc_ofic = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ?) 
        `
    
    const rows = await util.gene_cons(lcSQL, [req.userId])
    //console.log(req.query)
    //console.log(rows)
    
    return res.render("op/busc_ofic", {rows, skin:req.skin})
});

const new_ord__serv = (async (req, res) => {

    if (req.groups.indexOf(",ASIG_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }


    const lnOficio = req.query.lnOficio
    //console.log(req.query)
    //console.log(lnOficio)
    let lcSQL = `
    SELECT id_serv_pk, descrip, usua_alta, fech_alta, usua_cerr, fech_cerr
        FROM ser_soli_serv 
        WHERE id_oficio = ?
    `
    const rows = await util.gene_cons(lcSQL, [lnOficio])
    
    return res.render("op/new_ord__serv", {lnOficio, loTexto:(rows.length==0?'':rows[0].descrip), skin:req.skin})
})

const seg_ofic = (async (req, res) => {
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lnOficio = req.query.lnOficio
    loClave = req.query.loClave
    loDepe = req.query.loDepe

    return res.render("op/seg_ofic", {lnOficio, skin:req.skin})    
});

const op_nsoli = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("op/op_nsoli", {lcDerecho, skin:req.skin})
});

const op_narea = (async (req, res) => {
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)

    res.render("op/op_narea", {rows, skin:req.skin})
});

module.exports = {
    op_cucs,
    op_ofic,
    op_aingr,
    op_nofic,
    op_ningr,
    op_admi,
    op_reof0,
    op_sofic,
    op_seofic,
    op_plan,
    op_bplan,
    op_nplanti,
    op_grup,
    op_bgrup,
    op_ngrup,
    op_sdofic,
    op_rgraf,
    op_hofic,
    op_pend,
    op_ingr,
    op_detalle,
    detalle_ofic_No,
    op_reof0,
    busc_ofic,
    new_ord__serv,
    seg_ofic,
    op_nsoli,
    op_narea
}