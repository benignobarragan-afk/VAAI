const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));
const oplantilla = require(path.join(__dirname, "..", "utils/plantilla_pdf"));
const PDFDocument = require("pdfkit-table");
const fs = require('fs');

const progap_usuariox = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno)) AS rank, u.usuario, CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre,
	        if(u.id_tipo_usuario = 1, "Administrador", if(u.id_tipo_usuario = 2, "Revisor", if(u.id_tipo_usuario = 3, "Secretario Academico", 
            if(u.id_tipo_usuario = 4, "Coordinador de posgrado", if(u.id_tipo_usuario = 5, "Estudiante", "Sin definir"))))) AS tipo,
	        u.correo, d.siglas, if(estado = 1, "Activo", "Inactivo") AS status
	    FROM progap_usuarios u LEFT JOIN progap_nivel_estudios e ON u.id_nivel_estudios = e.id
		    LEFT JOIN progap_dependencias d ON u.id_centro_universitario = d.id
            ${(!req.query.lnConv?'':'WHERE id_convocatoria = '+ req.query.lnConv)}
        ORDER BY 3

    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_directivox = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY a.nombres) AS rank, a.id, a.cargo, a.nombres AS nombre, if(LEFT(a.genero,1) = "M", g.abreviatura_m, g.abreviatura_f) AS grado,
            genero, d.siglas, a.correo
        FROM progap_altos_mandos a LEFT JOIN progap_grado g ON a.id_grado = g.id
        LEFT JOIN progap_dependencias d ON a.id_cu = d.id
        ${(!req.query.lnConv || req.query.lnConv == "-1"?'':'WHERE a.cargo = "'+ req.query.lnConv + '"')}
        ORDER BY a.nombres
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_estudiax = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY nombre_completo) AS rank, id, codigo, nombre_completo AS nombre, correo, campus, if(estado = 1, "Activo", "Inactivo") AS status 
        FROM progap_accesos
        ${(!req.query.lnConv?'':'WHERE codigo IN (SELECT usuario FROM progap_usuarios WHERE id_convocatoria = '+ req.query.lnConv) + ')'}
        order by nombre_completo
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_convocax = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY id_status DESC, abierto_registro DESC) AS rank, id, anio, convocatoria, lema, arancel_maestria, arancel_doctorado, 
            DATE_FORMAT(abierto_registro, "%d/%m/%Y") AS abierto_registro, DATE_FORMAT(cerrado_registro, "%d/%m/%Y") as cerrado_registro, 
            DATE_FORMAT(abierto_focam, "%d/%m/%Y") as abierto_focam, DATE_FORMAT(cerrado_focam, "%d/%m/%Y") as cerrado_focam, 
            DATE_FORMAT(abierto_exacam, "%d/%m/%Y") as abierto_exacam, DATE_FORMAT(cerrado_exacam, "%d/%m/%Y") as cerrado_exacam, 
            if(id_status = 1, "Activo", "Inactivo") AS status
        FROM progap_convocatoria
        order by id_status DESC, abierto_registro DESC
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_exacamx = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    
    SELECT ROW_NUMBER() OVER (ORDER BY e.numero_oficio) AS rank, e.id, e.numero_oficio, d.siglas, CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre, 
            c.nombre AS calen, if(e.id_estado = 1, "En trámite", if(e.id_estado = 2, "Enviado a revisión", if(e.id_estado = 3, "Solicitud completa", "Pendiente"))) AS status
        FROM progap_exacam e LEFT JOIN progap_ciclos c ON e.id_ciclo = c.id
        LEFT JOIN progap_dependencias d ON e.id_cu = d.id
        LEFT JOIN progap_usuarios u ON e.id_usuario = u.id
        ${(!req.query.lnConv?'':'WHERE e.id_estado > 1 AND e.id_convocatoria = '+ req.query.lnConv)}
        ORDER BY e.numero_oficio

    `
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_focamx = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    
    SELECT ROW_NUMBER() OVER (ORDER BY a.id) AS rank, a.id, a.id as folio, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, a.codigo, 
    		 d.dependencia, CONCAT(p.clave_cgipv, ' - ', p.programa) AS programa, DATE_FORMAT(a.fecha_solicitud, '%d/%m/%Y') AS fecha_solicitud,
            if(a.id_estado = 4, "Rechazado", if(a.id_estado = 3, "Solicitud completa", if(a.id_estado = 5, "Es necesario corregir", 
		    if(a.id_estado = 2, "Enviado a revisión", "Sin enviar")))) AS status

        FROM progap_alumnos a 
        LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
        LEFT JOIN progap_dependencias d ON u.id_centro_universitario = d.id
        LEFT JOIN progap_programa p ON a.id_programa = p.id
        ${(!req.query.lnConv?'':'WHERE a.id_convocatoria = '+ req.query.lnConv)} 
        ORDER BY a.id

    `
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_form01 = ( async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
    SELECT COUNT(*) as total
        FROM log_visitas 
        WHERE usuario_id = ${req.userId} AND DATE(fecha_visita) = DATE(NOW()) AND LEFT(URL,18) = "/api/progap/prueba"
    `
    const rows = await util.gene_cons(lcSQL)

    if (rows[0].total > 200){
    lcSQL = `
    UPDATE passfile SET bloqueada = 1, bloq_MOTI = "Bloqueo por mas de 200 descargas de formato: '/api/progap/prueba' por día",
    		cambios = CONCAT(IFNULL(cambios, ''), "BLOQUEO_AUTO-/api/progap/prueba", DATE_FORMAT(NOW(), "%d/%m/%Y %h:%i")) 
	    WHERE user_id = '${req.userId}'
    `
    const bloqueo = await util.gene_cons(lcSQL)
    return res.render("cuen_bloq")
    } 

    lcSQL =  `
    SET lc_time_names = 'es_MX';

    SELECT concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, curp, a.codigo, 
            d.dependencia, CONCAT(p.clave_cgipv, ' - ', p.programa) AS programa, ci.nombre AS cicl_ingr, 
            cc.nombre AS cicl_curs, cco.nombre AS cicl_cond, a.correo_institucional, d.municipio, a.fecha_solicitud,
            CONCAT(CONVERT(d.municipio USING utf8mb4), ', Jalisco, México; a ', DATE_FORMAT(a.fecha_solicitud, '%d de %M de %Y')) AS fecha_texto
        FROM progap_alumnos a 
        LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
        LEFT JOIN progap_dependencias d ON u.id_centro_universitario = d.id
        LEFT JOIN progap_programa p ON a.id_programa = p.id
        LEFT JOIN progap_ciclos ci ON a.id_ciclo_ingreso = ci.id
        LEFT JOIN progap_ciclos cc ON a.id_ciclo_curso = cc.id
        LEFT JOIN progap_ciclos cco ON a.id_ciclo_condonar = cco.id	
        WHERE a.id = ${req.query.id}
    `
    const laAlumno = await util.gene_cons(lcSQL)

    if (!laAlumno[1][0]){
        return res.render("sin_derecho")
    }
    //console.log(laAlumno[1][0])

    const doc = new PDFDocument({ size: 'letter' });

    //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response

    doc.fontSize(11);
    doc.moveDown(3);
    doc.font('Helvetica-Bold');
    doc.text(`Dr. Jaime Federico Andrade Villanueva`, { continued: true });
    doc.font('Helvetica');
    doc.text(`
Vicerrector adjunto
Vicerrector Adjunto Académico y de Investigación
Presente
`
    );
    doc.moveDown(2);
    doc.fontSize(10);
    doc.text ( `Por este medio, le envío un cordial saludo y aprovecho la ocasión para informarle que actualmente soy estudiante activo de la Universidad de Guadalajara, conforme a los datos que se detallan al final de este oficio. En tal calidad, me permito solicitar la condonación total del pago de matrícula del posgrado que actualmente curso, en los términos establecidos en el Programa Compensatorio para la Transición Gradual hacia la Gratuidad de los Servicios Educativos de Posgrado.`, {align: 'justify'})
    doc.moveDown();
    doc.text ( `Le agradecería que, a través de su amable gestión, esta solicitud sea presentada para consideración de la Comisión Permanente de Condonaciones y Becas del Consejo General Universitario.`, {align: 'justify'})
    doc.moveDown();
    doc.text ( `Asimismo, estoy al tanto de que el beneficio solicitado abarca exclusivamente el concepto de matrícula, por lo que cualquier otra cuota autorizada por la normativa institucional será cubierta por mi parte.`, {align: 'justify'})
    doc.moveDown();
    doc.text ( `Adjunto a esta solicitud los datos correspondientes, para que puedan ser evaluados y, en su caso, aprobados.`, {align: 'justify'});
    doc.moveDown(1);

    const table = {
      headers: [{label:"Datos del solicitante"},{hideHeader: true}],
      rows: [
        ["Nombre completo:",laAlumno[1][0].nombre],
        ["CURP:",laAlumno[1][0].curp],
        ["Código de estudiante:",laAlumno[1][0].codigo],
        ["Centro universitario de adcripción:",laAlumno[1][0].dependencia],
        ["Clave y nombre del programa académico:",laAlumno[1][0].programa],
        ["Ciclo escolar de ingreso:",laAlumno[1][0].cicl_ingr],
        ["Ciclo escolar en curso:",laAlumno[1][0].cicl_curs],
        ["Ciclo escolar por condonar:",laAlumno[1][0].cicl_cond],
        ["Correo institucional:",laAlumno[1][0].correo_institucional],
      ],
    };

    await doc.table(table, { prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
        prepareRow: (row, indexColumn, indexRow, rectRow) => {
        doc.font("Helvetica").fontSize(9);
        }
    });
/*     doc.table({
        rowStyles: (i) => {
    if (i === 0) return { backgroundColor: "#ccc" };
    },
    data: [
        [{colSpan:2, text:"Datos del solicitante"}],
        ["Nombre completo:",""],
        ["CURP:",""],
        ["Código de estudiante:",""],
        ["Centro universitario de adcripción:",""],
        ["Clave y nombre del programa académico:",""],
        ["Ciclo escolar de ingreso:",""],
        ["Ciclo escolar en curso:",""],
        ["Ciclo escolar por condonar:",""],
        ["Correo institucional:",""],
    ]
    }); */
    doc.fontSize(10);
    doc.moveDown(2);
    doc.text ( `Sin otro particular, reciban un cordial saludo.`, {align: 'justify'});
    doc.moveDown(1);
    doc.text ( `
Atentamente
${laAlumno[1][0].fecha_texto}`, {align: 'center'});
    doc.moveDown(4);
    doc.moveTo(180, doc.y)
    .lineTo(450, doc.y)
    .stroke();
    doc.moveDown(1);
   doc.text ( `${laAlumno[1][0].nombre}`, {align: 'center'});
    doc.end();
});

const prueba2 = ( async (req, res) => {

    const doc = new PDFDocument({bufferPages: true}
        /* {margin: 50, 
        margins: { top: 120, bottom: 80, left: 50, right: 50 }, 
        bufferPages: true} */
    );

    doc.on('pageAdded', async () => {
        oplantilla.plantilla01(doc, "CUCS.png");
        doc.fillColor('black').fontSize(12); // Resetear estilo para el contenido
        doc.page.margins.top = 120; // Reforzamos el margen de la página actual
        doc.page.margins.bottom = 10; // Reforzamos el margen de la página actual
        doc.y = 120;
    });
    
/*     let lcArchivo = path.join(__dirname, "..", "pdf/imagenes/CUCS.PNG")
    const llArchivo = await other_utils.exit_arch(lcArchivo)
    if (llArchivo){
        doc.image(lcArchivo, 25, 25, {width: 630});
    }
    else
    {
        lcArchivo = path.join(__dirname, "..", "pdf/imagenes/VICERRECTORIA.jpg")
        doc.image(lcArchivo, 25, 25, {width: 580})
    }
 */
    oplantilla.plantilla01(doc, "CUCS.png");
    doc.fillColor('black').fontSize(10); // Resetear estilo para el contenido
    doc.y = 120; // Resetear posición vertical para no encimar el encabezado

    //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response

    doc.font('Helvetica');
    doc.fontSize(10);
    //doc.moveDown(3);
    doc.text(`REC/0223/2025`, { align: 'right' });
    doc.fontSize(11);
    doc.moveDown(1);
    doc.font('Helvetica-Bold');
    doc.text(`Dr. Jaime Federico Andrade Villanueva`, { continued: true });
    doc.font('Helvetica');
    doc.text(`
Vicerrector adjunto
Vicerrector Adjunto Académico y de Investigación
Presente
`
    );
    doc.moveDown(2);
    doc.fontSize(10);
    doc.text ( `Por este medio reciba un cordial saludo y a su vez, me permito solicitar que, por su amable conducto, se pueda poner a consideración de la Comisión Permanente Condonaciones y Becas del Consejo General Universitario la solicitud de condonación conforme a lo estabiecido en el Programa Compensatorio para la Transición Gradual hacia la Gratuidad de los Servicios Educativos de Posgrado, relativa a los estudiantes de posgrado del Centro Universitario de Ciencias Biológicas y Agropecuarias.`, {align: 'justify'})
    doc.moveDown();
    doc.text ( `Al respecto, le comparto la información concentrada de los estudiantes de posgrado susceptibles de ser beneficiados y el monto de apoyo económico a condonar por nivel educativo, para efectos del traslado de los recursos financieros equivalente a las matrícuias condonadas, conforme se enlista a continuación:`, {align: 'justify'})
    doc.moveDown(2);
/*     doc.table({
        rowStyles: (i) => {
    if (i === 0) return { backgroundColor: "#ccc" };
    },
    data: [
        [{text: "Nivel educativo del programa", align: 'center'}, {text: "Cantidad de alumnos", align: 'center'}, {text: "Ciclo escolar del cual se solicita condonación de matricula", align: 'center'}, {text: "Monto total de apoyo de condonación por nivel educativo", align: 'center'}],
        ["Doctorado",{text: "0", align: 'center'},{text: "2025-B", align: 'center'},{text: "$0.00", align: 'right'}],
        ["Maestría",{text: "1", align: 'center'},{text: "2025-B", align: 'center'},{text: "$9,458.52", align: 'right'}],
    ]
    }); */
    let table = {
      headers: [{label:"Nivel educativo del programa", align: 'center'},
        {label:"Cantidad de alumnos", align: 'center'},
        {label:"Ciclo escolar del cual se solicita condonación de matricula", align: 'center'},
        {label:"Monto total de apoyo de condonación por nivel educativo", headerAlign: 'center', align: 'right', renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => { return `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } }
        ],
      rows: [
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
      ],
    };

    await doc.table(table, {columnsSize: [ 150, 80, 115, 115 ],
    });

    doc.fontSize(10);
    doc.moveDown(2);

    doc.text ( `Se incluye como parte de esta solicitud un expediente que contiene la información y documentación de la totalidad del alumnado y programas educativos de este Centro Universitario, según se solicita en el numeral 3 del apartado 9 de las Reglas de Operación del Programa antes mencionado.`, {align: 'justify'});
    doc.text ( `Sin otro particular, reciban un cordial saludo.`, {align: 'justify'});
    doc.moveDown(1);
    doc.text ( `
    Atentamente`, {align: 'center',continued: true});
    doc.font('Helvetica-Bold');    
    doc.text ( `
"PIENSA Y TRABAJA"                 
"1925-2025, Un Siglo de Pensar y Trabajar"                 `, {align: 'center',continued: true});
doc.font('Helvetica');    
    doc.text ( `
Ameca, Jalisco, México; a 16 de octubre de 2025`, {align: 'center'});
    doc.moveDown(4);
    doc.moveTo(180, doc.y)
    .lineTo(450, doc.y)
    .stroke();
    doc.moveDown(1);
   doc.text ( `
Dra. Graciela Gudiño Cabrera
Rectora del Centro Universitario de Ciencias Biológicas y Agropecuarias`, {align: 'center'});

    doc.addPage();
    doc.fillColor("#047195")
        .font('Helvetica-Bold')
        .fontSize(15)
        .text (`Vicerrectoría Adjunta Académica y de Investigación`, {align: 'center'});

    doc.moveDown()

    doc.rect(84, doc.y-21, 456, 35)
        .lineWidth(0)
        .fill("#f2f2f2")
        .stroke();
        //doc.moveDown()
    
    doc.moveDown(-1)

    doc.fillColor("#047195")
        .font('Helvetica')
        .fontSize(12)
        .text (`Expediente de Alumnos para Condonación del Arancel por concepto de Matrícula (EXACAM) Ejercicio de 2025-B`, {align: 'center'});

    doc.moveDown(1)

    doc.fillColor('black')
        .fontSize(11)
        .text (`El siguiente listado de alumnos se pone a disposición de las autoridades universitarias correspondes para ser consideradas como beneficiarios del "Programa Compensatorio para la Transición Gradual hacia la Gratuidad de los Servicios Educativos de Posgrado", previa revisión del cumplimiento de los requisitos establecidos en las reglas de operación correspondientes por cada centro universitario.`, {align: 'justify'});

    doc.moveDown(1)
    
    doc.rect(84, doc.y-2, 456, 15)
        .lineWidth(0)
        .fill("#f2f2f2")
        .stroke();
        //doc.moveDown()
    

    doc.fillColor('black')
        .fontSize(9)
        .text(`    Centro universitario que presenta la solicitud:`, {align: 'left'});

    doc.moveDown(5)


    table = {
    headers: [{label:"Nivel educativo del programa", align: 'center'},
        {label:"Cantidad de alumnos", align: 'center'},
        {label:"Ciclo escolar del cual se solicita condonación de matricula", align: 'center'},
        {label:"Monto total de apoyo de condonación por nivel educativo", align: 'right', renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => { return `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } }
        ],
      rows: [
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],
        ["Doctorado","0", "2025-B", "0"],
        ["Maestría","1", "2025-B", "9458.52"],

        ],
    };

    await doc.table(table, {columnsSize: [ 150, 80, 115, 115 ],
        //addPage: true, 
        onPageAdd: (doc) => {
        doc.y = 120;
        
    }
    });

    doc.end();
});

module.exports = {
    progap_usuariox,
    progap_directivox,
    progap_estudiax,
    progap_convocax,
    progap_exacamx,
    progap_focamx,
    progap_form01,
    prueba2
}