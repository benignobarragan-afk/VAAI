const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
//const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));
const oplantilla = require(path.join(__dirname, "..", "utils/plantilla_pdf"));
const PDFDocument = require("pdfkit");
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
    let insertD = []

    console.log(detalle)

    if (!encabezado.id_orde_comp || encabezado.id_orde_comp <= 0){
        lcSQL = `
        INSERT INTO fin_orde_comp (tipo_orde, fech_emis, proyecto, rfc, proveedor, domi_prov, tele_prov, corr_prov, fech_entr, luga_entr, forma_pago,
	            porc_anti, fech_inic, fech_fin, nume_parc, subtotal, iva_total, total, observaciones, estatus, fech_crea, cambios) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 0, NOW(), CONCAT(?,'|INSERT|',NOW(),CHR(13)))
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones, req.userId]

        const insert = await util.gene_cons(lcSQL, laSend)
        
        console.log(insert.insertId)

        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, cost_unit, tasa_iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [insert.insertId, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].cost_unit, detalle[i].tasa_iva])
        }

        return res.json({"status" : "success", "message": "La orden se guardo exitosamente, recuerda que aun no se genera", id:insert.insertId})

    }

    if(encabezado.id_orde_comp > 0){
        lcSQL = `
        UPDATE fin_orde_comp  SET tipo_orde = ?, fech_emis = ?, proyecto = ?, rfc = ?, proveedor = ?, domi_prov = ?, tele_prov = ?, corr_prov = ?, 
                fech_entr = ?, luga_entr = ?, forma_pago = ?, porc_anti = ?, fech_inic = ?, fech_fin = ?, nume_parc = ?, subtotal = 0, iva_total = 0, total = 0, 
                observaciones = ?, cambios = CONCAT(IFNULL(cambios,''), ?,'|UPDATE|',NOW(),CHR(13)) 
            WHERE id = ?
        `
        const laSend = [(!encabezado.tipo_orde?null:encabezado.tipo_orde), (!encabezado.fech_emis?null:encabezado.fech_emis), (!encabezado.proyecto?null:encabezado.proyecto), 
                            encabezado.rfc, encabezado.proveedor, encabezado.domi_prov, encabezado.tele_prov, encabezado.corr_prov, (!encabezado.fech_entr?null:encabezado.fech_entr), 
                            encabezado.luga_entr, (!encabezado.forma_pago?null:encabezado.forma_pago), (!encabezado.porc_anti?null:encabezado.porc_anti), (!encabezado.fech_inic?null:encabezado.fech_inic), 
                            (!encabezado.fech_fin?null:encabezado.fech_fin), (!encabezado.nume_parc?null:encabezado.nume_parc), encabezado.observaciones, req.userId, encabezado.id_orde_comp]

        const update = await util.gene_cons(lcSQL, laSend)

        const deleted = await util.gene_cons("DELETE FROM fin_dorde_comp WHERE id_orde_comp = ?", [encabezado.id_orde_comp])
        
        for(i=0;i<detalle.length;i++){

            lcSQL = `
            INSERT INTO fin_dorde_comp (id_orde_comp, articulo, cantidad, unidad, cost_unit, tasa_iva) VALUES (?, ?, ?, ?, ?, ?)
            `
            insertD = await util.gene_cons(lcSQL, [encabezado.id_orde_comp, detalle[i].articulo, detalle[i].cantidad, detalle[i].unidad, detalle[i].cost_unit, detalle[i].tasa_iva])
        }


        return res.json({"status" : "success", "message": "El registro se actualizo exitosamente, recuerda que aun no se generas la orden"})
    }

    
});


const fin_impr_oc = (async (req,res) => {

    if (req.groups.indexOf(",ORDE_COMP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcArchivo = path.join(__dirname, "..", "pdf/fondo-oc.jpg")
    const llArchivo = await other_utils.exit_arch(lcArchivo)
    let lcArchivoR = path.join(__dirname, "..", "pdf/fondo-ocr.jpg")
    const llArchivoR = await other_utils.exit_arch(lcArchivoR)

    let lcSQL = `
    SELECT o.id, o.foli_orde, o.tipo_orde, o.fech_emis, o.proyecto, o.rfc, o.proveedor, o.domi_prov, o.nomb_depe, o.tele_depe, o.ures_depe, o.domi_depe, 
					o.tele_prov, o.corr_prov, DATE_FORMAT(o.fech_entr, '%d/%m/%Y') as fech_entr, o.luga_entr, o.forma_pago, o.porc_anti, o.fech_inic, o.fech_fin, o.nume_parc, 
					o.subtotal, o.iva_total, o.total, o.observaciones, o.estatus, o.fech_crea, p.fondo, p.nombre AS nomb_proy, p.tipo_proy
        FROM fin_orde_comp o INNER JOIN fin_proyecto p on o.proyecto = p.proyecto
            LEFT join gen_centros c ON p.id_cent = c.id_cent
        WHERE o.id = ?
    `
    const datos = await util.gene_cons(lcSQL, [req.query.id])

    const doc = new PDFDocument({ size: 'letter', bufferPages: true, margins: {top: 245, bottom: 260, left: 0,right: 0}});
    
    //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response

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
        doc.text(`${!datos[0].foli_orde}`, 470, 23, {width: 110, align: 'center'});
        doc.text("03           11           2025", 470, 47, {width: 110, align: 'center'});
        doc.text(`${datos[0].proyecto}`, 520, 83, {width: 60, align: 'center'});
        doc.text(`${datos[0].fondo}`, 520, 94, {width: 60, align: 'center'});
        doc.text(`${datos[0].tipo_proy}`, 520, 105, {width: 60, align: 'center'});
        doc.fontSize(10).text(`${datos[0].nomb_depe}`, 165, 82, {width: 280, align: 'center'});
        doc.fontSize(8).text(`${datos[0].ures_depe}`, 143, 131, {width: 95, align: 'center'});
        doc.text(`${datos[0].nomb_depe}`, 240, 131, {width: 340, align: 'center'});
        doc.text(`${datos[0].tele_depe}`, 143, 152, {width: 95, align: 'center'});
        doc.text(`${datos[0].domi_depe}`, 240, 152, {width: 340, align: 'center'});
        doc.text(`${datos[0].domi_prov}`, 32, 178, {width: 207, align: 'left'});
        doc.text(`${datos[0].proveedor}`, 237, 178, {width: 342, align: 'center'});
        doc.text(`${datos[0].rfc}`, 237, 199, {width: 95, align: 'center'});
        doc.text(`${datos[0].corr_prov}`, 335, 199, {width: 130, align: 'center'});
        doc.text(`${datos[0].tele_prov}`, 465, 199, {width: 115, align: 'center'});

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

    const d = String(datos[0].fech_emis.getDate()).padStart(2, '0');
    const m = String(datos[0].fech_emis.getMonth() + 1).padStart(2, '0'); // +1 porque enero es 0
    const a = datos[0].fech_emis.getFullYear();
    const formatoMoneda = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN', // Peso Mexicano
        minimumFractionDigits: 2
    });

    doc.font("Helvetica").fontSize(8)
    doc.text(`${(!datos[0].foli_orde?'':datos[0].foli_orde)}`, 470, 23, {width: 110, align: 'center'});
    doc.text(`${d}             ${m}             ${a}`, 470, 47, {width: 110, align: 'center'});
    doc.text(`${datos[0].proyecto}`, 520, 83, {width: 60, align: 'center'});
    doc.text(`${datos[0].fondo}`, 520, 94, {width: 60, align: 'center'});
    doc.text(`${datos[0].tipo_proy}`, 520, 105, {width: 60, align: 'center'});
    doc.fontSize(10).text(`${datos[0].nomb_depe}`, 165, 82, {width: 280, align: 'center'});
    doc.fontSize(8).text(`${datos[0].ures_depe}`, 143, 131, {width: 95, align: 'center'});
    doc.text(`${datos[0].nomb_depe}`, 240, 131, {width: 340, align: 'center'});
    doc.text(`${datos[0].tele_depe}`, 143, 152, {width: 95, align: 'center'});
    doc.text(`${datos[0].domi_depe}`, 240, 152, {width: 340, align: 'center'});
    doc.text(`${datos[0].domi_prov}`, 32, 178, {width: 207, align: 'left'});
    doc.text(`${datos[0].proveedor}`, 237, 178, {width: 342, align: 'center'});
    doc.text(`${datos[0].rfc}`, 237, 199, {width: 95, align: 'center'});
    doc.text(`${datos[0].corr_prov}`, 335, 199, {width: 130, align: 'center'});
    doc.text(`${datos[0].tele_prov}`, 465, 199, {width: 115, align: 'center'});

    doc.options.autoFirstPage = false; // Opcional, dependiendo de tu versión
    // La propiedad clave es esta:
    doc.page.margins.bottom = 0; 

    // Ahora imprimes tus textos de la parte inferior
    doc.text(`${other_utils.montoALetras(datos[0].total)}`, 100, 530, {width: 325, align: 'center'});
    doc.text(`${formatoMoneda.format(datos[0].subtotal)}`, 506, 531, {width: 73, align: 'right'});
    doc.text(`${formatoMoneda.format(datos[0].iva_total)}`, 506, 546, {width: 73, align: 'right'});
    doc.text(`${formatoMoneda.format(datos[0].total)}`, 506, 560, {width: 73, align: 'right'});

    doc.text(`${datos[0].fech_entr}`, 100, 587, {width: 135, align: 'center'});
    doc.text(`${datos[0].luga_entr}`, 310, 587, {width: 195, align: 'left'});
    doc.text(`X`, 118, 598, {width: 195, align: 'left'});
    doc.text(`X`, 118, 607, {width: 195, align: 'left'});
    doc.text(`PAGO`, 152, 598, {width: 155, align: 'center'});
    doc.text(`PAGO`, 210, 607, {width: 30, align: 'center'});
    doc.text(`PAGO`, 330, 607, {width: 175, align: 'center'});
    doc.text(`X`, 569, 598, {width: 195, align: 'left'});
    doc.text(`X`, 569, 607, {width: 195, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 35, 624, {width: 540, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 30, 727, {width: 127, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 170, 747, {width: 127, align: 'left'});
    doc.text(`${datos[0].observaciones}`, 312, 747, {width: 130, align: 'left'});

    // Si vas a seguir agregando contenido después, recuerda restaurar el margen

/*      doc.lineJoin('round')
    .rect(506, 540, 73, 15)
    .fillAndStroke("#f1f4ff", "#000000"); */

    doc.page.margins.bottom = 260;
    doc.options.autoFirstPage = true;

    doc.fontSize(9)
    doc.y = 245;
    doc.x = 30;
    doc.table({
    columnStyles: [{ width: 46, align: 'center' }, { width: 307, align: 'left' }, { width: 51, align: 'center' }, { width: 72, align: 'right' }, { width: 75, align: 'right' }],
    rowStyles: { border: false},
    data: [
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],
        ["KG", "Sample value 2 fasdf asdf asf asd fasd fasdf s", "10", "5,000.00", "50,000.00"],

      ],
    })

    const range = doc.bufferedPageRange(); // { start: 0, count: 3 }

    for (let i = range.start; i < (range.start + range.count); i++) {
        // Nos movemos a la página i
        doc.switchToPage(i);
        
        let numPagina = i + 1;
        doc.fillColor("black").fontSize(8);
        
        // Escribimos en la esquina inferior derecha (ajusta según tu fondo)
        doc.text(
            `Página ${Math.ceil(numPagina/2)} de ${Math.ceil(range.count/2)}`, 
            250, 
            15, 
            { align: 'right', width: 100 }
        );
    }
    doc.end()

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

module.exports = {
    fin_orde_compx,
    fin_norde_compx2,
    fin_norde_compx,
    fin_impr_oc
}