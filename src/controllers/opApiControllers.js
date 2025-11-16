const { link } = require("fs/promises");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const outil = require(path.join(__dirname, "..", "utils/other_utils"));

const op_cucsx2 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT cve, depen as descrip, clave,
            (SELECT COUNT(*) as total FROM gen_oficio WHERE cve = t.cve AND status IN(1,2)) as cant,
            (SELECT COUNT(*) AS MODI FROM gen_oficio WHERE cve = t.cve AND status IN(1,2) AND modificado = 1) AS modificado 
        FROM gen_tipo_ofic t
        WHERE cve in (SELECT DISTINCT cve FROM gen_dere_ofic WHERE user_id = ${req.userId})
        ORDER BY cve
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)

});

const op_oficx5 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.fecha desc) AS rank,
        if(ifnull(o.tipo_depe,1) = 1, c.descrip, oc.descrip) AS centros, 
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
            o.solicito = ${req.userId} AND IFNULL(o.status, 0) < 4 AND o.cve IN ( 
                SELECT cve 
                FROM GEN_DERE_OFIC 
                WHERE user_id = ${req.userId} 
            ) 
        ORDER BY 
        o.fecha DESC 
    `
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const cmb_controlw = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcBusca = req.query['filter[value]']
    
    const lcSQL = `
    SELECT id_ofic as id
                , CONCAT('(', o.cve, '/', CAST(nume_cont AS CHAR), '/', CAST(anio AS CHAR), '/', IFNULL(t.descrip,'Ingreso'), '/', CASE WHEN IFNULL(o.letra, '') != '' THEN '-' ELSE '' END, IFNULL(o.letra, ''), ')', ' ', LEFT(o.descrip, 20)) AS value
                , anio, o.descrip 
                , IFNULL(t.descrip,'Ingreso') as   tipo, IFNULL(o.letra, '') as letra 
        FROM opc_oficio o
        LEFT JOIN OPC_TIPO_docu t oN t.id_pk = o.TIPO
        WHERE nume_cont > 0 AND RTRIM(LTRIM(nume_cont))  LIKE '%${lcBusca}%'
            and cve in (SELECT CVE FROM GEN_DERE_OFIC WHERE USER_ID = ${req.userId}) 
        ORDER BY anio desc, nume_cont, o.cve LIMIT 20
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});


const op_bplanx = (async (req, res) => {
    
    const lcNombre = req.nom_usu;
    let lcGROUPS = req.groups

    const lcSQL = `
    SELECT g.id_plantilla_pk as id, 0 as marcar, g.nombre, g.descrip  
        FROM gen_ofic_plan g 
        WHERE g.id_cent = ${req.query.lnId_cent} 
        ORDER BY 3
    `
    
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)

    
});

const op_nplantix = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL 
    if (req.body.id > 0){
    lcSQL = `
        UPDATE gen_ofic_plan 
            SET nombre = "${req.body.nombre}", descrip = "${req.body.descrip}", cambios = CONCAT(IFNULL(cambios,''),CHAR(13,10),'UPDATE|',
            '${req.userId}','|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I')) WHERE id_plantilla_pk = ${req.body.id}; 
        `
    }
    else {
    lcSQL = `
        INSERT INTO gen_ofic_plan (nombre, descrip, id_cent, cambios) 
            VALUES("${req.body.nombre}", "${req.body.descrip}", ${req.body.id_cent}, CONCAT('ALTA|','${req.userId}','|',DATE_FORMAT(NOW(), '%m/%d/%Y %H:%I'))); 
        `
    }
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    
    return res.json({"error":false, "message":rows})
} );

const op_noficx4 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    console.log(req.query.lnTipo == 1)
    let lcSQL = {}
    if (req.query.laId <= 0){
        return res.json({"error":true, "mensage":"Falto seleccionar un id"})
    }
    if (req.query.lnTipo == 1){
        lcSQL = `
        SELECT * FROM ( 
            SELECT  d.id_grup_deta, d.id_cent as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, IFNULL(c.descrip, '') as nomb_serv, IFNULL(d.copias, '') as copias 
                FROM GEN_OP_GRUP_DETA d 
                LEFT JOIN GEN_CENTROS c ON d.id_cent = c.ID_CENT 
                WHERE tipo_depe = 1 AND id_grupo IN (${req.query.laId})  
        UNION ( 
            SELECT d.id_grup_deta, d.id_cent as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, IFNULL(c.descrip, '') as nomb_serv, IFNULL(d.copias, '') as copias 
                FROM GEN_OP_GRUP_DETA d 
                LEFT JOIN GEN_OTRO_CENT c ON d.id_cent = c.ID_CENT  
                WHERE tipo_depe = 2  AND id_grupo IN (${req.query.laId})  ) 
        UNION ( 
            SELECT d.id_grup_deta, 0 as servicio, d.nombre, d.cargo as ocupacion, d.correo, d.tipo, d.tipo_depe, SPACE(70) as nomb_serv, IFNULL(d.copias, '') as copias  
                FROM GEN_OP_GRUP_DETA d  WHERE tipo_depe = 0  AND id_grupo IN (${req.query.laId}) ) ) Datos 
            order by id_grup_deta        `
    }
    else {
        lcSQL = `
            SELECT descrip
                FROM GEN_OFIC_PLAN 
                WHERE id_plantilla_pk = ${req.query.laId} 
        `
    }
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)

});

const op_noficx7 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    
    lcSQL = `
        SELECT corr_ofic, diri_nomb, diri_carg 
            from gen_doficio 
            WHERE id_cent = ${req.query.id} AND tipo_depe = 1 
            ORDER BY id_iden DESC LIMIT 1
        `
    
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)

});

const op_bgrupx = (async (req, res) =>{

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
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
            WHERE g.id_cent = ${req.query.lnId_cent}
            GROUP BY
                g.nombre_grupo
            ORDER BY 2
    `
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)

});

const op_noficx5 = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.body)
    //console.log(!req.body.txtConcepto || !req.body.cmbSoli)
    
    if (!req.body.txtConcepto || !req.body.cmbSoli){
        return res.json({"status" : false, "message": "Los campos con * son obligatorios"});
    }

    laDeta = JSON.parse(req.body.txtGrid)
    let llError = false;
    let lnDirigido = 0

    for (var i = 0; i < laDeta.length; i++) {
        if (!laDeta[i].nombre || !laDeta[i].ocupacion || !laDeta[i].correo){
            llError = true;
            break;
        }
        lnDirigido = lnDirigido + (laDeta[i].tipo === 1 ? 1 : 0)
    }
    //console.log(lnDirigido)

    if (!laDeta || llError){
        return res.json({"status" : false, "message": "Faltan datos en las dependencia"});
    }
    
    if (lnDirigido <= 0){
        return res.json({"status" : false, "message": "Debes ingresar por lo menos un tipo Dirigido a"});
    }

    //console.log(req.body)

    const laDepen = await util.gene_cons("select * from gen_tipo_ofic where cve = '" + req.body.cmbSoli + "'")
    console.log(laDepen)

    if (!laDepen){
        return res.json({"status" : false, "message": "No se pudo recuperar información de la dependencia"});
    }

    //console.log(laDepen[0].CVE)
    console.log("'" + (!laDepen[0].cve_compartir ?laDepen[0].CVE : laDepen[0].cve_compartir) + "'")
    const laID = await util.gene_cons("CALL SP_NEWID ('" + (!laDepen[0].cve_compartir ?laDepen[0].CVE : laDepen[0].cve_compartir) + "', '')")

    if (!laID[0][0].nextid){
        return res.json({"status" : false, "message": "Hay problema al obtener el folio"});
    } 

    const lcOficio = config.ante_ofic + (!laDepen[0].PREVIO ? '' : laDepen[0].PREVIO) + laDepen[0].CVE + '/' + laID[0][0].nextid + '/' + new Date().getFullYear().toString();
    const lcclav_ofic = util.gene_id_11()
    lcSQL = `
        INSERT INTO gen_oficio (idOficio, cve, oficio, fecha, clave, concepto, referencia, anexo, 
                solicito, usuario, clav_soli, lud, tipo_depe, clav_ofic, cent_soli, soli_ofic, soli_moti, area_rh, nombra, pers_firma, id_seccion) 
            VALUES (${laID[0][0].nextid}, '${laDepen[0].CVE}', '${lcOficio}', NOW(), ${laDepen[0].CLAVE}, '${req.body.txtConcepto}', '${req.body.txtRefe}', '${req.body.txtAnexo}', 
            '${req.userId}', '${req.userId}', '${req.centro}', NOW(), ${laDeta[0].tipo_depe}, '${lcclav_ofic}', ${req.id_cent}, '${req.body.cmbSoli_ofic}', '${req.body.txtSoli_moti}', 
            ${!req.body.cmbTipoFormatoRH ? 0 : req.body.cmbTipoFormatoRH}, ${!req.body.nombramiento ? 0 : req.body.nombramiento}, ${!req.body.firma ? 0 : req.body.firma}, 
                ${!req.body.seccion ? 0 : req.body.seccion})
    `

    const laInsert = await util.gene_cons(lcSQL)            //inserta el oficio
    
    if (!laInsert.insertId){
        return res.json({"status" : false, "message": "No se pudo registrar el oficio, por favor comentelo con el administrador"});
    }

    laStatus = `
        INSERT INTO GEN_STAT_OFIC (idOficio, cve, usuario, inicio, nota, anio, id_iden) 
            VALUES (${laID[0][0].nextid}, '${laDepen[0].CVE}', '${req.userId}', NOW(), '${req.body.txtStatus}', Right(Year(NOW()),2), ${laInsert.insertId})
    `
    const laInsertStat = await util.gene_cons(laStatus)
    console.log(laInsertStat)

    for (var i = 0; i < laDeta.length; i++) {                   //inserta el detalle del oficio
        const lcDeta = `
        INSERT INTO gen_doficio (id_iden, id_cent, corr_ofic, Diri_nomb, diri_carg, tipo_depe, tipo, clav_ofic, cambios, copias) 
            VALUES(${laInsert.insertId}, ${laDeta[i].servicio}, '${laDeta[i].correo}', '${laDeta[i].nombre}', '${laDeta[i].ocupacion}', ${laDeta[i].tipo_depe}, 
            ${laDeta[i].tipo}, '${lcclav_ofic}', 'ALTA|${req.userId}|${new Date().toISOString()}', '${laDeta[i].copias}')
        `
        console.log(lcDeta)
        const laInsertDeta = await util.gene_cons(lcDeta)
        console.log(laInsertDeta)
    }
    
    return res.json({"status" : true, "message": "El oficio se inserto correctamente"});

});

const op_gofic = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const loUsuario = await util.gene_cons("SELECT IFNULL(apepat, '') as apepat, IFNULL(apemat, '') as apemat, IFNULL(nombre, '') as nombre FROM gen_personas WHERE codigo = " + req.codigo);


    lcSQL = `
        SELECT t.iniciales, t.plantilla, t.nomb_firm, t.carg_firm, c.dependen 
            FROM gen_tipo_ofic t left join gen_centros c on t.ID_CENT = c.id_cent 
            WHERE cve = 'CG'
    `
    const loFirma = await util.gene_cons(lcSQL)

    lcSQL = `
        SELECT o.cve, o.idoficio, o.fecha, o.oficio, o.concepto as oConcepto, IFNULL(o.Diri_nomb, space(70)) as Pnombre, IFNULL(d.corto, '') as area_rh
            ,IFNULL(o.diri_carg, space(70)) AS Pcargo, IFNULL(o.Aten_nomb, space(70)) as Anombre, IFNULL(o.Aten_carg, space(70)) as Acargo, o.Clav_Soli
            ,o.clave, o.clav_ofic  , IFNULL(o.gdoc,'' ) AS GDOC, YEAR(o.fecha) as anio, IFNULL(o.pers_firma, 0) AS pers_firma
        FROM gen_oficio o LEFT JOIN gen_centros c ON o.clave = c.clave 
            LEFT JOIN ser_depen d ON o.area_rh = d.id_depe 
        WHERE o.id_iden = ${req.body.lnIden}
        ORDER BY o.fecha DESC
    `
    const rows = await util.gene_cons(lcSQL)
    const loQR = await util.generarQrBase64("https://www.ejemplo.com")
    
    let lnQR = loQR
    if (loQR.indexOf(",") > 0){
        lnQR = loQR.substring(loQR.indexOf(",")+1);
    }
    
    //const lnQR = "iVBORw0KGgoAAAANSUhEUgAAAFIAAABSCAIAAABIThTMAAACvElEQVR42u2Zy24sIQxEM///0ZNI2TByV/Up04sohsXVFQ/bx82Aqby+cHu/3z//vl4v2L+O/rbfOev8dXRtdaaPx8+8sD8aW7n3QfhErGt9v1qrIvHYxMLBvtvAPCAFUO0Qjypx/PNUywc7CSINqELuHFe+52A/h60wFDw58Phh6aM62Am2at4Bma9GfUJ3LjO/ajY2aeR4+wv/J20qNrl46ibhoayr1vRVmzXFalTZCSiGYq8m0meGD53YIYeQT7q3puZPxebXkoJMC9s0NSQFClJZnoqtjPIHgE8E2X7EgprDU/BheTQ2l/WqS9XSkpbDKy/8Ej3YSaHHH6Rp6D5BPcHwIvKh2OmRs3/YEAwiXXHsumoqdjWnFq8tLWnUqv0DTK1F5cpQ7BrWU2UJSUfPmv+h3Vg+2EGhQo4ZLgCrEH1sXLq4GB2N3dveyo1H8gl6Krk3P7TR2D44NYcUp8QyF6q4/HhTbo3G9psqdVBXkUeFSs2OOKE+wFRsXjDW5n8O/FLpycaqketzKnYvRO+SzOQhkq1Ltv0H3VDsVHzjGDuHk/8YqbRQ+2dj1+HquCcz7T8h0iuQJG4qtprEje5Liz15qCceInXln2PzRxzf6jsSP59Dor1I+lBs9EwLSxSOsSP61hi4pDUb2wetRve3twqLP2lr6lG6DzaS8nh/T34MZMDWg+RgdwPtlSt8qyvvPkIS21RsFVAKnzb+mPURemsyuUOx+XWl+rks0StsFHZanH54GY3dk43ITOV+X8zqRX6wk9aTH9Ra4p0/V1Sc1c5UbA6cCg/KAp/jk+5TefNJRmNzZ/xSUSkjafWJ2NnkB7v7kNwpUdInx1OX3MFOsFM50dsnwH4m3+Rr/8HOS8geWCoG8RQo4Lr2YOv2rCTIS1QkD/X+8DAam7T0CtkvYNQq4vcmiTOxvwHcKiBxdyg2twAAAABJRU5ErkJggg=="
    
    //console.log(rows)
    let lodirigido = {}, locopia = {}, loautoriza = {}, lovobo = {}, loatencion = {}

    lodirigido = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 1 AND id_iden = " + req.body.lnIden);
    locopia = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 2 AND id_iden = " + req.body.lnIden);
    loautoriza = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 3 AND id_iden = " + req.body.lnIden);
    lovobo = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 4 AND id_iden = " + req.body.lnIden);
    loatencion = await util.gene_cons("SELECT diri_nomb AS nombre, diri_carg AS cargo FROM gen_doficio WHERE tipo = 5 AND id_iden = " + req.body.lnIden);
    
    console.log(lodirigido)
    console.log(!lodirigido)

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

    console.log(loJson)
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
        const lcInserta = `
        UPDATE gen_stat_ofic SET fin = NOW() WHERE cve = '${rows[0].cve}' AND idOficio = ${rows[0].idoficio} AND anio = '${rows[0].fecha.getFullYear().toString().slice(-2)}' AND IFNULL(status,0) = 0 ;
        
        INSERT INTO gen_stat_ofic (idOficio, cve, anio, status, inicio, usuario, id_iden) 
			VALUES (${rows[0].idoficio}, '${rows[0].cve}', '${rows[0].fecha.getFullYear().toString().slice(-2)}', 1, NOW(), '${req.userId}', ${req.body.lnIden});

		UPDATE gen_oficio SET status = 1, gdoc = '${googleDoc}' WHERE id_iden = ${req.body.lnIden}
        `
        //console.log(lcInserta)
        loFinal = await util.gene_cons(lcInserta);
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

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
            SELECT d.id_doficio_pk as id, d.id_cent as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, tipo_depe, c.descrip as nomb_serv, IFNULL(d.copias, '') as copias 
                    , IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto, IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi  
                    , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                FROM gen_doficio d LEFT JOIN GEN_CENTROS c ON d.id_cent = c.ID_CENT 
                WHERE tipo_depe = 1 AND id_iden = ${req.query.lnIden}
	            UNION ALL  
                SELECT d.id_doficio_pk as id, d.id_cent as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, tipo_depe, c.descrip as nomb_serv, IFNULL(d.copias, '') as copias 
                        , IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto, IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi   
                        , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                    FROM gen_doficio d LEFT JOIN GEN_OTRO_CENT c ON d.id_cent = c.ID_CENT 
	                WHERE tipo_depe = 2 AND id_iden = ${req.query.lnIden}
                UNION ALL  
                    SELECT d.id_doficio_pk as id, 0 as servicio, diri_nomb, diri_carg, d.corr_ofic, d.tipo, 
                            tipo_depe, SPACE(70) as nomb_serv, IFNULL(d.copias, '') as copias, IFNULL(DATE_FORMAT(fech_auto, '%d/%m/%Y %H:%i'),'') as fech_auto 
                            , IFNULL(DATE_FORMAT(fech_envi_auto, '%d/%m/%Y %H:%i'),'') as fech_tenvi 
                            , IFNULL(DATE_FORMAT(fech_envi, '%d/%m/%Y %H:%i'),'') as fech_senvi, IFNULL(DATE_FORMAT(fech_acus, '%d/%m/%Y %H:%i'),'') as fech_acus 
                        FROM gen_doficio d 
                        WHERE tipo_depe = 0 AND id_iden = ${req.query.lnIden}
                        order by tipo, diri_nomb
    `
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)

});

const op_admix2 = (async (req, res) => {

    if (req.groups.indexOf(",OP_TOTA,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
        SELECT cve as id, cve, depen, nomb_firm, carg_firm, iniciales, correo_area, correo_copia, plantilla, 
                    CASE WHEN titular = 1 THEN 'SI' ELSE 'NO' END as titular, IFNULL(cve_compartir, '') AS compartir
            FROM gen_tipo_ofic 
    `
    if (req.query.servicio > 0){
        lcSQL = lcSQL + `        
            WHERE id_cent = ${req.query.servicio} AND IFNULL(cve_compartir, '') = ''
    `
    }
    console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)

});

const op_ningrx2 = (async (req, res) => {

    if (req.groups.indexOf(",OP_TOTA,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    lcSQL = `
        SELECT IFNULL(MAX(nume_cont), 0) + 1 as control FROM opc_oficio 
			WHERE cve = '${req.query.cve}' AND anio = ${req.query.anio} AND tipo = ${req.query.tipo_docu}
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    //return res.json(rows)
    return res.json({status:true, nume_cont : rows[0].control})

});

const cmb_control2w = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcBusca = req.query['filter[value]']
    
    const lcWhere = util.construirClausulaBusqueda(lcBusca,3)

    let lcWhereT = ''
    lcWhereT = (!req.query.cve ? '' : "o.cve = '" + req.query.cve + "'") + (!req.query.cve ? '' : ' and ') + (!lcWhere ? '' : lcWhere)
    lcWhereT = (!lcWhereT ? '' : 'WHERE ' + lcWhereT)

    console.log(lcWhereT)

    lcSQL = `
        SELECT o.id_ofic as id, LEFT(o.descrip,254) as value 
            FROM opc_oficio o INNER JOIN OPC_TIPO_DOCU t ON t.id_pk = o.tipo
            ${lcWhereT} 
            GROUP BY o.id_ofic, o.descrip
            ORDER BY o.id_ofic desc LIMIT 20
    `
    console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL)
    //console.log(rows)
    return res.json(rows)
    //return res.json({status:true, nume_cont : rows[0].control})

});

const op_ningrx = (async (req, res) => {

    if (req.groups.indexOf(",OFICIO,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    if (req.body.nume_cont <= 0){
        res.json([{"status":false, "message":"El numero de control no puede estar vacío o ser cero"}]);
    }

    let lnNuev_cent = 0
    if (req.body.rbDepe === '2' && !req.body.id_cent && req.body.txtDepen != ''){        //si es una dependencia nueva tipo no udg
        lcSQL = `
            INSERT INTO GEN_OTRO_CENT (descrip, dependen, orden) VALUES 
		        ('${req.body.txtDepen}', '${req.body.txtDepen}', 0)
        `
        const rows = await util.gene_cons(lcSQL);
        lnNuev_cent = rows.insertId;
        const rows2 = await util.gene_cons('UPDATE gen_otro_cent set clave = id_cent WHERE ifnull(clave,0) != id_cent');
        //console.log(lnNuev_cent);
    }

    lcSQL = `
        SELECT IFNULL(MAX(nume_cont), 0) as control 
            FROM opc_oficio 
            WHERE cve = '${req.body.cve}' AND anio = YEAR(now()) 
    `
    const rows3 = await util.gene_cons(lcSQL);
    
    //console.log(rows3)
    lnNume_cont = parseInt(rows3[0].control) + 1
    //console.log(req.body)

    lcSQL = `
        INSERT INTO opc_oficio (clave, fech_ofic, nume_cont, fecha, descrip, tipo_depe, cent_proc, clv_proc, nomb_proc, ligado_a
                , id_tiof, id_clof, asunto, codi_remi, nomb_remi, carg_remi, codi_dest, nomb_dest, nota, usuario, lud, anio
                , id_refe_in, id_refe_ou,pendiente, tipo,  carg_dest, tele_dest, cve, id_cent, asignado, status, doc_firma, info_sens, segu_pra, letra
                , tipo_info, tipo_ingr, BIS, id_seccion) 
            VALUES ('${req.centro}', '${outil.form_fechSQL(req.body.fech_ofic)}', ${lnNume_cont}, NOW(), '${req.body.nume_ofic}', ${req.body.rbLiga}, ${req.id_cent}, '${req.body.clav_proc}', '${req.body.txtDepen}', '${req.body.ligado_a}'
                ,${req.body.tipo_ofic}, ${req.body.clase}, '${req.body.asunto}', 0, '${req.body.remi_nomb}', '${req.body.remi_carg}', 0, '${req.body.dest_nomb}', '${req.body.nota}', '${req.userId}', now(), ${req.body.anio_ingr}
                ,'${req.body.liga_sali}', '${req.body.liga_entr}', 0, ${req.body.tipo_ingr},  '${req.body.dest_carg}', '', '${req.body.cve}', ${req.id_cent}, 0, 1, 0, ${req.body.info_sens}, 0, ''
                , ${req.body.tipo_info}, ${req.body.tipo_ingr}, 0, ${req.body.seccion === '' ? 0 : req.body.seccion});
    `
    console.log(lcSQL)
    const rows4 = await util.gene_cons(lcSQL);

    lcSQL = `
        INSERT INTO opc_segu_ofic(id_ofic, fecha, status, usuario, nombre) VALUES(${rows4.insertId}, now(), 1, '${req.userId}', '${req.nom_usu}')
    `
    const rows5 = await util.gene_cons(lcSQL);

    res.json([{status: true, message:"Se guardo correctamente con el n\u00FAmero: " + lnNume_cont, oficio: lnNume_cont, id: rows4.insertId }]);
    console.log(rows5)


});

module.exports = {
    op_cucsx2,
    op_oficx5,
    cmb_controlw,
    op_bplanx,
    op_nplantix,
    op_noficx7,
    op_noficx4,
    op_bgrupx,
    op_noficx5,
    op_gofic,
    op_sdoficx,
    op_admix2,
    op_ningrx2,
    cmb_control2w,
    op_ningrx
}