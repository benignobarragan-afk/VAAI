const { link } = require("fs/promises");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const outil = require(path.join(__dirname, "..", "utils/other_utils"));
const fs = require('fs');

const op_cucsx2 = (async (req, res) => {

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
    return res.json(rows)

});

const op_oficx5 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = ''
    //console.log(req.query)

    if (req.query.t != 1){
        lcSQL = `SELECT cve 
            FROM gen_dere_ofic 
            WHERE user_id = ? AND cve = ?
        `
        const llDere = await util.gene_cons(lcSQL, [req.userId, req.query.cve])

        if (!llDere || llDere.length <= 0)        //si no tiene derechos
        {
            return res.render("sin_derecho")
        }

    }
    
    let parameters = []

    lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.fecha desc) AS rank, o.depe_envi AS centros,
            CASE 
                WHEN IFNULL(o.gdoc, '') != '' AND INSTR(o.gdoc, 'docs.google.com') > 0 THEN o.gdoc 
                ELSE '' 
            END AS doc, 
            o.oficio, 
            DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha, 
            DATE_FORMAT(o.fecha, '%H:%i') AS hora, 
            o.concepto, 
            g.descrip AS stat_desc, 
            IFNULL(o.referencia, '') AS referencia, 
            IFNULL(o.anexo, '') AS anexo, 
            IFNULL(o.soli_ofic, '') AS solicitado, 
            o.cve, 
            o.idoficio, 
            YEAR(o.fecha) AS anio, 
            o.id_iden AS id, 
            o.id_iden 
        FROM gen_oficio o LEFT JOIN gen_ofic_stat g ON IFNULL(o.STATUS,0) = g.STATUS 
            LEFT JOIN GEN_SOLI_OFIC so ON so.num_soli = o.soli_ofic 
    `
    if (req.query.t === '2'){
    
    lcSQL = lcSQL + `
        WHERE 
            IFNULL(o.status, 0) < 3 AND o.cve = ? 
    `
    parameters = [req.query.cve]
    }
    else {
    lcSQL = lcSQL + `
        WHERE 
            o.solicito = ? AND IFNULL(o.status, 0) < 4 AND o.cve IN ( 
                SELECT cve 
                FROM GEN_DERE_OFIC 
                WHERE user_id = ?
            )
    `
    parameters = [req.userId, req.userId]
    }
    lcSQL = lcSQL + ` 
        ORDER BY 
        o.fecha DESC 
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, parameters)
    return res.json(rows)
});

const cmb_controlw = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']

    let lcWhere = util.cade_busc("o.nume_cont,' ',o.descrip", lcBusca)
    lcWhere.params.push(req.userId)
    
    const lcSQL = `
    SELECT id_ofic as id
                , CONCAT('(', o.cve, '/', CAST(nume_cont AS CHAR), '/', CAST(anio AS CHAR), '/', IFNULL(t.descrip,'Ingreso'), '/', CASE WHEN IFNULL(o.letra, '') != '' THEN '-' ELSE '' END, IFNULL(o.letra, ''), ')', ' ', LEFT(o.descrip, 20)) AS value
                , anio, o.descrip 
                , IFNULL(t.descrip,'Ingreso') as   tipo, IFNULL(o.letra, '') as letra 
        FROM opc_oficio o
        LEFT JOIN OPC_TIPO_docu t oN t.id_pk = o.TIPO
        WHERE nume_cont > 0 AND ${lcWhere.sql}
            and cve in (SELECT CVE FROM GEN_DERE_OFIC WHERE USER_ID = ?) 
        ORDER BY anio desc, nume_cont, o.cve LIMIT 20
    `

    console.log(lcSQL)
    console.log(lcWhere.params)
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    return res.json(rows)
});


const op_bplanx = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcSQL = `
    SELECT g.id_plantilla_pk as id, 0 as marcar, g.nombre, g.descrip  
        FROM gen_ofic_plan g 
        WHERE g.id_cent = ?
        ORDER BY 3
    `
    
    const rows = await util.gene_cons(lcSQL, [req.query.lnId_cent])
    return res.json(rows)

    
});

const op_nplantix = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL, parameters = []
    if (req.body.id > 0){
    lcSQL = `
        UPDATE gen_ofic_plan 
            SET nombre = ?, descrip = ?, cambios = CONCAT(IFNULL(cambios,''),CHAR(13,10),'UPDATE|',
            ?,'|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I')) WHERE id_plantilla_pk = ?; 
        `
        parameters = [req.body.nombre, req.body.descrip, req.userId, req.body.id]
    }
    else {
    lcSQL = `
        INSERT INTO gen_ofic_plan (nombre, descrip, id_cent, cambios) 
            VALUES(?, ?, ?, CONCAT('ALTA|',?,'|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I'))); 
        `

        parameters =  [req.body.nombre, req.body.descrip, req.body.id_cent, req.userId]
    }
    
    const rows = await util.gene_cons(lcSQL, parameters)
    //console.log(rows)
    
    return res.json({"error":false, "message":rows})
} );

const op_noficx4 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query.lnTipo == 1)
    let lcSQL = "", parameters = []
    if (req.query.laId <= 0){
        return res.json({"error":true, "mensage":"Falto seleccionar un id"})
    }
    if (req.query.lnTipo == 1){
        lcSQL = `
        SELECT * FROM ( 
            SELECT  d.id_grup_deta, d.id_cent as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, IFNULL(c.descrip, '') as nomb_serv, IFNULL(d.copias, '') as copias 
                FROM GEN_OP_GRUP_DETA d 
                LEFT JOIN GEN_CENTROS c ON d.id_cent = c.ID_CENT 
                WHERE tipo_depe = 1 AND id_grupo IN (?)  
        UNION ( 
            SELECT d.id_grup_deta, d.id_cent as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, IFNULL(c.descrip, '') as nomb_serv, IFNULL(d.copias, '') as copias 
                FROM GEN_OP_GRUP_DETA d 
                LEFT JOIN GEN_OTRO_CENT c ON d.id_cent = c.ID_CENT  
                WHERE tipo_depe = 2  AND id_grupo IN (?)  ) 
        UNION ( 
            SELECT d.id_grup_deta, 0 as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, SPACE(70) as nomb_serv, IFNULL(d.copias, '') as copias  
                FROM GEN_OP_GRUP_DETA d  WHERE tipo_depe = 0  AND id_grupo IN (?) ) ) Datos 
            order by id_grup_deta        `
        parameters = [req.query.laId, req.query.laId, req.query.laId]
    }
    else {
        lcSQL = `
            SELECT descrip
                FROM GEN_OFIC_PLAN 
                WHERE id_plantilla_pk = ? 
        `
        parameters = [req.query.laId]
    }
    const rows = await util.gene_cons(lcSQL, parameters)
    //console.log(rows)
    return res.json(rows)

});

const op_noficx6 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    
    lcSQL = `
        SELECT id_ofic as id, nume_cont as value, 1 as open 
            from opc_oficio 
            WHERE id_ofic = ?  
            ORDER BY id_ofic DESC LIMIT 1
        `
    
    const rows = await util.gene_cons(lcSQL, [req.query.lnOfic])
    //console.log(rows)
    return res.json(rows)

});

const op_noficx7 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
/*     lcSQL = `
        SELECT corr_ofic, diri_nomb, diri_carg 
            from gen_doficio 
            WHERE id_cent = ${req.query.id} AND tipo_depe = 1 
            ORDER BY id_iden DESC LIMIT 1
        ` */
    const lcSQL = `    
    SELECT ROW_NUMBER() OVER (ORDER BY COUNT(*) desc) AS id, diri_nomb AS value, diri_carg as cargo, corr_ofic, COUNT(*) AS copias
        FROM gen_doficio 
        WHERE id_cent = ? and diri_nomb not in ("N/A", "NA", "-")
        group BY 2,3,4
        ORDER BY 5 DESC 
        LIMIT 30
    `

    const rows = await util.gene_cons(lcSQL, [req.query.id])
    //console.log(rows)
    return res.json(rows)

});

const op_bgrupx = (async (req, res) =>{

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
            SELECT g.id_grupo as id, g.nombre_grupo,
                GROUP_CONCAT(concat(d.nombre, ' - ', 
                                                CASE WHEN tipo = 1 THEN 'Dirigido a' WHEN tipo = 2 THEN 'Con copia' WHEN tipo = 3 THEN 'Autoriza' 
                                                ELSE 'Vo. Bo.' END)
                            ORDER BY d.nombre ASC) AS personas
            FROM
                gen_op_grupo g INNER JOIN gen_op_grup_deta d ON g.id_grupo = d.id_grupo
            WHERE g.id_cent = ?
            GROUP BY
                g.nombre_grupo
            ORDER BY 2
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lnId_cent])
    //console.log(rows)
    return res.json(rows)

});

const op_noficx5 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(!req.body.txtConcepto || !req.body.cmbSoli)
    
    if (!req.body.txtConcepto || !req.body.cmbSoli){
        return res.json({"status" : false, "message": "Los campos con * son obligatorios"});
    }

    laDeta = JSON.parse(req.body.txtGrid)
    let llError = false;
    let lnDirigido = 0

    for (var i = 0; i < laDeta.length; i++) {
//        if (!laDeta[i].nombre || !laDeta[i].ocupacion || !laDeta[i].correo){
        if (!laDeta[i].nombre || !laDeta[i].ocupacion){
            llError = true;
            break;
        }
        //console.log(laDeta[i].tipo)
        lnDirigido = lnDirigido + (laDeta[i].tipo == 1 ? 1 : 0)
    }
    //console.log(lnDirigido)

    if (!laDeta || llError){
        return res.json({"status" : false, "message": "Faltan datos en las dependencia"});
    }
    
    //console.log(lnDirigido)
    if (lnDirigido <= 0){
        return res.json({"status" : false, "message": "Debes ingresar por lo menos un tipo Dirigido a"});
    }

    //console.log(req.body)

    const laDepen = await util.gene_cons("select * from gen_tipo_ofic where cve = ?", [req.body.cmbSoli])
    //console.log(laDepen)

    if (!laDepen){
        return res.json({"status" : false, "message": "No se pudo recuperar información de la dependencia"});
    }

    //console.log(laDepen[0].CVE)
    //console.log("'" + (!laDepen[0].cve_compartir ?laDepen[0].CVE : laDepen[0].cve_compartir) + "'")
    const laID = await util.gene_cons("CALL SP_NEWID (?, '')", [(!laDepen[0].cve_compartir ?laDepen[0].CVE : laDepen[0].cve_compartir)])

    if (!laID[0][0].nextid){
        return res.json({"status" : false, "message": "Hay problema al obtener el folio"});
    } 

    const lcOficio = config.ante_ofic + (!laDepen[0].PREVIO ? '' : laDepen[0].PREVIO) + laDepen[0].CVE + '/' + laID[0][0].nextid + '/' + new Date().getFullYear().toString();
    const lcclav_ofic = util.gene_id_11()
    lcSQL = `
        INSERT INTO gen_oficio (idOficio, cve, oficio, fecha, clave, concepto, referencia, anexo, solicito, usuario, clav_soli, lud, 
                tipo_depe, clav_ofic, cent_soli, soli_ofic, soli_moti, area_rh, nombra, pers_firma, id_seccion) 
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    let parameters = [laID[0][0].nextid, laDepen[0].CVE, lcOficio, laDepen[0].CLAVE, req.body.txtConcepto, req.body.txtRefe, req.body.txtAnexo,
        req.userId, req.userId, req.centro, laDeta[0].tipo_depe, lcclav_ofic, req.id_cent, req.body.cmbSoli_ofic, req.body.txtSoli_moti,
        (!req.body.cmbTipoFormatoRH ? 0 : req.body.cmbTipoFormatoRH), (req.body.nombramiento == 1 ? 1 : 0), 
        (!req.body.firma ? 0 : req.body.firma), (!req.body.seccion ? 0 : req.body.seccion)]
    //console.log(lcSQL)
    //console.log(parameters)
    const laInsert = await util.gene_cons(lcSQL, parameters)            //inserta el oficio
    
    if (!laInsert.insertId){
        return res.json({"status" : false, "message": "No se pudo registrar el oficio, por favor comentelo con el administrador"});
    }

    laStatus = `
        INSERT INTO GEN_STAT_OFIC (idOficio, cve, usuario, inicio, nota, anio, id_iden) 
            VALUES (?, ?, ?, NOW(), ?, Right(Year(NOW()),2), ?)
    `
    const laInsertStat = await util.gene_cons(laStatus, [laID[0][0].nextid, laDepen[0].CVE, req.userId, req.body.txtStatus, laInsert.insertId])
    //console.log(laInsertStat)

    for (var i = 0; i < laDeta.length; i++) {                   //inserta el detalle del oficio
        const lcDeta = `
        INSERT INTO gen_doficio (id_iden, id_cent, corr_ofic, Diri_nomb, diri_carg, tipo_depe, tipo, clav_ofic, cambios, copias) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, CONCAT('ALTA|',?,'|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I')), ?)
        `
        parameters = [laInsert.insertId, laDeta[i].servicio, laDeta[i].correo, laDeta[i].nombre, laDeta[i].ocupacion, laDeta[i].tipo_depe, 
            laDeta[i].tipo, lcclav_ofic, req.userId, laDeta[i].copias
        ]

        console.log(lcDeta)
        console.log(parameters)

        const laInsertDeta = await util.gene_cons(lcDeta, parameters)
        //console.log(laInsertDeta)
    }

    //actualiza en nombre de las dependencias enviadas
    lcSQL = `
    UPDATE gen_oficio SET depe_envi = 
        (SELECT
                GROUP_CONCAT(datos.DEPENDEN) AS DEPE_ENVI
            FROM (
                SELECT d.id_iden, c.DEPENDEN FROM gen_doficio d 
                INNER JOIN gen_centros c ON d.id_cent = c.id_cent
                WHERE d.tipo_depe = 1 AND D.id_iden = ?
                UNION ALL
                
                SELECT d.id_iden, c.DEPENDEN FROM gen_doficio d 
                INNER JOIN gen_otro_cent c ON d.id_cent = c.id_cent
                WHERE d.tipo_depe = 2 AND D.id_iden = ?
            ) datos)
            WHERE id_iden = ?
    `

    const laDepe_actu = await util.gene_cons(lcSQL, [laInsert.insertId, laInsert.insertId, laInsert.insertId])

    //liga los oficio de ingreso con la nueva salida
    loTree = JSON.parse(req.body.txtTree);  
    //console.log(loTree.length)
    let loLiga
    
    for (var i = 0; i < loTree.length; i++){
        lcSQL = `
        INSERT INTO opc_liga_ofic (ofic_in, ofic_out, tipo, tipo_docu) VALUES(?, ?, 1, 0)
        `
        loLiga = await util.gene_cons(lcSQL, [loTree[i].id, laInsert.insertId])
    }    

    
    
    return res.json({"status" : true, "message": "El oficio se inserto correctamente"});


});

const op_gofic = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const loUsuario = await util.gene_cons("SELECT IFNULL(apepat, '') as apepat, IFNULL(apemat, '') as apemat, IFNULL(nombre, '') as nombre FROM gen_personas WHERE codigo = ?", [req.codigo]);

    lcSQL = `
    SELECT o.cve, o.idoficio, CONCAT('a ', DAY(o.fecha), ' de ', 
        ELT(MONTH(o.fecha), 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'), 
        ' de ', YEAR(o.fecha)) as fecha, o.oficio, o.concepto as oConcepto, IFNULL(o.Diri_nomb, space(70)) as Pnombre, IFNULL(d.corto, '') as area_rh
            ,IFNULL(o.diri_carg, space(70)) AS Pcargo, IFNULL(o.Aten_nomb, space(70)) as Anombre, IFNULL(o.Aten_carg, space(70)) as Acargo, o.Clav_Soli
            ,o.clave, o.clav_ofic  , IFNULL(o.gdoc,'' ) AS GDOC, YEAR(o.fecha) as anio, IFNULL(o.pers_firma, 0) AS pers_firma
        FROM gen_oficio o LEFT JOIN gen_centros c ON o.clave = c.clave 
            LEFT JOIN ser_depen d ON o.area_rh = d.id_depe 
        WHERE o.id_iden = ?
        ORDER BY o.fecha DESC
    `
    const rows = await util.gene_cons(lcSQL, [req.body.lnIden])

    //console.log(rows)

    lcSQL = `
        SELECT t.iniciales, t.plantilla, t.nomb_firm, t.carg_firm, c.dependen 
            FROM gen_tipo_ofic t left join gen_centros c on t.ID_CENT = c.id_cent 
            WHERE cve = ?
    `
    const loFirma = await util.gene_cons(lcSQL, [rows[0].cve])

    //console.log(loFirma)

    const loQR = await util.generarQrBase64("https://siva.udg.mx?valida=")
    
    let lnQR = loQR
    if (loQR.indexOf(",") > 0){
        lnQR = loQR.substring(loQR.indexOf(",")+1);
    }
    
    //const lnQR = "iVBORw0KGgoAAAANSUhEUgAAAFIAAABSCAIAAABIThTMAAACvElEQVR42u2Zy24sIQxEM///0ZNI2TByV/Up04sohsXVFQ/bx82Aqby+cHu/3z//vl4v2L+O/rbfOev8dXRtdaaPx8+8sD8aW7n3QfhErGt9v1qrIvHYxMLBvtvAPCAFUO0Qjypx/PNUywc7CSINqELuHFe+52A/h60wFDw58Phh6aM62Am2at4Bma9GfUJ3LjO/ajY2aeR4+wv/J20qNrl46ibhoayr1vRVmzXFalTZCSiGYq8m0meGD53YIYeQT7q3puZPxebXkoJMC9s0NSQFClJZnoqtjPIHgE8E2X7EgprDU/BheTQ2l/WqS9XSkpbDKy/8Ej3YSaHHH6Rp6D5BPcHwIvKh2OmRs3/YEAwiXXHsumoqdjWnFq8tLWnUqv0DTK1F5cpQ7BrWU2UJSUfPmv+h3Vg+2EGhQo4ZLgCrEH1sXLq4GB2N3dveyo1H8gl6Krk3P7TR2D44NYcUp8QyF6q4/HhTbo3G9psqdVBXkUeFSs2OOKE+wFRsXjDW5n8O/FLpycaqketzKnYvRO+SzOQhkq1Ltv0H3VDsVHzjGDuHk/8YqbRQ+2dj1+HquCcz7T8h0iuQJG4qtprEje5Liz15qCceInXln2PzRxzf6jsSP59Dor1I+lBs9EwLSxSOsSP61hi4pDUb2wetRve3twqLP2lr6lG6DzaS8nh/T34MZMDWg+RgdwPtlSt8qyvvPkIS21RsFVAKnzb+mPURemsyuUOx+XWl+rks0StsFHZanH54GY3dk43ITOV+X8zqRX6wk9aTH9Ra4p0/V1Sc1c5UbA6cCg/KAp/jk+5TefNJRmNzZ/xSUSkjafWJ2NnkB7v7kNwpUdInx1OX3MFOsFM50dsnwH4m3+Rr/8HOS8geWCoG8RQo4Lr2YOv2rCTIS1QkD/X+8DAam7T0CtkvYNQq4vcmiTOxvwHcKiBxdyg2twAAAABJRU5ErkJggg=="
    
    //console.log(rows)
    let lodirigido = {}, locopia = {}, loautoriza = {}, lovobo = {}, loatencion = {}

    lodirigido = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 1 AND id_iden = ?", [req.body.lnIden]);
    locopia = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 2 AND id_iden = ?", [req.body.lnIden]);
    loautoriza = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 3 AND id_iden = ?", [req.body.lnIden]);
    lovobo = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 4 AND id_iden = ?", [req.body.lnIden]);
    loatencion = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 5 AND id_iden = ?", [req.body.lnIden]);
    
    //console.log(loatencion)

    let loCuerpo = {"folio": rows[0].oficio,
                "fecha": rows[0].fecha,
                "concepto": rows[0].oConcepto,
                "iniciales": "",
                "titular": [{nombre : loFirma[0].nomb_firm, titulo : loFirma[0].carg_firm}],
                "dirigido": lodirigido,
                "copia" : locopia,
                //"autoriza": loautoriza,               si se requieren los corrijo 
                //"vobo": lovobo,
                "atencion": loatencion,
            }, 

    loJson = {
        "theArg1": loCuerpo, 
        "theArg2": rows[0].cve,
        "theArg3": loFirma[0].plantilla,
        "theArg4": rows[0].oficio,
        "theArg5": lnQR,
        "theArg6": config.url_logs,
        "theArg7": config.carp_ofic,
        "theArg8": req.nom_cen,
        "theArg9": rows[0].anio
    }

    //console.log(loJson)
    //return 
    let googleDoc
    try{
        googleDoc = await util.gene_gogl_doc(config.nuev_docu, loJson);
    } catch (err) {
        console.log(err)
        //res.json({err})
        //throw err;
    } finally {
    }

    //console.log(googleDoc)

    if (googleDoc.length > 0){
        let lcInserta = `
        UPDATE gen_stat_ofic SET fin = NOW() WHERE cve = ? AND idOficio = ? AND anio = ? AND IFNULL(status,0) = 0 ;
        `
        let loFinal = await util.gene_cons(lcInserta, [rows[0].cve, rows[0].idoficio, rows[0].fecha.slice(-2)]);
        lcInserta = `
        INSERT INTO gen_stat_ofic (idOficio, cve, anio, status, inicio, usuario, id_iden) 
			VALUES (?, ?, ?, 1, NOW(), ?, ?);
        `
        loFinal = await util.gene_cons(lcInserta, [rows[0].idoficio, rows[0].cve, rows[0].fecha.slice(-2), req.userId, req.body.lnIden]);
        lcInserta = `
		UPDATE gen_oficio SET status = 1, gdoc = ? WHERE id_iden = ?
        `
        //console.log(lcInserta)
        loFinal = await util.gene_cons(lcInserta, [googleDoc, req.body.lnIden]);
        //console.log(loFinal)

        return res.json({"status": true, "message":"El documento se creó correctamente"})
    }
    else {
        return res.json({"status": false, "message":"El documento no se pudo crea, por favor consultalo con el administrador"})
    }
    


    /*const loQR = await util.generarQrBase64("https://www.ejemplo.com")
    return res.status(200).json({
            ok: true,
            qr_data_url: loQR,
            mensaje: `QR generado para: https://www.ejemplo.com`
        });
    */
});


const op_sdoficx = (async (req, res) =>{

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
            SELECT d.id_doficio_pk as id, d.id_cent as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, tipo_depe, c.descrip as nomb_serv, IFNULL(d.copias, '') as copias 
                    , IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto, IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi  
                    , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                FROM gen_doficio d LEFT JOIN GEN_CENTROS c ON d.id_cent = c.ID_CENT 
                WHERE tipo_depe = 1 AND id_iden = ?
	            UNION ALL  
                SELECT d.id_doficio_pk as id, d.id_cent as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, tipo_depe, c.descrip as nomb_serv, IFNULL(d.copias, '') as copias 
                        , IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto, IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi   
                        , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                    FROM gen_doficio d LEFT JOIN GEN_OTRO_CENT c ON d.id_cent = c.ID_CENT 
	                WHERE tipo_depe = 2 AND id_iden = ?
                UNION ALL  
                    SELECT d.id_doficio_pk as id, 0 as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, 
                            tipo_depe, SPACE(70) as nomb_serv, IFNULL(d.copias, '') as copias, IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto 
                            , IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi 
                            , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                        FROM gen_doficio d 
                        WHERE tipo_depe = 0 AND id_iden = ?
                        order by tipo, diri_nomb
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lnIden, req.query.lnIden, req.query.lnIden])
    //console.log(rows)
    return res.json(rows)

});

const op_admix2 = (async (req, res) => {

    if (req.groups.indexOf(",OP_TOTA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    let parameters = []
    lcSQL = `
        SELECT cve as id, cve, depen, nomb_firm, carg_firm, iniciales, correo_area, correo_copia, plantilla, 
                    CASE WHEN titular = 1 THEN 'SI' ELSE 'NO' END as titular, IFNULL(cve_compartir, '') AS compartir
            FROM gen_tipo_ofic 
    `
    if (req.query.servicio > 0){
        lcSQL = lcSQL + `        
            WHERE id_cent = ? AND IFNULL(cve_compartir, '') = ''
    `
    parameters = [req.query.servicio]
    }
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, parameters)
    //console.log(rows)
    return res.json(rows)

});

const op_ningrx2 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
/*     lcSQL = `
        SELECT IFNULL(MAX(nume_cont), 0) + 1 as control FROM opc_oficio 
			WHERE cve = '${req.query.cve}' AND anio = ${req.query.anio} AND tipo = ${req.query.tipo_docu}
    ` */
    lcSQL = `
        SELECT IFNULL(MAX(nume_cont), 0) + 1 as control FROM opc_oficio 
			WHERE cve = ? AND anio = ?
    `

    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.cve, req.query.anio])
    //console.log(rows)
    //return res.json(rows)
    return res.json({status:true, nume_cont : rows[0].control})

});

const op_ningrx3 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    lcSQL = `
    SELECT MAX(nomb_remi) AS nomb_remi, MAX(carg_remi) AS carg_remi, MAX(nomb_dest) AS nomb_dest, MAX(carg_dest) AS carg_dest
        FROM (
                (SELECT nomb_remi, carg_remi, '' AS nomb_dest, '' AS carg_dest  
                FROM opc_oficio 
                WHERE cent_proc = ?
                ORDER BY id_ofic DESC LIMIT 1)
                
                UNION ALL
                
                (SELECT '', '', nomb_dest, carg_dest
                FROM opc_oficio
                WHERE cve = ?
                ORDER BY id_ofic DESC LIMIT 1)
                ) datos
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.id, req.query.cve])
    //console.log(rows)
    //return res.json(rows)
    return res.json(rows)

});

const cmb_control2W = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcBusca = req.query['filter[value]']
    /* const lcWhere = util.construirClausulaBusqueda(lcBusca,'3') */
    let lcWhere = util.cade_busc('o.descrip', lcBusca)

    if (!!req.query.cve){
        lcWhere.sql = lcWhere.sql + " AND o.status < 8 AND o.cve = ? "
        lcWhere.params.push(req.query.cve)
    }else {
        lcWhere.sql = lcWhere.sql + " AND o.status < 8 "
    }
    

    //console.log(lcWhereT)

    lcSQL = `
        SELECT o.id_ofic as id, LEFT(o.descrip,254) as value 
            FROM opc_oficio o INNER JOIN OPC_TIPO_DOCU t ON t.id_pk = o.tipo
            WHERE ${lcWhere.sql} 
            GROUP BY o.id_ofic, o.descrip
            ORDER BY o.id_ofic desc LIMIT 20
    `
    //console.log(lcSQL)
    //console.log(lcWhere.params)
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    //console.log(rows)
    return res.json(rows)
    //return res.json({status:true, nume_cont : rows[0].control})

});

const cmb_control3W = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcBusca = req.query['filter[value]']
    
    /* const lcWhere = util.construirClausulaBusqueda(lcBusca,'4') */
    let lcWhere = util.cade_busc('o.oficio', lcBusca)

    if (!!req.query.cve){
        lcWhere.sql = lcWhere.sql + " AND o.status < 8 AND o.cve = ? "
        lcWhere.params.push(req.query.cve)
    }else {
        lcWhere.sql = lcWhere.sql + " AND o.status < 8 "
    }
    
/*     let lcWhereT = ''
    lcWhereT = (!req.query.cve ? '' : "o.status < 8 AND o.cve = '" + req.query.cve + "'") + (!req.query.cve ? '' : ' and ') + (!lcWhere ? '' : lcWhere)
    lcWhereT = (!lcWhereT ? '' : 'WHERE ' + lcWhereT) */
 
    //console.log(lcWhereT)

    lcSQL = `
        SELECT o.id_iden as id, o.oficio as value 
            FROM gen_oficio o
            WHERE ${lcWhere.sql} 
            ORDER BY o.id_iden desc LIMIT 20
    `
    console.log(lcSQL)
    console.log(lcWhere.params)
    const rows = await util.gene_cons(lcSQL, lcWhere.params)
    //console.log(rows)
    return res.json(rows)
    //return res.json({status:true, nume_cont : rows[0].control})

});

const op_ningrx = (async (req, res) => {

    //console.log(req.body);

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.body)
    //return res.json([])

    if (req.body.nume_cont <= 0){
        res.json([{"status":false, "message":"El numero de control no puede estar vacío o ser cero"}]);
    }

    let lnNuev_cent = 0, parameters = []
    if (req.body.rbDepe === '2' && !req.body.id_cent && req.body.txtDepen != ''){        //si es una dependencia nueva tipo no udg
        lcSQL = `
            INSERT INTO GEN_OTRO_CENT (descrip, dependen, orden) VALUES 
		        (?, ?, 0)
        `
        const rows = await util.gene_cons(lcSQL, [req.body.txtDepen, req.body.txtDepen]);
        lnNuev_cent = rows.insertId;
        const rows2 = await util.gene_cons('UPDATE gen_otro_cent set clave = id_cent WHERE ifnull(clave,0) != id_cent');
        //console.log(lnNuev_cent);
    }

    lcSQL = `
        SELECT IFNULL(MAX(nume_cont), 0) as control 
            FROM opc_oficio 
            WHERE cve = ? AND anio = YEAR(now()) 
    `
    const rows3 = await util.gene_cons(lcSQL, [req.body.cve]);
    
    //console.log(rows3)
    lnNume_cont = parseInt(rows3[0].control) + 1
    //console.log(req.body)

    lcSQL = `
        INSERT INTO opc_oficio (clave, fech_ofic, nume_cont, fecha, descrip, tipo_depe, cent_proc, clv_proc, nomb_proc, ligado_a
                , id_tiof, id_clof, asunto, codi_remi, nomb_remi, carg_remi, codi_dest, nomb_dest, nota, usuario, lud, anio
                , id_refe_in, id_refe_ou, pendiente, tipo, carg_dest, tele_dest, cve, id_cent, asignado, status, doc_firma, info_sens, segu_pra, letra
                , tipo_info, tipo_ingr, BIS, id_seccion, nomb_copi, carg_copi) 
            VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, now(), ? ,?, ?, 0, ?, ?, '', ?, ?, 0, 1, 0, ?, 0, '' , ?, ?, 0, ?, ?, ?);
    `
    console.log(req.body.info_sens)

    parameters = [req.centro, outil.form_fechSQL(req.body.fech_ofic), lnNume_cont, req.body.nume_ofic, req.body.rbLiga, (lnNuev_cent>0?lnNuev_cent:req.body.dependen), req.body.clav_proc,
        req.body.txtDepen, req.body.ligado_a, req.body.tipo_ofic, req.body.clase, req.body.asunto, req.body.remi_nomb, req.body.remi_carg, req.body.dest_nomb,
        req.body.nota, req.userId, req.body.anio_ingr, req.body.liga_sali, req.body.liga_entr, req.body.tipo_ingr, req.body.dest_carg, req.body.cve, req.id_cent, 
        (req.body.info_sens = 0?false:true),req.body.tipo_info, req.body.tipo_ingr, (req.body.seccion === '' ? 0 : req.body.seccion), req.body.copi_nomb, req.body.copi_carg
    ]
    //console.log(lcSQL)
    const rows4 = await util.gene_cons(lcSQL, parameters);

    lcSQL = `
        INSERT INTO opc_segu_ofic(id_ofic, fecha, status, USER_ID, nombre) VALUES(?, now(), 1, ?, ?)
    `
    const rows5 = await util.gene_cons(lcSQL, [rows4.insertId, req.userId, req.nom_usu]);

    if (!!req.body.liga_sali){                       //aplica oficios de salidada ligados
        lcSQL = `
        SELECT id_iden as ID
            FROM gen_oficio 
            where status < 9 and id_iden in (?)
        `

        const loLigaS = await util.gene_cons(lcSQL, [req.body.liga_sali])

        //console.log(loLigaS)
        let loLigaSa 


        for (var i = 0; i < loLigaS.length; i++){
            lcSQL = `
            INSERT INTO opc_liga_ofic (ofic_in, ofic_out, tipo, tipo_docu) VALUES(?, ?, 3, 0)
            `

            //console.log(lcSQL)
            loLigaSa = await util.gene_cons(lcSQL, [loLigaS[i].ID, rows4.insertId])
            //console.log(loLigaSa)
        }
    }


    if (!!req.body.liga_entr){                         //aplica oficios de entrada ligados
        lcSQL = `
        SELECT id_ofic as ID
            FROM opc_oficio 
            where status < 8 and id_ofic in (?)
        `

        const loLigaI = await util.gene_cons(lcSQL, [req.body.liga_entr])

        //console.log(loLigaI)
        let loLigaIa


        for (var i = 0; i < loLigaI.length; i++){
            lcSQL = `
            INSERT INTO opc_liga_ofic (ofic_in, ofic_out, tipo, tipo_docu) VALUES(?, ?, 2, 0)
            `

            //console.log(lcSQL)
            loLigaIa = await util.gene_cons(lcSQL, [rows4.insertId, loLigaI[i].ID])
        
            //console.log(loLigaIa)
        }
    }


    res.json([{status: true, message:"Se guardo correctamente con el n\u00FAmero: " + lnNume_cont, oficio: lnNume_cont, id: rows4.insertId }]);
    //console.log(rows5)


});

const op_admix = (async (req, res) => {

    if (req.groups.indexOf(",OP_TOTA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = '', parameters = []

    //console.log(req.body)

    if (!req.body.clave || !req.body.cmbServicio || !req.body.correo_area || !req.body.firm_rud || !req.body.firm_nomb || !req.body.firm_carg || !req.body.firm_inic){
        return res.json({"status": false, "message": "Los campos con un * son obligatorios"})
    }

    lcSQL = `
        SELECT CVE 
            FROM gen_tipo_ofic 
            WHERE cve = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.clave]);

    if (rows.length > 0){
        return res.json({"status": false, "message": "La clave de la oficialia ya se encuentra registrada"})
    }

    lcSQL = `
        SELECT *  
            FROM gen_id 
            WHERE \`table\` = ?
    `
    const rows2 = await util.gene_cons(lcSQL, [req.body.clave]);

    if (rows2.length > 0){
        return res.json({"status": false, "message": "No se puede usar la clave de oficialia ingresada, intenta con otra"})
    }

    lcSQL = `
        SELECT *  
            FROM gen_id 
            WHERE \`table\` = ?
    `
    const rows3 = await util.gene_cons(lcSQL, ['R_'+req.body.clave]);

    if (rows3.length > 0){
        return res.json({"status": false, "message": "No se puede usar la clave de oficialia ingresada, intenta con otra"})
    }

    lcSQL = `
        SELECT clave, RTRIM(LTRIM(dependen)) as dependen, descrip 
            FROM gen_centros 
            WHERE id_cent = ?
    `

    const rows4 = await util.gene_cons(lcSQL, [req.body.cmbServicio]);

    if (rows4.length <= 0){
        return res.json({"status": false, "message": "No se pudo localizar la dependencia"})
    }

    const lnProximo = (isNaN(parseInt(req.body.folio)) || parseInt(req.body.folio) <= 0 ? 1 : parseInt(req.body.folio))

    lcSQL = `
        INSERT INTO gen_tipo_ofic (cve, depen, clave, id_cent, previo, iniciales, nomb_firm, carg_firm, plantilla, codigo, correo_area, correo_copia, cve_compartir) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?);
    `
    parameters = [req.body.clave, rows4[0].dependen, rows4[0].clave, req.body.cmbServicio, req.body.previo, req.body.firm_inic, req.body.firm_nomb, req.body.firm_carg, req.body.firm_rud, req.body.correo_area, req.body.correo_copia, req.body.compartir]
    
    const rows5 = await util.gene_cons(lcSQL, parameters);

    lcSQL = `
        INSERT INTO GEN_ID (\`table\`, nextid, reset) VALUES (?, ?, 1), (?, 1, 0)
    `
    const rows6 = await util.gene_cons(lcSQL, [req.body.clave, lnProximo, 'R_'+req.body.clave]);
    
    return res.json({"status": true, "message": "Se guardaron los cambios"})
});

const op_nplan = ( async (req, res) => {

    if (req.groups.indexOf(",OP_TOTA,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
        SELECT * 
            FROM gen_tipo_ofic 
            WHERE cve = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.lcCve]);

    if (rows[0].PLANTILLA != ''){
        return res.json({"status": "error", "message": "El oficio ya cuenta con una plantilla"})
    }
    
    loJson = {
        "depe": req.body.lcCve, 
        "url_plan": config.url_plant,
        "nomb_carp": config.carp_plan,
        "url_logger": config.url_logs,
    }

    //console.log(loJson)
    //return 
    let googleDoc
    try{
        googleDoc = await util.gene_gogl_plan(config.nuev_plan, loJson);
    } catch (err) {
        console.log(err)
        //res.json({err})
        //throw err;
    } finally {
    }
    //console.log(googleDoc)
    
    if (googleDoc.length > 0){
        const lcInserta = `
        UPDATE gen_tipo_ofic SET plantilla = ? WHERE cve = ?  ;
        `
        //console.log(lcInserta)
        loFinal = await util.gene_cons(lcInserta, [googleDoc, req.body.lcCve]);
        //console.log(loFinal)

        return res.json({"status": true, "message":"La plantilla se creó correctamente"})
    }
    else {
        return res.json({"status": false, "message":"La plantilla no se pudo crea, por favor consultalo con el administrador"})
    }


});

const op_soficx = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //return res.json(req.body)
    lcSQL = `
        SELECT * 
            FROM gen_oficio 
            WHERE id_iden = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.lnIDIden]);
    if (rows.length <= 0){
        return res.json({"status": false, "message": "No se econtro el oficio"})
    }

    //console.log(rows)

    if (!rows[0].GDOC && req.body.lnStatus < 99 ){
        return res.json({"status": false, "message": "Debes de generar el documento antes de cambiar el status"})
    }

    lcSQL = `
        SELECT *
            FROM gen_dere_ofic 
            WHERE user_id = ? AND cve = ? AND titular >= (SELECT titular FROM gen_ofic_stat WHERE STATUS = ?)
    ` 
    const rows2 = await util.gene_cons(lcSQL, [req.userId, rows[0].CVE, req.body.lnStatus]);
    if (rows2.length <= 0 || rows[0].STATUS >= req.body.lnStatus){
        return res.json({"status": false, "message": "No cuentas con derechos para aplicar el estatus o el status ya fue aplicado"})
    }

    let rows3 = await util.gene_cons("UPDATE GEN_STAT_OFIC SET fin = NOW() where id_iden = ? and IFNULL(status,0) = ? ;", [req.body.lnIDIden, rows[0].STATUS]);
    lcSQL = `                
        INSERT INTO GEN_STAT_OFIC (idOficio, cve, usuario, inicio, nota, anio, id_iden, status) 
            VALUES (?, ?, ?, NOW(), ?, Right(Year(NOW()),2), ?, ?);
    `

    //console.log(lcSQL)
    rows3 = await util.gene_cons(lcSQL, [rows[0].IDOFICIO, rows[0].CVE, req.userId, req.body.lcStatus, req.body.lnIDIden, req.body.lnStatus]);

    rows3 = await util.gene_cons("UPDATE gen_oficio SET status = ? WHERE id_iden = ?", [req.body.lnStatus, req.body.lnIDIden])

    if (req.body.lnStatus = 2){                                         //si el estatus es firmado cambia el derecho a solo lectura

        loJson = {
            "theArg1": rows[0].GDOC, 
            "theArg2": 2,
            "theArg3": config.url_logs,
            "theArg4": rows[0].OFICIO
        }
        util.gene_gogl_doc(config.camb_dere, loJson);
    }
    

    return res.json({"status": true, "message": "Se guardaron los cambios"})

});

const op_hoficx = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `SELECT cve 
        FROM gen_dere_ofic 
        WHERE user_id = ? AND cve = ?
    `
    
    const llDere = await util.gene_cons(lcSQL, [req.userId, req.query.cve])

    if (!llDere || llDere.length <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.fecha desc) AS rank, o.depe_envi AS centros,
            CASE 
                WHEN IFNULL(o.gdoc, '') != '' AND INSTR(o.gdoc, 'docs.google.com') > 0 THEN o.gdoc 
                ELSE '' 
            END AS doc, 
            o.oficio, 
            DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha, 
            DATE_FORMAT(o.fecha, '%H:%i') AS hora, 
            o.concepto, 
            g.descrip AS stat_desc, 
            IFNULL(o.referencia, '') AS referencia, 
            IFNULL(o.anexo, '') AS anexo, 
            IFNULL(o.soli_ofic, '') AS solicitado, 
            o.cve, 
            o.idoficio, 
            YEAR(o.fecha) AS anio, 
            o.id_iden AS id, 
            o.id_iden 
        FROM 
            gen_oficio o 
        LEFT JOIN 
            gen_centros c ON o.ID_CENT = c.ID_CENT 
        LEFT JOIN 
            gen_otro_cent oc ON o.ID_CENT = oc.ID_CENT 
        INNER JOIN 
            gen_ofic_stat g ON IFNULL(o.STATUS,0) = g.STATUS 
        LEFT JOIN 
            GEN_SOLI_OFIC so ON so.num_soli = o.soli_ofic 
        LEFT JOIN 
            gen_doficio d ON d.id_iden = o.ID_IDEN AND d.tipo = 1 
        WHERE 
            o.cve = ? AND YEAR(o.fecha) = ? AND MONTH(o.fecha) BETWEEN ? AND ?
        ORDER BY 
        o.fecha DESC 
    `
    const rows = await util.gene_cons(lcSQL, [req.query.cve, req.query.anio, (!req.query.mesi?1:req.query.mesi), (!req.query.mesf?12:req.query.mesf)])
    return res.json(rows)
});

const op_ingrx2 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.anio DESC, o.nume_cont DESC) AS rank,
            o.id_ofic as id, o.*, DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fechac, DATE_FORMAT(o.fecha, '%d/%m/%Y') as fech_conv, DATE_FORMAT(o.fecha, '%H:%i') as hora, c.dependen, t.descrip as dtipo_ofic, cl.descrip as dclas_ofic,
            CONCAT(LEFT(o.asunto,254), CASE WHEN LENGTH(o.asunto) > 255 THEN '...' ELSE '' END) as asunto2, td.descrip as tipo_docu, 
        (SELECT group_concat(depen) FROM ser_depen sd WHERE FIND_IN_SET(sd.ID_DEPE, ss.ID_DEPE) > 0) AS depe_asig 
            FROM opc_oficio o INNER JOIN gen_centros c ON o.id_cent = c.id_cent 
            LEFT JOIN opc_TIPO_OFIC t ON o.ID_TIOF = t.ID_TIOF 
            LEFT JOIN OPC_CLAS_OFIC cl on o.ID_CLOF = cl.ID_CLOF 
        LEFT JOIN OPC_TIPO_DOCU td ON td.id_pk = IFNULL(o.tipo, 0) 
        LEFT JOIN ser_soli_serv ss ON o.id_ofic = ss.id_oficio 
        WHERE o.cve = ? AND asignado = 0 AND o.status NOT IN(8,9) 
        ORDER BY o.anio DESC, o.nume_cont DESC   
    `

    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.cve])
    return res.json(rows)
});

const cmb_correo = (async (req, res) => {
if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    const lcSQL = `
    `

    //const rows = await util.gene_cons(lcSQL)
    return res.json([])
});

const op_ngrupx = (async (req, res) => {
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.body)

    if (!req.body.nombre_grupo){
        return res.json({"status": false, "message": "Falta el nombre del grupo"})
    }

    loDeta = JSON.parse(req.body.grupo);

    if (!loDeta){
        return res.json({"status": false, "message": "Falta el detalle del grupo"})
    }

    //console.log(loDeta)
    const lcSQL = `
    INSERT INTO gen_op_grupo (nombre_grupo, id_cent, cambios)
        values (?, ?, CONCAT('ALTA|',?,'|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I')))
    `
    //console.log(lcSQL)
    const laInsert = await util.gene_cons(lcSQL, [req.body.nombre_grupo, req.id_cent, req.userId])

    //console.log(laInsert)

    for (var i = 0; i < loDeta.length; i++) {                   //inserta el detalle del oficio
        const lcDeta = `
        INSERT INTO gen_op_grup_deta(id_grupo, id_Cent, nombre, cargo, correo, tipo, tipo_depe, copias) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)        
        `
        const laInsertDeta = await util.gene_cons(lcDeta, [laInsert.insertId, loDeta[i].servicio, loDeta[i].nombre, loDeta[i].ocupacion, loDeta[i].correo, loDeta[i].tipo, loDeta[i].tipo_depe, loDeta[i].copias])
        //console.log(laInsertDeta)
    }

    return res.json({"status": true, "message": "El grupo se creo exitosamente"})

});

const op_reof0x = (async (req, res) => {

    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.body)
    //const form = JSON.parse(req.body.loForm)
    const form = req.body
    //console.log(form)

    let lcSQL = `SELECT cve 
        FROM gen_dere_ofic 
        WHERE user_id = ? AND cve = ?
    `
    
    const llDere = await util.gene_cons(lcSQL, [req.userId, form.cmbSoli])

    //console.log(llDere)

    if (!llDere || llDere.length <= 0 || !form.cmbSoli)        //si no tiene derechos o no se tiene dependencia
    {
        return res.render("sin_derecho")
    }

    let lcWhereT = ''
    let lcParamerT = []
    /* lcWhere = " o.cve = '" + form.cmbSoli + "'" + " AND YEAR(o.fecha) = " + form.cmbAnio */

    lcWhereT = " o.cve = ? AND YEAR(o.fecha) = ? "
    lcParamerT.push(form.cmbSoli)
    lcParamerT.push(form.cmbAnio)

    if (form.txtNOficio > 0){
        /* lcWhere = lcWhere + " AND o.idoficio >= " + form.txtNOficio */
        lcWhereT = lcWhereT + " AND o.idoficio >= ? "
        lcParamerT.push(form.txtNOficio)
    }

    if (form.txtNOficio2 > 0){
/*         lcWhere = lcWhere + " AND o.idoficio <= " + form.txtNOficio2 */
        lcWhereT = lcWhereT + " AND o.idoficio <= ? "
        lcParamerT.push(form.txtNOficio2)
    }

    if (!!form.txtFec_ini){
        /* lcWhere = lcWhere + " AND o.fecha >= '" + form.txtFec_ini.substring(0, 10) + "'" */
        lcWhereT = lcWhereT + " AND o.fecha >= ? "
        lcParamerT.push(form.txtFec_ini.substring(0, 10))
    }

    if (!!form.txtFec_fin){
        /* lcWhere = lcWhere + " AND o.fecha <= '" + form.txtFec_fin.substring(0, 10) + "'" */
        lcWhereT = lcWhereT + " AND o.fecha <= ? "
        lcParamerT.push(form.txtFec_fin.substring(0, 10))
    }

    if (form.txtDepen.length > 0){
        lcWhere = util.cade_busc("o.depe_envi", form.txtDepen)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtConcepto.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.concepto", form.txtConcepto) */
        lcWhere = util.cade_busc("o.concepto", form.txtConcepto)
        
        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtRefe.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.referencia", form.txtRefe) */
        lcWhere = util.cade_busc("o.referencia", form.txtRefe)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtAnexo.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.anexo", form.txtAnexo) */
        lcWhere = util.cade_busc("o.anexo", form.txtAnexo)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtPersona.length > 0){
        /* lcWhere = lcWhere + " AND o.id_iden in (SELECT id_iden FROM gen_doficio WHERE " + util.cade_busc("diri_nomb, diri_carg", form.txtPersona)  */
        lcWhere = util.cade_busc("diri_nomb, diri_carg", form.txtPersona) 

        lcWhereT = lcWhereT + " AND o.id_iden in (SELECT id_iden FROM gen_doficio WHERE " + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)

        if (form.cmbTipo > 0){
            /* lcWhere = lcWhere + " AND tipo = " + form.cmbTipo  */
            lcWhereT = lcWhereT + " AND tipo = ?"
            lcParamerT.push(form.cmbTipo)
        }
        /* lcWhere = lcWhere + ") "  */
        lcWhereT = lcWhereT + ") "
    }

    if (form.cmbStatus > -1){
        lcWhere = lcWhere + " AND o.status = " + form.cmbStatus
        lcWhereT = lcWhereT + " AND o.status = ? "
        lcParamerT.push(form.cmbTipo)
    }


    //console.log(lcWhere)
    
    lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.fecha desc) AS rank, o.depe_envi AS centros, 
            CASE 
                WHEN IFNULL(o.gdoc, '') != '' AND INSTR(o.gdoc, 'docs.google.com') > 0 THEN o.gdoc 
                ELSE '' 
            END AS doc, 
            o.oficio, 
            DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha, 
            DATE_FORMAT(o.fecha, '%H:%i') AS hora, 
            o.concepto, 
            g.descrip AS stat_desc, 
            IFNULL(o.referencia, '') AS referencia, 
            IFNULL(o.anexo, '') AS anexo, 
            IFNULL(o.soli_ofic, '') AS solicitado, 
            o.cve, 
            o.idoficio, 
            YEAR(o.fecha) AS anio, 
            o.id_iden AS id, 
            o.id_iden 
        FROM 
            gen_oficio o 
        LEFT JOIN 
            gen_centros c ON o.ID_CENT = c.ID_CENT 
        LEFT JOIN 
            gen_otro_cent oc ON o.ID_CENT = oc.ID_CENT 
        INNER JOIN 
            gen_ofic_stat g ON IFNULL(o.STATUS,0) = g.STATUS 
        LEFT JOIN 
            GEN_SOLI_OFIC so ON so.num_soli = o.soli_ofic 
        LEFT JOIN 
            gen_doficio d ON d.id_iden = o.ID_IDEN AND d.tipo = 1 
        WHERE 
            ${lcWhereT}
        ORDER BY 
        o.fecha DESC 
    `
    //console.log(lcSQL)
    //console.log(lcWhereT)
    //console.log(lcParamerT)

    const rows = await util.gene_cons(lcSQL, lcParamerT)
    return res.json(rows)
});


const op_rgrafx = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT mes, SUM(egreso) AS egreso, SUM(ingreso) AS ingreso, SUM(no_asignado) AS no_asignado
        FROM (SELECT DATE_FORMAT(fecha, '%b') AS mes, MONTH(fecha) AS nmes, COUNT(*) AS egreso, 0 AS ingreso, 0 AS no_asignado
                    FROM gen_oficio
                    WHERE cve = ? AND YEAR(fecha) = ?
                    group BY 1,2
                    UNION ALL 
                    (SELECT DATE_FORMAT(fecha, '%b') AS mes, MONTH(fecha) AS nmes, 0, COUNT(*), ifnull(SUM(if(IFNULL(asignado,0) = 0, 1, 0)), 0)
                        FROM opc_oficio 
                        WHERE cve = ? AND ANIO = ?
                        group BY 1,2)) datos
        group BY 1
        ORDER BY nMes
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lcCVE, req.query.lnAnio, req.query.lcCVE, req.query.lnAnio])
    return res.json(rows)

});

const op_rgrafx2 = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT mes, SUM(ingreso+egreso) AS oficio
        FROM (SELECT DATE_FORMAT(fecha, '%b') AS mes, MONTH(fecha) AS nmes, COUNT(*) AS egreso, 0 AS ingreso
                    FROM gen_oficio
                    WHERE cve = ? AND YEAR(fecha) = ?
                    group BY 1,2
                    UNION ALL 
                    (SELECT DATE_FORMAT(fecha, '%b') AS mes, MONTH(fecha) AS nmes, 0, COUNT(*)
                        FROM opc_oficio 
                        WHERE cve = ? AND ANIO = ?
                        group BY 1,2)) datos
        group BY 1
        ORDER BY nMes
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lcCVE, req.query.lnAnio, req.query.lcCVE, req.query.lnAnio])
    return res.json(rows)

});

const op_rgrafx3 = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT d.tipo_depe, d.id_cent, if(d.tipo_depe = 1, c.dependen, oc.dependen) AS centro, COUNT(*) AS total, 
			SUM(if(IFNULL(o.status,0) = 0, 1, 0)) AS s0, SUM(if(IFNULL(o.status,0) = 1, 1, 0)) AS s1,
			SUM(if(IFNULL(o.status,0) = 2, 1, 0)) AS s2, SUM(if(IFNULL(o.status,0) = 3, 1, 0)) AS s3,
			SUM(if(IFNULL(o.status,0) = 4, 1, 0)) AS s4, SUM(if(IFNULL(o.status,0) = 99, 1, 0)) AS s99
		FROM gen_oficio o INNER JOIN gen_doficio d ON o.id_iden = d.id_iden
			LEFT JOIN gen_centros c ON d.id_cent = c.id_cent
			LEFT JOIN gen_otro_cent oc ON d.id_cent = oc.id_cent
			WHERE d.tipo = 1 AND o.cve = ? AND YEAR(o.fecha) = ?
		group BY 1,2
		ORDER BY 4 DESC 
		LIMIT 10
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lcCVE, req.query.lnAnio])

    let loDatos = []
    for (i = 0; i < rows.length; i++){
        
        const lcDeta = [{id:i+'.0', value: rows[i].s0, tipo:0, label:'<br><br>ELABORACION (' + rows[i].s0 + ')'},
        {id:i+'.1', value: rows[i].s1, tipo:1, label:'<br><br>EN FIRMA (' + rows[i].s1 + ')'},
        {id:i+'.2', value: rows[i].s2, tipo:2, label:'<br><br>FIRMADO (' + rows[i].s2 + ')'},
        {id:i+'.3', value: rows[i].s3, tipo:3, label:'<br><br>ENVIADO (' + rows[i].s3 + ')'},
        {id:i+'.4', value: rows[i].s4, tipo:4, label:'<br><br>ACUSE (' + rows[i].s4 + ')'},
        {id:i+'.99', value: rows[i].s99, tipo:99, label:'<br><br>CANCELADO (' + rows[i].s99 + ')'}
        ]

        const lcGrupo = 
            {id:i, label: rows[i].centro + ' (' + rows[i].total + ')', value:rows[i].total, data:lcDeta}

        //console.log(lcGrupo)
        loDatos.push(lcGrupo)
    }

    //console.log(loDatos)

    return res.json(loDatos)

});

const op_rgrafx4 = (async (req, res) => {
    
    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT SUM(ependiente+efinalizado+ecancelado) AS etotal, SUM(ependiente) AS ependiente, SUM(efinalizado) AS efinalizado, SUM(ecancelado) AS ecancelado, 
        SUM(ipendiente+ifinalizado+icancelado) AS itotal, SUM(ipendiente) AS ipendiente, SUM(ifinalizado) AS ifinalizado, SUM(icancelado) AS icancelado
	FROM (SELECT ifnull(SUM(if(IFNULL(status,0) < 4, 1, 0)),0) AS ependiente, ifnull(SUM(if(IFNULL(status,0) = 4 and IFNULL(status,0) < 8, 1, 0)),0) AS efinalizado, 
                ifnull(SUM(if(IFNULL(status,0) > 8, 1, 0)),0) AS ecancelado, 0 as ipendiente, 0 AS ifinalizado, 0 AS icancelado
				FROM gen_oficio
				WHERE cve = ? AND YEAR(fecha) = ?
				UNION ALL 
				(SELECT 0,0,0, ifnull(SUM(if(IFNULL(asignado,0) = 0 and IFNULL(status,0) < 8, 1, 0)),0), ifnull(SUM(if(IFNULL(asignado,0) = 1 and IFNULL(status,0) < 8, 1, 0)),0), 
                    ifnull(SUM(if(IFNULL(status,0) > 8, 1, 0)),0)
					FROM opc_oficio 
					WHERE cve = ? AND ANIO = ?)
					) datos
    `
    const rows = await util.gene_cons(lcSQL, [req.query.lcCVE, req.query.lnAnio, req.query.lcCVE, req.query.lnAnio])

    return res.json(rows)

});

const busc_oficx = (async (req, res) => {

    if (req.groups.indexOf(",BUSC_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    //const form = JSON.parse(req.query.loForm)
    const form = req.body
    //console.log(form)
    //return res.json([]);

    let lcSQL = `SELECT cve 
        FROM gen_dere_ofic 
        WHERE user_id = ? AND cve = ?
    `
    
    const llDere = await util.gene_cons(lcSQL, [req.userId, form.cmbSoli])

    //console.log(llDere)

    if (!llDere || llDere.length <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcWhereT = ''
    let lcParamerT = []

/*     lcWhere = " o.cve = '" + form.cmbSoli + "'" + " AND YEAR(o.fecha) = " + form.cmbAnio */

    lcWhereT = " o.cve = ? AND YEAR(o.fecha) = ? "
    lcParamerT.push(form.cmbSoli)
    lcParamerT.push(form.cmbAnio)

    if (form.txtNOficio > 0){
/*         lcWhere = lcWhere + " AND o.descrip >= " + form.txtNOficio */
        lcWhereT = lcWhereT + " AND o.descrip like ?"
        lcParamerT.push(`%${form.txtNOficio}%`)

    }

    if (form.txtControl > 0){
/*         lcWhere = lcWhere + " AND o.nume_cont <= " + form.txtNOficio2 */
        lcWhereT = lcWhereT + " AND o.nume_cont = ? "
        lcParamerT.push(form.txtControl)
    }

    if (!!form.txtFec_ini){
        /* lcWhere = lcWhere + " AND o.fecha >= '" + form.txtFec_ini.substring(0, 10) + "'" */
        lcWhereT = lcWhereT + " AND o.fecha >= ? "
        lcParamerT.push(form.txtFec_ini.substring(0, 10))

    }

    if (!!form.txtFec_fin){
        /* lcWhere = lcWhere + " AND o.fecha <= '" + form.txtFec_fin.substring(0, 10) + "'" */
        lcWhereT = lcWhereT + " AND o.fecha <= ? "
        lcParamerT.push(form.txtFec_fin.substring(0, 10))
    }

/*     if (form.txtDepen.length > 0){
        lcWhere = lcWhere + " AND " + util.cade_busc("c.dependen", form.txtDepen)
    }
 */

    if (form.txtDepen.length > 0){
        lcWhere = util.cade_busc("if(o.tipo_depe = 1, c.dependen, oc.dependen)", form.txtDepen)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtAsunto.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.asunto", form.txtAsunto) */
        lcWhere = util.cade_busc("o.asunto", form.txtAsunto)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtNota.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.nota", form.txtNota) */
        lcWhere = util.cade_busc("o.nota", form.txtNota)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    if (form.txtRemitente.length > 0){
        /* lcWhere = lcWhere + " AND " + util.cade_busc("o.nomb_remi", form.txtRemitente) */
        lcWhere = util.cade_busc("o.nomb_remi", form.txtRemitente)

        lcWhereT = lcWhereT + ' AND ' + lcWhere.sql
        lcParamerT = lcParamerT.concat(lcWhere.params)
    }

    /* if (form.txtPersona.length > 0){
        lcWhere = lcWhere + " AND o.id_iden in (SELECT id_iden FROM gen_doficio WHERE " + util.cade_busc("diri_nomb, diri_carg", form.txtPersona) 
        if (form.cmbTipo > 0){
            lcWhere = lcWhere + " AND tipo = " + form.cmbTipo 
        }
        lcWhere = lcWhere + ") " 
    }
 */
    if (form.cmbStatus > -1){
        lcWhere = lcWhere + " AND o.status = " + form.cmbStatus

        lcWhereT = lcWhereT + " AND o.status = ? "
        lcParamerT.push(form.cmbStatus)
    }

    //console.log(lcWhere)
    
    lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.fecha desc) AS rank, o.nume_cont, o.id_ofic as idoficio, o.descrip, if(o.tipo_depe = 1, c.dependen, oc.dependen) as centros,
            DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fecha, DATE_FORMAT(o.fecha, '%H:%i') AS hora, o.asunto, o.nota, o.nomb_remi,
            if(o.status = 1, 'PROCESO', if(o.status = 8, "APLICADO", if(o.status = 9, "CANCELADO", "DESCONOCIDO"))) AS stat_desc
        FROM 
            opc_oficio o 
        LEFT JOIN 
            gen_centros c ON o.ID_CENT = c.ID_CENT 
        LEFT JOIN 
            gen_otro_cent oc ON o.ID_CENT = oc.ID_CENT 
        WHERE 
            ${lcWhereT}
        ORDER BY 
        o.fecha DESC 
    `
    console.log(lcSQL)
    console.log(lcParamerT)
    //return res.json([]);
    const rows = await util.gene_cons(lcSQL, lcParamerT)
    return res.json(rows)
});

const new_ord__servx = (async (req, res) => {

    if (req.groups.indexOf(",ASIG_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    let lcSQL = ''
    //console.log(req.query)

/*      lcSQL = `
    SELECT s.cve, s.id_depe, s.depen, s.piso, ss.codigo, ss.id_serv_pk, CONCAT('(', p.codigo, ') ', p.apepat, ' ', p.apemat, ' ', p.nombre) AS nombre, ss.correo  
        from ser_depen s LEFT JOIN ser_soli_serv ss ON s.id_depe = ss.id_depe
            LEFT JOIN gen_personas p ON ss.codigo = p.codigo
            WHERE cve IN (SELECT cve FROM opc_oficio WHERE id_ofic = ${req.query.lnOficio})
        ORDER BY 2,7
    `
 */    //console.log(lcSQL)
    lcSQL = `   
    SELECT o.cve, IFNULL(s.id_depe, '') AS id_depe 
        FROM opc_oficio o LEFT JOIN ser_soli_serv s ON o.ID_OFIC = s.id_oficio 
        WHERE o.id_ofic = ?
    `
    const loSeek = await util.gene_cons(lcSQL, [req.query.lnOficio])
    console.log(loSeek)
    
/*     lcSQL = `

    SELECT cve, id_depe, depen, piso, if(LOCATE(CONCAT(',',id_depe,','), ',${req.query.loDepe},') > 0, "true", "") AS marcado
        from ser_depen 
            WHERE cve = '${req.query.loCVE}'
        ORDER BY 2
    `

    lcSQL = `
    SELECT s.cve, s.id_depe, s.depen, s.piso, ss.codigo, ss.id_serv_pk, CONCAT('(', p.codigo, ') ', p.apepat, ' ', p.apemat, ' ', p.nombre) AS nombre, ss.correo,
            if(LOCATE(CONCAT(',',s.id_depe,','), ',${loSeek[0].id_depe},') > 0, "true", "") AS marcado  
        from ser_depen s LEFT JOIN ser_soli_serv ss ON s.id_depe = ss.id_depe
            LEFT JOIN gen_personas p ON ss.codigo = p.codigo
            WHERE cve IN (SELECT cve FROM opc_oficio WHERE id_ofic = ${req.query.lnOficio})
        ORDER BY 2,7;
    `
 */   
   lcSQL = `
    SELECT s.cve, s.id_depe, if(ifnull(s.id_depe_padr, 0) = 0, s.id_depe, s.id_depe_padr) AS id_depe_padr, s.depen, s.piso, s.jefe_cargo, 
			s.codigo, CONCAT(p.apepat, ' ', p.apemat, ' ', p.nombre) AS nombre,
            if(LOCATE(CONCAT(',',s.id_depe,','), ',${loSeek[0].id_depe},') > 0, "true", "") AS marcado
        FROM ser_depen s LEFT JOIN gen_personas p ON s.codigo = p.codigo
            WHERE cve IN (SELECT cve FROM opc_oficio WHERE id_ofic = ?)
        ORDER BY if(ifnull(s.id_depe_padr, 0) = 0, s.id_depe, s.id_depe_padr), s.depen, p.APEPAT, p.apemat
    `

    console.log(lcSQL)

    const rows = await util.gene_cons(lcSQL, [req.query.lnOficio])

    let loPadre = [], loHijo = [], lnDepe = 0, lcNombre = ''
    
    for(i = 0; i < rows.length; i++){
        if (lnDepe != rows[i].id_depe_padr){
            lnDepe = rows[i].id_depe_padr
            loHijo = []
        }

        if(rows[i].id_depe != rows[i].id_depe_padr){
            loHijo.push({id:+rows[i].id_depe, depen:rows[i].nombre, checked:(rows[i].marcado==''?false:true)})
        }
        else 
        {
            loPadre.push({id:rows[i].id_depe, depen:rows[i].depen + ' (' + rows[i].jefe_cargo + ')', data:loHijo, checked:(rows[i].marcado==''?false:true)})
        }
    }


    return res.json(loPadre)

});

const new_ord_servx2 = (async(req, res) => {

    if (req.groups.indexOf(",ASIG_OFIC,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcInsert = '', lcSQL = ''
    //console.log(req.body);

    const loForm = JSON.parse(req.body.form)
    /* laArea = req.body.lcAreas.split(',')

    for(i=0; i < laArea.length; i++){
        
    } */
    if (!req.body.lcAreas){
        return res.json({"error":true, "message":"Por lo menos debes seleccionar una dependencia"})
    }
    

    lcSQL = `
        SELECT * 
            FROM ser_soli_serv
            WHERE id_oficio = ?
    `
    const loSeek = await util.gene_cons(lcSQL, [req.body.lnOficio])
    let parameters = []
    //console.log(loSeek)

    if (loSeek.length > 0){
        lcInsert = `
            UPDATE ser_soli_serv SET id_depe = ?, descrip = ?,  
            cambios = CONCAT(cambios, CHAR(13,10), 'MODIFICADO|',?,'|', DATE_FORMAT(NOW(), '%d/%m/%Y %h:%i %p')) 
            WHERE id_oficio = ${req.body.lnOficio}
        `
        parameters = [req.body.lcAreas, (!loForm.txtDescrip? '': loForm.txtDescrip), req.userId]
    }
    else {
        lcInsert = `
            INSERT INTO ser_soli_serv (id_cent, id_oficio, id_depe, fecha, descrip, oficio, usua_alta, fech_alta, cambios) 
                VALUES(?, ?, ?, NOW(), ?, 1, ?, 
                NOW(), CONCAT('ALTA|',?,'|', DATE_FORMAT(NOW(), '%d/%m/%Y %h:%i %p')));
        `
        parameters = [req.id_cent, req.body.lnOficio, req.body.lcAreas, (!loForm.txtDescrip? '': loForm.txtDescrip), req.userId, req.userId]
    }

    let rowsi = await util.gene_cons(lcInsert, parameters)
    
    lcInsert = `
        UPDATE opc_oficio SET asignado = 1 
            WHERE id_ofic = ?;
    `
    //console.log(lcInsert)
    rowsi = await util.gene_cons(lcInsert, [req.body.lnOficio])

    lcSQL = `
        SELECT o.*, p.nombre as envio, c.dependen as depe_envi
            FROM opc_oficio o LEFT JOIN opc_segu_ofic s ON o.id_ofic = s.id_ofic
            	LEFT JOIN passfile p ON s.user_id = p.user_id
            	LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
            WHERE o.id_ofic = ?

        `
    
    const rows = await util.gene_cons(lcSQL, [req.body.lnOficio]) 

    
    lcSQL = `
        SELECT s.*, (SELECT correo FROM ser_depen WHERE id_depe = s.id_depe_padr LIMIT 1) AS corr_jefe,
                (SELECT depen FROM ser_depen WHERE id_depe = s.id_depe_padr LIMIT 1) AS depe_titu
            FROM ser_depen s
            WHERE id_depe IN (?) AND IFNULL(correo, '') <> ''
        `
    
    const rows2 = await util.gene_cons(lcSQL, [req.body.lcAreas])

    //console.log(lcSQL)

    //console.log(rows2)
    //console.log(rows)
    const opciones = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
    };
    
    for(i=0; i < rows2.length; i++){
        //[RESPONSABLE],[UNIDAD],[NUME_OFIC],[FECHA],[ORIGEN],[ASUNTO],[NUME_CONT]
        let loCampo = []

        loCampo.push(rows2[i].jefe_cargo)
        loCampo.push((!rows2[i].DEPEN?rows2[i].depe_titu:rows2[i].DEPEN))
        loCampo.push(rows[0].DESCRIP)
        loCampo.push(new Intl.DateTimeFormat('es-MX', opciones).format(rows[0].FECHA))
        loCampo.push(rows[0].NOMB_PROC)
        loCampo.push(rows[0].ASUNTO)
        loCampo.push(rows[0].NUME_CONT)
        loCampo.push(rows[0].envio.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()) + ' (' + rows[0].depe_envi + ')')
        loCampo.push(rows[0].ID_OFIC)

        //console.log(rows2[i].jefe_cargo)
        lcResp = outil.envi_corr(3, rows2[i].CORREO+(!rows2[i].corr_jefe, '', ';'+rows2[i].corr_jefe), loCampo);
        
    }

    return res.json({"error":false, "message":"La asignación fue correcto y se empezarán a enviar los correos"})

});

const detalle_ofic_Nox = (async(req,res) =>{
    
    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query);

    lcSQL = `
        SELECT o.cve, o.anio as anio_ingr, o.nume_cont, DATE_FORMAT(o.fech_ofic, '%d/%m/%Y') as fech_ofic, DATE_FORMAT(o.fecha, '%d/%m/%Y') AS fech_rece, 
                DATE_FORMAT(o.fecha, '%H:%i') AS hora_rece, o.descrip as nume_ofic, o.nomb_remi as remi_nomb, o.carg_remi as remi_carg, ifnull(o.tipo_info, 0) as tipo_info, 
                c.dependen as txtDepen, o.nomb_dest as dest_nomb, ifnull(o.carg_dest, '') as dest_carg, o.tipo_depe as rbDepe, o.id_tiof as tipo_ofic, o.id_clof as clase, 
                o.asunto, IFNULL(o.nota, '') as nota, IFNULL(o.info_sens, 0) as info_sens, o.tipo_ingr, o.nomb_copi, o.carg_copi 
            FROM opc_oficio o left join gen_centros c on o.id_cent = c.id_cent
            WHERE id_ofic = ?
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.lnOficio])

    return res.json(rows)
});

const csg_sServx2 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcParamerT = []

    let lcSQL = `
    SELECT id_depe 
        FROM ser_depen 
        WHERE codigo = ?
    `
    const asigna = await util.gene_cons(lcSQL, [req.codigo])

    if (asigna.length <= 0){
        return res.json([])    
    }

    let lcWhere = ""

    for(i = 0; i < asigna.length; i++){
        lcWhere = lcWhere + (lcWhere.length > 0?' OR ':'') + "FIND_IN_SET('" + asigna[i].id_depe + "', s.id_depe) > 0"
    }

    lcWhere = " s.oficio = 1 AND (" + lcWhere + ")"

    if (!!req.query.inicio){
        lcWhere = lcWhere + " AND o.fech_ofic >= ? "
        lcParamerT.push(req.query.inicio.substring(0, 10))
    }

    if (!!req.query.fin){
        lcWhere = lcWhere + " AND o.fech_ofic <= ? "
        lcParamerT.push(req.query.fin.substring(0, 10))
    }

    console.log(lcWhere)
    lcSQL = `
    SELECT s.id_serv_pk as id, o.descrip as oficio, o.nomb_remi, CASE o.tipo_depe WHEN 1 THEN c.descrip ELSE oc.descrip END as area_remi
        , s.descrip as nota, o.asunto, DATE_FORMAT(o.fech_ofic, '%d/%m/%Y %H:%i') AS fech_ofic, o.nomb_dest, p.nombre as realizo, s.id_oficio
        , CASE IFNULL(o.status,0) WHEN 1 THEN 'PROCESO' WHEN 8 THEN 'APLICADO' WHEN 0 THEN 'ELABORADO' ELSE 'CANCELADO' END AS estado
        , DATE_FORMAT(s.FECHA, '%d/%m/%Y %H:%i') as fecha_asig
        FROM ser_soli_serv s 
        INNER JOIN opc_oficio o ON s.id_oficio = o.id_ofic 
        INNER JOIN passfile p ON o.usuario = p.user_id 
        LEFT JOIN gen_centros c ON o.cent_proc = c.id_cent AND o.tipo_depe = 1
        LEFT JOIN gen_otro_cent oc ON o.cent_proc = oc.id_cent AND o.tipo_depe = 2 
        WHERE ${lcWhere}
    `

    //console.log(lcSQL)
    //console.log(lcParamerT)
    const rows = await util.gene_cons(lcSQL, lcParamerT)

    return res.json(rows)


});

const seg_oficx = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
    SELECT s.ID_OFIC, DATE_FORMAT(s.fecha, "%d/%m/%Y %H:%i") AS FECHA, IF(STATUS = 1, "EN PROCESO", IF(STATUS = 8, "APLICADO", "CANCELADO")) AS STATUS,
		    p.NOMBRE, s.NOTA, s.ID_TRAM
	    FROM opc_segu_ofic s LEFT JOIN passfile p ON s.user_id = p.user_id
        WHERE id_ofic = ?
        ORDER BY s.fecha DESC

    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.lnOficio])

    return res.json(rows)


});

const seg_oficx2 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL

    lcSQL = `
        SELECT id_ofic, status 
        FROM opc_oficio 
        WHERE id_ofic = ?
    `
    const loSeek = await util.gene_cons(lcSQL, [req.body.lnOficio])

    if (loSeek[0].status > 1){
        return res.json({"error":true, "mensage":"El oficio se encuentra cerrado, ya no se puede dar seguimiento"})
    }

    //console.log(req.body)
    
    loForm = JSON.parse(req.body.form)
    //console.log(loForm)

    //return res.json([])
    lcSQL = `
    INSERT INTO opc_segu_ofic (id_ofic, fecha, STATUS, nota, user_id, id_tram) 
        VALUES (?, now(), ?, ?, ?, ?);
    `
    let rows = await util.gene_cons(lcSQL, [req.body.lnOficio, loForm.cmbStatus, loForm.txtNota, req.userId, (!loForm.txtTramite?0:loForm.txtTramite)])
    lcSQL = `
    UPDATE opc_oficio SET status = ? WHERE id_ofic = ?
    `
    rows = await util.gene_cons(lcSQL, [loForm.cmbStatus, req.body.lnOficio])

    //console.log(lcSQL)
    

    return res.json({"error":false, "mensage":"El seguimiento se guardo correctamente"})

});

const recu_arch = (async (req, res) => {

    //console.log(req.query.out)
    lcSQL = `
    SELECT UID AS id, DESCRIP as nombre
	    FROM opc_archivo 
        WHERE id_ofic = ? ?
        ORDER BY fecha DESC

    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.lnOficio, (!req.query.out?'':' and ofic_out = 1')])

    return res.json(rows)

});

const adownload = (async (req, res) => {

    let lcSQL = ''
    
    if (req.groups.indexOf(",OP_TOTA,") < 0){
        if (req.groups.indexOf(",OFICIO,") < 0){        //si no tiene derechos
            return res.render("sin_derecho")
        }
        else {
            lcSQL = `
        SELECT * 
            FROM ser_depen 
            WHERE locate(id_depe, (SELECT id_depe 
                                                FROM ser_soli_serv 
                                                WHERE id_oficio = ? LIMIT 1)) AND codigo = ?
        `
            console.log(lcSQL)
            const dere = await util.gene_cons(lcSQL, [req.query.id, req.userId])

            console.log(dere)

            if (!dere || dere.length <= 0){
                return res.render("sin_derecho")
            }
        }
    }
        
    lcSQL = `
    SELECT *
	    FROM opc_archivo 
        WHERE UID = ?
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.id])

    if (!rows || rows.length <= 0){
        return res.send("No se econtro el archivo en la base de datos")
    }

    //console.log(rows)

    //const ruta_fisica = config.SERV_ARCH + 'OPARCHIVO/' + rows[0].ID_ARCH + path.extname(rows[0].DESCRIP);
    const nombreArchivo = rows[0].ID_ARCH + path.extname(rows[0].DESCRIP).toUpperCase();
    const ruta_fisica = path.join(config.SERV_ARCH, 'OPARCHIVO', nombreArchivo);
    
    //absolutePath = path.resolve(__dirname, 'uploads', ruta_fisica);
    const absolutePath = path.resolve(ruta_fisica);
    console.log(absolutePath)

    if (!fs.existsSync(absolutePath)) {
        return res.status(404).send("El archivo no existe en el servidor.");
    }

    res.download(absolutePath, rows[0].DESCRIP, (err) => {
        if (err) {
            console.error("Error en la descarga:", err);
        }
    });
});

const op_nareax = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL

    lcSQL = `
    SELECT id_depe AS id,cve, depen AS value, piso, desc_piso 
        FROM ser_depen c 
        WHERE cve in (SELECT DISTINCT cve FROM GEN_DERE_OFIC WHERE user_id = ?)
    `
    const rows = await util.gene_cons(lcSQL, [req.userId])

    return res.json(rows)
});

const op_uoficio = (async (req, res) => {

    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(laExtencion != 'PDF'){
        return res.json({"status" : false, "message": "Sólo se permiten archivos con extención PDF", "data":{}})
    }

    //inserta el registro para guardar el archivo de la oficialía
    let lcSQL = `
    INSERT INTO opc_archivo (id_ofic, descrip, fecha, usuario, ofic_out, uid) 
        VALUES (?, ?, now(), ?, ?, ?)
    `

    const laInsert = await util.gene_cons(lcSQL, [req.body.idOficio, req.file.originalname, req.userId, (!req.body.out?0:1), util.gene_id_11()])
    //console.log(laInsert)

    const lfOriginal  = path.join(__dirname, "../uploads/", req.file.filename)
    //const lfDestino = config.SERV_ARCH  + 'OPARCHIVO\\' + laInsert.insertId + '.' + laExtencion 
    const lfDestino = path.join(config.SERV_ARCH, 'OPARCHIVO', laInsert.insertId + '.' + laExtencion);

    //console.log(lfOriginal)
    //console.log(lfDestino)

    try {
        //await fs.copyFile(lfOriginal, lfDestino);
        await fs.promises.copyFile(lfOriginal, lfDestino);
        if (!fs.existsSync(lfDestino)) {
            
            lcSQL = `
    DELETE FROM opc_archivo WHERE id_arch = ?
    `
            const laDelete = await util.gene_cons(lcSQL, [laInsert.insertId])
            return res.json({"status" : false, "message": "Error al guardar el archivo"});
        }
        //console.log('¡Archivo copiado con éxito!');
    } catch (err) {
        //console.log(err);
        lcSQL = `
    DELETE FROM opc_archivo WHERE id_arch = ?
    `
        const laDelete = await util.gene_cons(lcSQL, [laInsert.insertId])
        return res.json({"status" : false, "message": "Error al guardar el archivo"});
    }

    return res.json({"status" : "server", "message": "El archivo se cargo correctamente"});

});


module.exports = {
    op_cucsx2,
    op_oficx5,
    cmb_controlw,
    op_bplanx,
    op_nplantix,
    op_noficx6,
    op_noficx7,
    op_noficx4,
    op_bgrupx,
    op_noficx5,
    op_gofic,
    op_sdoficx,
    op_admix2,
    op_ningrx2,
    op_ningrx3,
    cmb_control2W,
    cmb_control3W,
    op_ningrx,
    op_admix,
    op_nplan,
    op_soficx,
    op_hoficx,
    op_ingrx2,
    cmb_correo,
    op_ngrupx,
    op_reof0x,
    op_rgrafx,
    op_rgrafx2,
    op_rgrafx3,
    op_rgrafx4,
    busc_oficx,
    new_ord__servx,
    new_ord_servx2,
    detalle_ofic_Nox,
    csg_sServx2,
    seg_oficx,
    seg_oficx2,
    recu_arch,
    adownload,
    op_nareax,
    op_uoficio
}