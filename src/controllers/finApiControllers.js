const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
//const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));
const oplantilla = require(path.join(__dirname, "..", "utils/plantilla_pdf"));
const PDFDocument = require("pdfkit");
const { PDFDocument: PDFDocument2, rgb } = require('pdf-lib');
const fs = require('fs');
const { cacheUsuarios } = require("../middlewares/authjwt");


const fin_orde_compx = (async (req, res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    let parameters = []
    let lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY o.foli_orde) AS RANK, o.id, o.tipo_orde, o.fech_emis, o.proyecto, o.rfc, o.proveedor, o.domi_prov, 
					o.tele_prov, o.corr_prov, o.fech_entr, o.luga_entr, o.forma_pago, o.porc_anti, o.fech_inic, o.fech_fin, o.nume_parc, 
					o.subtotal, o.iva_total, o.total, o.observaciones, o.estatus, o.fech_crea
        FROM fin_orde_comp o INNER JOIN fin_proyecto p on o.proyecto = p.proyecto
            LEFT join gen_centros c ON p.id_cent = c.id_cent
        ORDER BY o.foli_orde;
    `
    if (!!req.query.anio){
        lcSQL = lcSQL + " WHERE YEAR(o.fech_emis) = ? "
        parameters.push(req.query.lnConv);
    }

    const rows = await util.gene_cons(lcSQL, parameters)
    return res.json(rows)
});


const fin_norde_compx2 = (async (req, res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0 || !req.body.proyecto)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
    SELECT p.proyecto, c.cve_conv, c.descrip, c.dependen, c.telefono, c.direccion
	    FROM fin_proyecto p LEFT JOIN gen_centros c ON p.id_cent = c.id_cent
	    WHERE p.proyecto = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.proyecto])

    return res.json(rows[0])

});

const fin_norde_compx = (async (req,res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const encabezado = JSON.parse(req.body.encabezado)
    const detalle = JSON.parse(req.body.detalles)

    if (encabezado.id_orde_comp > 0){
        const busc_orde = await util.gene_cons("select estatus from fin_orde_comp where id = ?", [encabezado.id_orde_comp])

        if (busc_orde[0].estatus > 0){
            return res.json({"status" : "error", "message": "La orden de compra ya no se puede editar"})
        }
    }
    

    //console.log(req.body.generar)
    if (req.body.generar){

        if (encabezado.tipo_orde || !encabezado.fech_emis || !encabezado.proyecto || !encabezado.rfc || !encabezado.proveedor ||
            !encabezado.domi_prov || !encabezado.tele_prov || !encabezado.corr_prov, !encabezado.fech_entr || !encabezado.luga_entr ||
            !encabezado.forma_pago || !encabezado.ures_depe || !encabezado.nomb_depe || !encabezado.tele_depe || !encabezado.domi_depe)
        {

            return res.json({"status" : "error", "message": "Falta campos requeridos para la orden de compra"})
        }

        if (encabezado.tipo_orde == 2 && (!encabezado.fech_inic || !encabezado.fech_fin)){
            return res.json({"status" : "error", "message": "Al ser orden de servicio debe tener fecha inicio y fin del servicio"})
        }
        
        if (encabezado.forma_pago == 2 && !encabezado.nume_parc){
            return res.json({"status" : "error", "message": "Faltan el total de parcialidades"})
        }
    }
    
    let insertD = [], lnSubtodal = 0, lnIVA = 0, lnTotal = 0, llError_arti = false;

    //console.log(detalle)

    if (!encabezado.id_orde_comp || encabezado.id_orde_comp <= 0){
        lcSQL = `
        INSERT INTO fin_orde_comp (tipo_orde, fech_emis, proyecto, rfc, proveedor, domi_prov, tele_prov, corr_prov, fech_entr, luga_entr, forma_pago,
	            porc_anti, fech_inic, fech_fin, nume_parc, subtotal, iva_total, total, observaciones, estatus, fech_crea, cambios, ures_depe, nomb_depe, 
                tele_depe, domi_depe, usua_crea) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0, NOW(), CONCAT(?,'|INSERT|',NOW(),CHR(13)), ?, ?, ?, ?, ?)
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones, req.userId,
                            encabezado.ures_depe, encabezado.nomb_depe, encabezado.tele_depe, encabezado.domi_depe, req.userId, lnSubtodal, lnIVA, lnTotal
                        ]

        const insert = await util.gene_cons(lcSQL, laSend)
        
        //console.log(insert.insertId)

        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, cost_unit, tasa_iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [insert.insertId, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].cost_unit, detalle[i].tasa_iva])

            lnSubtodal  += detalle[i].cantidad*detalle[i].cost_unit
            lnIVA       += (detalle[i].cantidad*detalle[i].cost_unit)*(detalle[i].tasa_iva/100)
            lnTotal     += (detalle[i].cantidad*detalle[i].cost_unit)*(1+(detalle[i].tasa_iva/100))
            if(detalle[i].cantidad <= 0 || detalle[i].cost_unit <= 0){
                llError_arti = true
            }
        }

        if (lnSubtodal > 0 || lnIVA > 0 || lnTotal > 0){
            lcSQL = `
            UPDATE fin_orde_comp 
                SET subtotal = ?, iva_total = ?, total = ? 
                WHERE id = ?
            `
            const upda_mont = await util.gene_cons(lcSQL, [(!lnSubtodal?0:lnSubtodal), (!lnIVA?0:lnIVA), (!lnTotal?0:lnTotal), insert.insertId])
        }

        if (req.body.generar){
            if (llError_arti){
                return res.json({"status" : "error", "message": "Se econtraron artículos con costo o cantidad menor o igual a cero"})
            }

            const campus_proy = await util.gene_cons("SELECT campus FROM gen_centros WHERE id_cent IN (SELECT id_cent FROM fin_proyecto WHERE proyecto = ?", [encabezado.proyecto])
            
            const laID = await util.gene_cons("CALL SP_NEWID (?, '')", ['OC_' + campus_proy[0].campus])

            if (!laID[0][0].nextid){
                return res.json({"status" : false, "message": "Hay problema al obtener el folio"});
            } 

            lcSQL = `
            UPDATE fin_orde_comp 
                SET foli_orde = ?, usua_gene = ?, fech_gene = NOW(), estatus = 2 
                WHERE id = ?
            `
            const lcFoli_orde = campus_proy[0].campus+'-'+String(laID[0][0].nextid).padStart(4, '0')+'-' + new Date().getFullYear()
            const upda_orde = await util.gene_cons(lcSQL, [lcFoli_orde, req.userId, insert.insertId])
            return res.json({"status" : "success", "message": "La orden se genero con el folio: " + lcFoli_orde, id:insert.insertId})
        }

        return res.json({"status" : "success", "message": "La orden se guardo exitosamente, recuerda que aun no se genera", id:insert.insertId})

    }
    else{

        const deleted = await util.gene_cons("DELETE FROM fin_dorde_comp WHERE id_orde_comp = ?", [encabezado.id_orde_comp])

        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, cost_unit, tasa_iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [encabezado.id_orde_comp, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].cost_unit, detalle[i].tasa_iva])

            lnSubtodal  += detalle[i].cantidad*detalle[i].cost_unit
            lnIVA       += (detalle[i].cantidad*detalle[i].cost_unit)*(detalle[i].tasa_iva/100)
            lnTotal     += (detalle[i].cantidad*detalle[i].cost_unit)*(1+(detalle[i].tasa_iva/100))
            
            if(detalle[i].cantidad <= 0 || detalle[i].cost_unit <= 0){
                llError_arti = true
            }
        }

        //console.log(encabezado)
        lcSQL = `
        UPDATE fin_orde_comp  SET tipo_orde = ?, fech_emis = ?, proyecto = ?, rfc = ?, proveedor = ?, domi_prov = ?, tele_prov = ?, corr_prov = ?, 
                fech_entr = ?, luga_entr = ?, forma_pago = ?, porc_anti = ?, fech_inic = ?, fech_fin = ?, nume_parc = ?, subtotal = 0, iva_total = 0, total = 0, 
                observaciones = ?, ures_depe = ?, nomb_depe = ?, tele_depe = ?, domi_depe = ?, subtotal = ?, iva_total = ?, total = ?, cambios = CONCAT(IFNULL(cambios,''), ?,'|UPDATE|',NOW(),CHR(13)) 
            WHERE id = ?
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones,  encabezado.ures_depe, encabezado.nomb_depe,
                            encabezado.tele_depe, encabezado.domi_depe, (!lnSubtodal?0:lnSubtodal), (!lnIVA?0:lnIVA), (!lnTotal?0:lnTotal), req.userId, encabezado.id_orde_comp]

        const update = await util.gene_cons(lcSQL, laSend)

        if (req.body.generar){
            if (llError_arti){
                return res.json({"status" : "error", "message": "Se econtraron artículos con costo o cantidad menor o igual a cero"})
            }

            const campus_proy = await util.gene_cons("SELECT campus FROM gen_centros WHERE id_cent IN (SELECT id_cent FROM fin_proyecto WHERE proyecto = ?)", [encabezado.proyecto])
            
            const laID = await util.gene_cons("CALL SP_NEWID (?, '')", ['OC_' + campus_proy[0].campus])

            if (!laID[0][0].nextid){
                return res.json({"status" : false, "message": "Hay problema al obtener el folio"});
            } 

            lcSQL = `
            UPDATE fin_orde_comp 
                SET foli_orde = ?, usua_gene = ?, fech_gene = NOW(), estatus = 2 
                WHERE id = ?
            `
            const lcFoli_orde = campus_proy[0].campus+'-'+String(laID[0][0].nextid).padStart(4, '0')+'-' + new Date().getFullYear()
            const upda_orde = await util.gene_cons(lcSQL, [lcFoli_orde, req.userId, encabezado.id_orde_comp])
            return res.json({"status" : "success", "message": "La orden se genero con el folio: " + lcFoli_orde})
        }
        
        return res.json({"status" : "success", "message": "El registro se actualizo exitosamente, recuerda que aun no se generas la orden"})
    }
});




const fin_impr_oc = (async (req,res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const formatoMoneda = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN', // Peso Mexicano
        minimumFractionDigits: 2
    });

    const formatoMillares = new Intl.NumberFormat('es-MX', {
        style: 'decimal',
        useGrouping: true,      // Asegura que separe los miles
        minimumFractionDigits: 0, // No pone decimales si no los hay
        maximumFractionDigits: 0  // Fuerza a que no existan decimales
    });


    let lcSQL = `
    SELECT o.id, o.foli_orde, o.tipo_orde, o.fech_emis, o.proyecto, o.rfc, o.proveedor, o.domi_prov, o.nomb_depe, o.tele_depe, o.ures_depe, o.domi_depe, 
					o.tele_prov, o.corr_prov, DATE_FORMAT(o.fech_entr, '%d/%m/%Y') as fech_entr, o.luga_entr, o.forma_pago, o.porc_anti, o.nume_parc, 
                    DATE_FORMAT(o.fech_inic, '%d/%m/%Y') as fech_inic, DATE_FORMAT(o.fech_fin, '%d/%m/%Y') as fech_fin, DATE_FORMAT(o.fech_crea, '%d/%m/%Y') as fech_crea,
					o.subtotal, o.iva_total, o.total, o.observaciones, o.estatus, p.fondo, p.nombre AS nomb_proy, p.tipo_proy, p.programa
        FROM fin_orde_comp o INNER JOIN fin_proyecto p on o.proyecto = p.proyecto
            LEFT join gen_centros c ON p.id_cent = c.id_cent
        WHERE o.id = ?
    `
    const datos = await util.gene_cons(lcSQL, [req.query.id])

    let lcArchivo = path.join(__dirname, "..",  `pdf/fondo-o${(datos[0].tipo_orde==1?'c':'s')}.png`)
    const llArchivo = await other_utils.exit_arch(lcArchivo)
    let lcArchivoR = path.join(__dirname, "..", "pdf/fondo-ocr.png")
    const llArchivoR = await other_utils.exit_arch(lcArchivoR)


    lcSQL = `
    SELECT unidad, articulo, cantidad, cost_unit, cantidad*cost_unit AS total
        FROM fin_dorde_comp
        WHERE id_orde_comp = ?
    `
    const detalle = await util.gene_cons(lcSQL, [req.query.id])

    //console.log(detalle)

    // 1. Definimos los encabezados
    let tablaPDF = [];

    // 2. Mapeamos los datos y formateamos los números
    detalle.forEach(item => {
        if(datos[0].tipo_orde == 1){                    //si es orden de compra agrega la unidad
            tablaPDF.push([
                item.unidad,
                item.articulo,
                `${formatoMillares.format(item.cantidad)}`,
                `${formatoMoneda.format(item.cost_unit)}`,
                `${formatoMoneda.format(item.total)}`
            ]);
        }
        else {
            tablaPDF.push([
                item.articulo,
                `${formatoMillares.format(item.cantidad)}`,
                `${formatoMoneda.format(item.cost_unit)}`,
                `${formatoMoneda.format(item.total)}`
            ]);

        }
    });

//console.log(tablaPDF)

    const doc = new PDFDocument({ size: 'letter', bufferPages: true, margins: {top: 245, bottom: 260, left: 0,right: 0}});
    
/*     //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response */

    let chunks = [];
    doc.on('data', (chunk) => {
        chunks.push(chunk);
    });

    let d = "", m = "", a = ""

    if(!!datos[0].fech_emis){
        d = String(datos[0].fech_emis.getDate()).padStart(2, '0');
        m = String(datos[0].fech_emis.getMonth() + 1).padStart(2, '0'); // +1 porque enero es 0
        a = datos[0].fech_emis.getFullYear();
    }


    // EVENTO CLAVE: Se ejecuta cada vez que se crea una página
    doc.on('pageAdded', () => {
        // Obtenemos el número de página actual
        let numeroPagina = doc.bufferedPageRange().count;

        // Verificamos si es impar (1, 3, 5...)
        if (numeroPagina % 2 !== 0) {
            // Colocamos la imagen de fondo (asegúrate de que cubra toda la hoja)
            if (llArchivo){
                doc.image(lcArchivo, 0, 0, {width: 610});
            
            }

        doc.font("Helvetica").fontSize(8)
        doc.text(`${(!datos[0].foli_orde?'':datos[0].foli_orde)}`, 470, 23, {width: 110, align: 'center'});
        doc.text(`${d}             ${m}             ${a}`, 470, 47, {width: 110, align: 'center'});
        doc.text(`${(!datos[0].proyecto?'':datos[0].proyecto)}`, 520, 83, {width: 60, align: 'center'});
        doc.text(`${(!datos[0].fondo?'':datos[0].fondo)}`, 520, 94, {width: 60, align: 'center'});
        doc.fontSize((datos[0].programa.length>10?6:8)).text(`${(!datos[0].programa?'':datos[0].programa)}`, 520, 105, {width: 60, align: 'center'});
        doc.fontSize((datos[0].nomb_depe.length > 40?8:10)).text(`${(!datos[0].nomb_depe?'':datos[0].nomb_depe)}`, 165, 82, {width: 280, align: 'center'});
        doc.fontSize(8).text(`${(!datos[0].ures_depe?'':datos[0].ures_depe)}`, 143, 131, {width: 95, align: 'center'});
        doc.text(`${(!datos[0].nomb_depe?'':datos[0].nomb_depe)}`, 240, 131, {width: 340, align: 'center'});
        doc.text(`${(!datos[0].tele_depe?'':datos[0].tele_depe)}`, 143, 152, {width: 95, align: 'center'});
        doc.text(`${(!datos[0].domi_depe?'':datos[0].domi_depe)}`, 240, 152, {width: 340, align: 'center'});
        doc.text(`${(!datos[0].domi_prov?'':datos[0].domi_prov)}`, 32, 178, {width: 207, align: 'left'});
        doc.text(`${(!datos[0].proveedor?'':datos[0].proveedor)}`, 237, 178, {width: 342, align: 'center'});
        doc.text(`${(!datos[0].rfc?'':datos[0].rfc)}`, 237, 199, {width: 95, align: 'center'});
        doc.text(`${(!datos[0].corr_prov?'':datos[0].corr_prov)}`, 335, 199, {width: 130, align: 'center'});
        doc.text(`${(!datos[0].tele_prov?'':datos[0].tele_prov)}`, 465, 199, {width: 115, align: 'center'});

        doc.options.autoFirstPage = false; // Opcional, dependiendo de tu versión
        // La propiedad clave es esta:
        doc.page.margins.bottom = 0; 

        // Ahora imprimes tus textos de la parte inferior
        doc.text(`${other_utils.montoALetras(datos[0].total)}`, 100, 530, {width: 325, align: 'center'});
        doc.text(`${formatoMoneda.format(datos[0].subtotal)}`, 506, 531, {width: 73, align: 'right'});
        doc.text(`${formatoMoneda.format(datos[0].iva_total)}`, 506, 546, {width: 73, align: 'right'});
        doc.text(`${formatoMoneda.format(datos[0].total)}`, 506, 560, {width: 73, align: 'right'});

        if(datos[0].tipo_orde == 1){
            doc.text(`${datos[0].fech_entr}`, 100, 587, {width: 135, align: 'center'});
            doc.text(`${datos[0].luga_entr}`, 310, 587, {width: 195, align: 'left'});
            doc.text(`${(!datos[0].porc_anti?'':datos[0].porc_anti+'%')}`, 330, 607, {width: 175, align: 'center'});
        }
        else {
            doc.fontSize(6).text(`${datos[0].luga_entr}`, 157, 587, {width: 198, align: 'left'});
            doc.fontSize(8).text(`${(!datos[0].porc_anti?'':datos[0].porc_anti+'%')}`, 331, 607, {width: 25, align: 'center'});
            doc.text(`${datos[0].fech_inic}`, 440, 597, {width: 63, align: 'center'});
            doc.text(`${datos[0].fech_fin}`, 440, 607, {width: 63, align: 'center'});
        }
        doc.text(`${(datos[0].forma_pago == 1 ? 'X':'')}`, 118, 598, {width: 195, align: 'left'});
        doc.text(`${(datos[0].forma_pago == 1 ? '':'X')}`, 118, 607, {width: 195, align: 'left'});
        doc.text(`${datos[0].fech_entr}`, 152, 597, {width: 155, align: 'center'});
        doc.text(`${(datos[0].forma_pago ==1?'':datos[0].nume_parc)}`, 210, 607, {width: 30, align: 'center'});
        
        doc.text(`${(datos[0].porc_anti ? 'X':'')}`, 569, 598, {width: 195, align: 'left'});
        doc.text(`${(!datos[0].porc_anti ? 'X':'')}`, 569, 607, {width: 195, align: 'left'});
        doc.text(`${datos[0].observaciones}`, 35, 624, {width: 540, align: 'left'});
        doc.text(`${datos[0].observaciones}`, 30, 727, {width: 127, align: 'left'});
        doc.text(`${datos[0].observaciones}`, 170, 747, {width: 127, align: 'left'});
        doc.text(`${datos[0].observaciones}`, 312, 747, {width: 130, align: 'left'});
        doc.fontSize(9);

        // Si vas a seguir agregando contenido después, recuerda restaurar el margen

    /*      doc.lineJoin('round')
        .rect(506, 540, 73, 15)
        .fillAndStroke("#f1f4ff", "#000000"); */

        doc.page.margins.bottom = 260;
        doc.options.autoFirstPage = true;


        } else {
            if (llArchivoR){
                doc.image(lcArchivoR, 0, 0, {width: 610});
            }
            doc.addPage();
        }
    });
    
    if (llArchivo){
        doc.image(lcArchivo, 0, 0, {width: 610});
    }

    doc.font("Helvetica").fontSize(8)
    doc.text(`${(!datos[0].foli_orde?'':datos[0].foli_orde)}`, 470, 23, {width: 110, align: 'center'});
    doc.text(`${d}             ${m}             ${a}`, 470, 47, {width: 110, align: 'center'});
    doc.text(`${(!datos[0].proyecto?'':datos[0].proyecto)}`, 520, 83, {width: 60, align: 'center'});
    doc.text(`${(!datos[0].fondo?'':datos[0].fondo)}`, 520, 94, {width: 60, align: 'center'});
    doc.fontSize((datos[0].programa.length>10?6:8)).text(`${(!datos[0].programa?'':datos[0].programa)}`, 520, 105, {width: 60, align: 'center'});
    doc.fontSize((datos[0].nomb_depe.length > 40?8:10)).text(`${(!datos[0].nomb_depe?'':datos[0].nomb_depe)}`, 165, 82, {width: 280, align: 'center'});
    doc.fontSize(8).text(`${(!datos[0].ures_depe?'':datos[0].ures_depe)}`, 143, 131, {width: 95, align: 'center'});
    doc.text(`${(!datos[0].nomb_depe?'':datos[0].nomb_depe)}`, 240, 131, {width: 340, align: 'center'});
    doc.text(`${(!datos[0].tele_depe?'':datos[0].tele_depe)}`, 143, 152, {width: 95, align: 'center'});
    doc.text(`${(!datos[0].domi_depe?'':datos[0].domi_depe)}`, 240, 152, {width: 340, align: 'center'});
    doc.text(`${(!datos[0].domi_prov?'':datos[0].domi_prov)}`, 32, 178, {width: 207, align: 'left'});
    doc.text(`${(!datos[0].proveedor?'':datos[0].proveedor)}`, 237, 178, {width: 342, align: 'center'});
    doc.text(`${(!datos[0].rfc?'':datos[0].rfc)}`, 237, 199, {width: 95, align: 'center'});
    doc.text(`${(!datos[0].corr_prov?'':datos[0].corr_prov)}`, 335, 199, {width: 130, align: 'center'});
    doc.text(`${(!datos[0].tele_prov?'':datos[0].tele_prov)}`, 465, 199, {width: 115, align: 'center'});

    doc.options.autoFirstPage = false; // Opcional, dependiendo de tu versión
    // La propiedad clave es esta:
    doc.page.margins.bottom = 0; 

    // Ahora imprimes tus textos de la parte inferior
    doc.text(`${other_utils.montoALetras(datos[0].total)}`, 100, 530, {width: 325, align: 'center'});
    doc.text(`${formatoMoneda.format(datos[0].subtotal)}`, 506, 531, {width: 73, align: 'right'});
    doc.text(`${formatoMoneda.format(datos[0].iva_total)}`, 506, 546, {width: 73, align: 'right'});
    doc.text(`${formatoMoneda.format(datos[0].total)}`, 506, 560, {width: 73, align: 'right'});

    if(datos[0].tipo_orde == 1){
        doc.text(`${datos[0].fech_entr}`, 100, 587, {width: 135, align: 'center'});
        doc.text(`${datos[0].luga_entr}`, 310, 587, {width: 195, align: 'left'});
        doc.text(`${(!datos[0].porc_anti?'':datos[0].porc_anti+'%')}`, 330, 607, {width: 175, align: 'center'});
    }
    else {
        doc.fontSize(6).text(`${datos[0].luga_entr}`, 157, 587, {width: 198, align: 'left'});
        doc.fontSize(8).text(`${(!datos[0].porc_anti?'':datos[0].porc_anti+'%')}`, 331, 607, {width: 25, align: 'center'});
        doc.text(`${datos[0].fech_inic}`, 440, 597, {width: 63, align: 'center'});
        doc.text(`${datos[0].fech_fin}`, 440, 607, {width: 63, align: 'center'});
    }
    doc.text(`${(datos[0].forma_pago == 1 ? 'X':'')}`, 118, 598, {width: 195, align: 'left'});
    doc.text(`${(datos[0].forma_pago == 1 ? '':'X')}`, 118, 607, {width: 195, align: 'left'});
    doc.text(`${datos[0].fech_entr}`, 152, 597, {width: 155, align: 'center'});
    doc.text(`${(datos[0].forma_pago ==1?'':datos[0].nume_parc)}`, 210, 607, {width: 30, align: 'center'});
    
    doc.text(`${(datos[0].porc_anti ? 'X':'')}`, 569, 598, {width: 195, align: 'left'});
    doc.text(`${(!datos[0].porc_anti ? 'X':'')}`, 569, 607, {width: 195, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 35, 624, {width: 540, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 30, 727, {width: 127, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 170, 747, {width: 127, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 312, 747, {width: 130, align: 'left'});

    // Si vas a seguir agregando contenido después, recuerda restaurar el margen

    /*doc.lineJoin('round')
    .rect(157, 587, 198, 15)
    .fillAndStroke("#f1f4ff", "#000000"); */

    doc.page.margins.bottom = 260;
    doc.options.autoFirstPage = true;

    doc.fontSize(9)
    doc.y = 245;
    doc.x = 30;
    if(datos[0].tipo_orde == 1){
        doc.table({
        columnStyles: [{ width: 46, align: 'center' }, { width: 307, align: 'left' }, { width: 51, align: 'center' }, { width: 72, align: 'right' }, { width: 75, align: 'right' }],
        rowStyles: { border: false},
        data: tablaPDF,
        });
    }
    else {
        doc.table({
        columnStyles: [{ width: 353, align: 'left' }, { width: 51, align: 'center' }, { width: 72, align: 'right' }, { width: 75, align: 'right' }],
        rowStyles: { border: false},
        data: tablaPDF,
        });
    }

    doc.addPage();

/*     const range = doc.bufferedPageRange(); // { start: 0, count: 3 }

    for (let i = range.start; i < (range.start + range.count); i++) {
        // Nos movemos a la página i
        doc.switchToPage(i);
        
        let numPagina = i + 1;
        doc.fillColor("black").fontSize(8);
        doc.page.margins.bottom = 0; 
        
        // Escribimos en la esquina inferior derecha (ajusta según tu fondo)
        if (numPagina % 2 !== 0) {
        doc.text(
            `Página ${Math.ceil(numPagina/2)} de ${Math.ceil(range.count/2)}`, 
            445, 
            765, 
            { align: 'right', width: 100 }
        );
        }
    } */

    /* const leyendas = ["ORIGINAL", "COPIA DEPENDENCIA", "COPIA PROVEEDOR"];

    // 3. Iteramos para crear las copias
    leyendas.forEach(leyenda => {
        for (let i = range.start; i < range.count; i++) {
            // Añadimos una nueva página para la copia
            doc.addPage();
            
            // "Copiamos" el contenido de la página i a la nueva página actual
            // PDFKit no tiene un 'clonePage', así que usamos switchToPage
            // Nota: Este método funciona mejor si encapsulas tu diseño en una función
            reproducirContenido(doc, leyenda); 
        }
    }); */

    doc.on('end', async () => {
        try {
            const pdfBuffer = Buffer.concat(chunks);
            const originalDoc = await PDFDocument2.load(pdfBuffer);
            
            // --- PASO 1: LIMPIEZA DEL ORIGINAL ---
            let totalPaginasOriginal = originalDoc.getPageCount();
            
            // Si agregaste una hoja extra en PDFKit, la eliminamos aquí
            if (totalPaginasOriginal > 1) {
                originalDoc.removePage(totalPaginasOriginal - 1);
                totalPaginasOriginal--; // Ajustamos el contador
            }

            const pdfFinalDoc = await PDFDocument2.create();
            const leyendas = ["ORIGINAL", "COPIA DEPENDENCIA", "COPIA PROVEEDOR"];
            
            // Re-obtenemos los índices después de haber borrado la última página
            const indicesPaginas = originalDoc.getPageIndices(); 

            for (const texto of leyendas) {
                // Copiamos el set de páginas limpio
                const paginasCopiadas = await pdfFinalDoc.copyPages(originalDoc, indicesPaginas);
                
                paginasCopiadas.forEach((pagina, index) => {
                    pdfFinalDoc.addPage(pagina);
                    
                    // Solo rotulamos y numeramos páginas IMPARES (Frente)
                    if (index % 2 === 0) {
                        // --- PASO 2: CÁLCULO DE NUMERACIÓN ---
                        // Math.ceil ayuda por si el total es impar
                        const numPaginaReal = Math.ceil((index + 1) / 2);
                        const totalReal = Math.ceil(totalPaginasOriginal / 2);

                        // Dibujamos la leyenda (ORIGINAL, etc.)
                        pagina.drawText(texto, {
                            x: 20,
                            y: 25,
                            size: 10,
                            color: rgb(0.5, 0.5, 0.5)
                        });

                        // Dibujamos la numeración "1 de X"
                        // Ajusta x e y según donde prefieras que aparezca en la orden de compra
                        pagina.drawText(`Página ${numPaginaReal} de ${totalReal}`, {
                            x: 500, // Esquina derecha
                            y: 20,
                            size: 8,
                            color: rgb(0, 0, 0)
                        });
                    }
                });
            }
            
            const pdfFinalBytes = await pdfFinalDoc.save();
            res.contentType("application/pdf");
            res.send(Buffer.from(pdfFinalBytes)); 

        } catch (error) {
            console.error("Error en el procesamiento:", error);
            if (!res.headersSent) res.status(500).send("Error al generar copias");
        }
    });

    doc.end()

    function reproducirContenido(pdf, textoLeyenda) {
        // Aquí vuelves a ejecutar la lógica de dibujo o usas plantillas
        pdf.fontSize(10).fillColor('gray').text(textoLeyenda, 50, pdf.page.height - 50);
    }

/*     doc.fontSize(17);
    doc.font("Helvetica-Bold").text("ORDEN DE COMPRA", 220, 52);
 */
/* //NUMERO
doc.lineWidth(.5);
doc.font("Helvetica")
doc.lineJoin('round')
    .rect(470, 22, 110, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("CGAI-22-2025", 470, 25, {width: 110, align: 'center'});
doc.lineJoin('round')
    .rect(470, 35, 110, 9)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(7)
    .text("NUMERO", 470, 37, {width: 110, align: 'center'});

//FECHA
doc.lineJoin('round')
    .rect(470, 50, 110, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("03           11           2025", 470, 53, {width: 110, align: 'center'});
doc.lineJoin('round')
    .rect(470, 63, 110, 9)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(7)
    .text("DIA     |     MES     |     AÑO", 470, 65, {width: 110, align: 'center'});
doc.lineJoin('round')
    .rect(470, 71, 110, 9)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(7)
    .text("FECHA DE ELABORACIÓN", 470, 73, {width: 110, align: 'center'});

//PROJECTO
doc.lineJoin('round')
    .rect(470, 86, 50, 13)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(6)
    .text("NO. PROYECTO:", 470, 90, {width: 50, align: 'center'});
doc.lineJoin('round')
    .rect(520, 86, 60, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("283610", 520, 89, {width: 60, align: 'center'});
//FONDO
doc.lineJoin('round')
    .rect(470, 99, 50, 13)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(6)
    .text("No. FONDO:", 470, 103, {width: 50, align: 'center'});
doc.lineJoin('round')
    .rect(520, 99, 60, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("1.1.9.30", 520, 102, {width: 60, align: 'center'});
//PROGRAMA
doc.lineJoin('round')
    .rect(470, 112, 50, 13)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(6)
    .text("PROGRAMA:", 470, 116, {width: 50, align: 'center'});
doc.lineJoin('round')
    .rect(520, 112, 60, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("Innovación Educ", 520, 115, {width: 60, align: 'center'});

//DEPENDENCIA

doc.lineJoin('round')
    .rect(165, 80, 280, 13)
    .fillAndStroke("#f1f4ff", "#000000");
doc.fillColor("#000000")
    .fontSize(8)
    .text("Coordinación General Académica y de Innovación", 165, 83, {width: 280, align: 'center'});
doc.lineJoin('round')
    .rect(165, 93, 280, 9)
    .fillAndStroke("#e9e9e9", "#000000");
doc.fillColor("#000000")
    .fontSize(7)
    .text("ENTIDAD o DEPENDENCIA EMISORA", 165, 95, {width: 280, align: 'center'});
 */
});

const fin_norde_compx3 = (async (req, res) => {

    //console.log(req.body) 

    if (req.groups.indexOf(",ORDE_COMP,") <= 0 || !req.body.ures_depe)        //si no tiene derechos
    {
        return res.json({"status" : "error", "message": "No tienes derechos para actualizar los datos"})
    }

    let lcSQL = `
    UPDATE gen_centros SET telefono = ?, direccion = ?, 
	    cambios = CONCAT(IFNULL(cambios, '') ,?,'|UPDATE|',NOW(),CHR(13)) WHERE cve_conv = ?
    `

    const rows = await util.gene_cons(lcSQL, [req.body.tele_depe, req.body.domi_depe, req.userId, req.body.ures_depe])

    return res.json({"status" : "success", "message": "La dependencia se actualizó correctamente"})

});

module.exports = {
    fin_orde_compx,
    fin_norde_compx2,
    fin_norde_compx,
    fin_impr_oc,
    fin_norde_compx3
}