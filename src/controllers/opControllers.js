const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const op_cucs = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("op/op_cucs", {lcDerecho})
});

const op_ofic = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("op/op_ofic", {lcDerecho})
});


const op_aingr = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
        SELECT id_depe, corto, cve 
            FROM ser_depen 
            WHERE ID_DEPE IN (SELECT id_Depe FROM ser_pers_serv WHERE USER_ID = ${req.userId}) 
            ORDER BY cve,corto
        `

    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.render("op/op_aingr", {rows})
});

const op_nofic = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
        SELECT id_cent, cve, depen, clave 
            FROM GEN_TIPO_OFIC 
            WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
        `
    
    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_nofic", {rows})
});

const op_ningr = (async (req, res) => {

    const llDirectorio = (req.groups.indexOf(",DIRE_RECT,") <= 0 ? true : false)
    const laQuery = req.query
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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

    return res.render("op/op_ningr", {rows, laQuery, llDirectorio, loTipo, loClas})
});

const op_admi = ((req, res) => {
    if (req.groups.indexOf(",OP_TOTA,") <= 0)
    {
        return res.render("sin_derecho")
    }
    return res.render("op/op_admi")
});

const op_reof0 = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    return res.render("op/op_reof0")
});

const op_sofic = (async (req, res) => {

    console.log(req.query.lnIden)
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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
            console.log(rows);

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

    return res.render("op/op_sofic", {laQuery})
});

const op_seofic = (async (req, res) => {

    console.log(req.query.lnIden)
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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
            console.log(rows);

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

    return res.render("op/op_seofic", {laQuery})
});

const op_plan = ((req, res) => {
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    return res.render("op/op_plan")
});

const op_bplan = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_bplan", {rows})
});

const op_nplanti = (async (req, res) => {
 
    let rows2 = {}
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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

    console.log(rows2)
    return res.render("op/op_nplanti", {rows, id: req.query.lnID, rows2})
});

const op_grup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("op/op_grup")
});

const op_bgrup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_bgrup", {rows})
});

const op_ngrup = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    const lcSQL = `
    SELECT id_cent, cve, depen, clave 
        FROM GEN_TIPO_OFIC 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ${req.userId}) 
    `

    const rows = await util.gene_cons(lcSQL)
    return res.render("op/op_ngrup", {rows})
});

const op_sdofic = (async (req, res) => {
    
    const llEditar = (req.groups.indexOf(",OP_EDITA,") <= 0 ? true : false) 
    const llEdit_ofic = (req.groups.indexOf(",TOT_DIRE,") <= 0 ? true : false) 
    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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
    return res.render("op/op_sdofic", {rows, ldDere, loDatos, rowso, llEditar, llEdit_ofic})
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
    op_sdofic
}