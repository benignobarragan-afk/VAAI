const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
//const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));
const oplantilla = require(path.join(__dirname, "..", "utils/plantilla_pdf"));
const PDFDocument = require("pdfkit-table");
const fs = require('fs');
const { cacheUsuarios } = require("../middlewares/authjwt");


const progap_usuariox = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    let parameters = []
    let lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno)) AS rank, u.id, u.usuario, CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS nombre,
	        if(u.id_tipo_usuario = 1, "Administrador", if(u.id_tipo_usuario = 2, "Revisor", if(u.id_tipo_usuario = 3, "Secretario Academico", 
            if(u.id_tipo_usuario = 4, "Coordinador de posgrado", if(u.id_tipo_usuario = 5, "Estudiante", "Sin definir"))))) AS tipo,
	        u.correo, d.siglas, if(a.estado = 1, "Activo", "Inactivo") AS status
	    FROM progap_usuarios u LEFT JOIN progap_nivel_estudios e ON u.id_nivel_estudios = e.id
		    LEFT JOIN progap_dependencias d ON u.id_centro_universitario = d.id
    `
    if (!!req.query.lnConv){
        lcSQL = lcSQL + " WHERE id_convocatoria = ? "
        parameters.push(req.query.lnConv);
    }
    lcSQL = lcSQL + " ORDER BY u.nombre, u.apellido_paterno,u.apellido_materno "

    const rows = await util.gene_cons(lcSQL, parameters)
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

    let lcWhere = ''
/*     const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY nombre_completo) AS rank, id, codigo, nombre_completo AS nombre, correo, campus, if(estado = 1, "Activo", "Inactivo") AS status 
        FROM progap_accesos
        ${(!req.query.lnConv?'':'WHERE codigo IN (SELECT usuario FROM progap_usuarios WHERE id_convocatoria = '+ req.query.lnConv) + ')'}
        order by nombre_completo
    `
 
    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY a.nombre, a.apellido_paterno, a.apellido_materno) as rank, a.id, a.codigo, CONCAT(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, a.correo_institucional,
            d.siglas, if(IFNULL(a.id_estado, 0) < 3, 'Inactivo', 'Activo') AS status
        FROM progap_alumnos a 
            LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id 
        ${!req.query.lnConv?'':'WHERE a.id_convocatoria = ' + req.query.lnConv}
        ORDER BY a.nombre, a.apellido_paterno, a.apellido_materno
    `
*/
    if (req.query.lnConv > 0){
        lcWhere = `WHERE a.codigo in 
            (SELECT codigo 
                FROM progap_tram_focam 
                WHERE id_convocatoria = ?)
        `
    }

    const lcSQL = `
    SELECT ROW_NUMBER() OVER (ORDER BY a.nombre, a.apellido_paterno, a.apellido_materno) as rank, a.id, a.codigo, CONCAT(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, a.correo_institucional,
            d.siglas, if(IFNULL(a.id_estado, 0) < 3, 'Inactivo', 'Activo') AS status
        FROM progap_alumno a 
            LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id 
            ${(lcWhere.length > 0?lcWhere:'')}
        ORDER BY a.nombre, a.apellido_paterno, a.apellido_materno
    `

    const rows = await util.gene_cons(lcSQL, [req.query.lnConv])
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
        ${(!req.query.lnConv?'':'WHERE a.id_convocatoria = '+ req.query.lnConv)} ${(!req.query.id_cu?'':' AND u.id_centro_universitario = '+ req.query.id_cu)}  
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
        WHERE usuario_id = ? AND LEFT(URL,18) = "/api/progap/progap_form01" 
            AND fecha_visita > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `
    const rows = await util.gene_cons(lcSQL, [req.userId])

    if (rows[0].total > 20){
    lcSQL = `
    UPDATE passfile SET bloqueada = 1, bloq_MOTI = "Bloqueo por mas de 20 descargas de formato: '/api/progap/progap_form01' en una hora",
    		cambios = CONCAT(IFNULL(cambios, ''), "BLOQUEO_AUTO-/api/progap/progap_form01", DATE_FORMAT(NOW(), "%d/%m/%Y %h:%i")) 
	    WHERE user_id = ?
    `
    const bloqueo = await util.gene_cons(lcSQL, [req.userId])

    // 5. Limpiar caché para que el bloqueo sea inmediato
    cacheUsuarios.delete(req.userId);
    console.log(`Usuario ${userId} bloqueado por seguridad.`);
    
    return res.render("cuen_bloq")
    } 

/*     lcSQL =  `
    SELECT u.id, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, curp, a.codigo, 
            d.dependencia, CONCAT(p.clave_cgipv, ' - ', p.programa) AS programa, ci.nombre AS cicl_ingr, 
            cc.nombre AS cicl_curs, cco.nombre AS cicl_cond, a.correo_institucional, d.municipio, a.fecha_solicitud,
            d.municipio, a.fecha_solicitud, u.uid
        FROM progap_alumnos a 
        LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
        LEFT JOIN progap_dependencias d ON u.id_centro_universitario = d.id
        LEFT JOIN progap_programa p ON a.id_programa = p.id
        LEFT JOIN progap_ciclos ci ON a.id_ciclo_ingreso = ci.id
        LEFT JOIN progap_ciclos cc ON a.id_ciclo_curso = cc.id
        LEFT JOIN progap_ciclos cco ON a.id_ciclo_condonar = cco.id	
        WHERE a.id = ?
    ` */
    
    lcSQL =  `
    SELECT t.id, t.codigo, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, a.curp, 
            d.dependencia, CONCAT(p.clave_cgipv, ' - ', p.programa) AS programa, ci.nombre AS cicl_ingr, 
            cc.nombre AS cicl_curs, cco.nombre AS cicl_cond, a.correo_institucional, d.municipio, a.fecha_solicitud, t.uid
        FROM progap_tram_focam t LEFT JOIN progap_alumno a ON t.codigo = a.codigo
            LEFT JOIN progap_dependencias d ON t.id_centro_universitario = d.id
            LEFT JOIN progap_programa p ON t.id_programa = p.id
            LEFT JOIN progap_ciclos ci ON t.id_ciclo_ingreso = ci.id
        LEFT JOIN progap_ciclos cc ON t.id_ciclo_curso = cc.id
        LEFT JOIN progap_ciclos cco ON t.id_ciclo_condonar = cco.id	
        WHERE t.id = ?
    `

    const laAlumno = await util.gene_cons(lcSQL, [req.query.id])

    const qrData = "https://progap/validador/" + laAlumno[0].uid
    const qrImage = await util.generarQrBase64(qrData);

    const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = laAlumno[0].fecha_solicitud.toLocaleDateString('es-MX', opciones);

    if (!laAlumno[0]){
        return res.render("sin_derecho")
    }
    //console.log(laAlumno[0])

    const doc = new PDFDocument({ size: 'letter' });

    //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response

    doc.fontSize(11);
    doc.moveDown(1);
    doc.font('Helvetica-Bold');
    doc.text(`${config.VICERRECTOR}`, { continued: true });
    doc.font('Helvetica');
    doc.text(`
Vicerrector Adjunto Académico y de Investigación
Vicerrectoría Ejecutiva
Universidad de Guadalajara
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
        ["Nombre completo:",laAlumno[0].nombre],
        ["CURP:",laAlumno[0].curp],
        ["Código de estudiante:",laAlumno[0].codigo],
        ["Centro universitario de adcripción:",laAlumno[0].dependencia],
        ["Clave y nombre del programa académico:",laAlumno[0].programa],
        ["Ciclo escolar de ingreso:",laAlumno[0].cicl_ingr],
        ["Ciclo escolar en curso:",laAlumno[0].cicl_curs],
        ["Ciclo escolar por condonar:",laAlumno[0].cicl_cond],
        ["Correo institucional:",laAlumno[0].correo_institucional],
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
${laAlumno[0].municipio}, Jalisco, México, a ${fechaFormateada}`, {align: 'center'});
    doc.moveDown(4);
    doc.moveTo(180, doc.y)
    .lineTo(450, doc.y)
    .stroke();
    doc.moveDown(1);
   doc.text ( `${laAlumno[0].nombre}`, {align: 'center'});
   doc.image(qrImage, 450, 50, { width: 80 });
    doc.end();
});

const progap_form02 = ( async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
    SELECT COUNT(*) as total
        FROM log_visitas 
        WHERE usuario_id = ${req.userId} AND LEFT(URL,18) = "/api/progap/progap_form02"
            AND fecha_visita > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `
    const rows = await util.gene_cons(lcSQL)

    if (rows[0].total > 5){
    lcSQL = `
    UPDATE passfile SET bloqueada = 1, bloq_MOTI = "Bloqueo por mas de 5 descargas de formato: '/api/progap/progap_form02' en una hora",
    		cambios = CONCAT(IFNULL(cambios, ''), "BLOQUEO_AUTO-/api/progap/progap_form02", DATE_FORMAT(NOW(), "%d/%m/%Y %h:%i")) 
	    WHERE user_id = '${req.userId}'
    `
    const bloqueo = await util.gene_cons(lcSQL)

    // 5. Limpiar caché para que el bloqueo sea inmediato
    cacheUsuarios.delete(req.userId);
    console.log(`Usuario ${userId} bloqueado por seguridad.`);
    
    return res.render("cuen_bloq")
    } 

    lcSQL =  `
    SET lc_time_names = 'es_MX';
    
    SELECT ex.id AS id_exacam, cco.nombre AS cicl_cond, a.id_centro_universitario, ex.numero_oficio, SUM(if(LEFT(p.nivel,1) = 'D', c.arancel_doctorado, 0)) AS nive_doct,
            SUM(if(LEFT(p.nivel,1) != 'D', c.arancel_maestria, 0)) AS nive_otro, SUM(if(LEFT(p.nivel,1) = 'D', c.arancel_doctorado, c.arancel_maestria)) as nive_tota,
            SUM(if(LEFT(p.nivel,1) = 'D', 1, 0)) AS alum_doct, SUM(if(LEFT(p.nivel,1) != 'D', 1, 0)) AS alum_otro, count(*) as alum_tota, 
            MAX(date_format(ex.fecha, '%d de %M de %Y')) AS fecha
        FROM progap_alumnos a
        LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
        LEFT JOIN progap_convocatoria c ON a.id_convocatoria = c.id
        LEFT JOIN progap_exacam ex ON ex.id_cu = a.id_centro_universitario AND  ex.id_convocatoria = a.id_convocatoria
        LEFT JOIN progap_programa p ON a.id_programa = p.id
        LEFT JOIN progap_ciclos cco ON a.id_ciclo_condonar = cco.id	
        WHERE ex.id = ${req.query.id} and a.id_estado = 3
        group BY 1,2,3,4
    `
    const ltTotal = await util.gene_cons(lcSQL)

    lcSQL =  `
    SELECT ROW_NUMBER() OVER (ORDER BY p.nivel, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno)) AS rank,
            a.id, p.programa, a.codigo, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno) AS nombre, cco.nombre AS cicl_cond,
            p.nivel, if(LEFT(p.nivel,1) = 'D', c.arancel_doctorado, c.arancel_maestria) AS monto
        FROM progap_alumnos a
        LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
        LEFT JOIN progap_convocatoria c ON a.id_convocatoria = c.id
        LEFT JOIN progap_exacam ex ON ex.id_cu = a.id_centro_universitario AND  ex.id_convocatoria = a.id_convocatoria
        LEFT JOIN progap_programa p ON a.id_programa = p.id
        LEFT JOIN progap_ciclos cco ON a.id_ciclo_condonar = cco.id	
        WHERE ex.id = ${req.query.id} AND a.id_estado = 3
        ORDER BY p.nivel, concat(a.nombre, ' ', a.apellido_paterno, ' ', a.apellido_materno)
    `
    const ltDeta = await util.gene_cons(lcSQL)

    lcSQL =  `
    SELECT am.id, concat(if(LEFT(am.genero, 1) = "F", g.abreviatura_f, g.abreviatura_m), ' ', am.nombres) AS nombre, 
            if(am.cargo = 'Revisor', "Revisado por: ", if(am.cargo = "Autorizador", "Autorizado por:", "")) AS cargo,
            CONCAT(am.cargo, if(LEFT(am.genero, 1) = "F", 'a', ''), ' del ', d.dependencia)  AS carg_rect, d.siglas, d.dependencia,
            CONCAT(d.municipio , ', Jalisco, México, a ', '${ltTotal[1][0].fecha}') AS fecha_texto  
        FROM progap_altos_mandos am LEFT JOIN progap_grado g ON am.id_grado = g.id
            LEFT JOIN progap_dependencias d ON am.id_cu = d.id
        WHERE id_cu = ${ltTotal[1][0].id_centro_universitario}
        ORDER BY 1 
    `

    const ltDire = await util.gene_cons(lcSQL)

    const laDeta = ltDeta.map(item => [
        item.rank,
        item.programa,
        item.codigo,
        item.nombre,
        item.cicl_cond,
        item.nivel,
        item.monto
    ]);
    //console.log(ltDeta)
    //console.log(laDeta)
    const doc = new PDFDocument({bufferPages: true}
        /* {margin: 50, 
        margins: { top: 120, bottom: 80, left: 50, right: 50 }, 
        bufferPages: true} */
    );

    doc.on('pageAdded', async () => {
        oplantilla.plantillaOC(doc, ltDire[0].siglas + ".png");
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
    oplantilla.plantilla01(doc, ltDire[0].siglas + ".png");
    doc.fillColor('black').fontSize(10); // Resetear estilo para el contenido
    doc.y = 120; // Resetear posición vertical para no encimar el encabezado

    //doc.pipe(fs.createWriteStream('prueba.pdf')); // write to PDF
    doc.pipe(res);                                       // HTTP response

    doc.font('Helvetica');
    doc.fontSize(10);
    //doc.moveDown(3);
    console.log(ltTotal)
    doc.text(`${ltTotal[1][0].numero_oficio}`, { align: 'right' });
    doc.fontSize(11);
    doc.moveDown(1);
    doc.font('Helvetica-Bold');
    doc.text(`${config.VICERRECTOR}`, { continued: true });
    doc.font('Helvetica');
    doc.text(`
Vicerrector Adjunto Académico y de Investigación
Vicerrectoría Ejecutiva
Universidad de Guadalajara
Presente
`
    );
    doc.moveDown(2);
    doc.fontSize(10);
//    doc.text ( `Por este medio reciba un cordial saludo y a su vez, me permito solicitar que, por su amable conducto, se pueda poner a consideración de la Comisión Permanente Condonaciones y Becas del Consejo General Universitario la solicitud de condonación conforme a lo estabiecido en el Programa Compensatorio para la Transición Gradual hacia la Gratuidad de los Servicios Educativos de Posgrado, relativa a los estudiantes de posgrado del Centro Universitario de Ciencias Biológicas y Agropecuarias.`, {align: 'justify'})
    doc.text ( `Por este medio, reciba un cordial saludo. Asimismo, me permito solicitar atentamente que, por su amable conducto, se someta a consideración de la Comisión Permanente de Condonaciones y Becas del Consejo General Universitario la solicitud de condonación, conforme a lo establecido en el Programa Compensatorio para la Transición Gradual hacia la Gratuidad de los Servicios Educativos de Posgrado, relativa a las y los estudiantes de posgrado del Centro Universitario de Ciencias Biológicas y Agropecuarias.`, {align: 'justify'})
    doc.moveDown();
//    doc.text ( `Al respecto, le comparto la información concentrada de los estudiantes de posgrado susceptibles de ser beneficiados y el monto de apoyo económico a condonar por nivel educativo, para efectos del traslado de los recursos financieros equivalente a las matrícuias condonadas, conforme se enlista a continuación:`, {align: 'justify'})
    doc.text ( `Al respecto, se adjunta  la información concentrada de los estudiantes de posgrado susceptibles de ser beneficiados, así como el monto del apoyo económico a condonar por nivel educativo, para efectos del traslado de los recursos financieros equivalentes a las matrículas condonadas, conforme se detalla a continuación:`, {align: 'justify'})
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
        ["Doctorado",ltTotal[1][0].alum_doct, ltTotal[1][0].cicl_cond, ltTotal[1][0].nive_doct],
        ["Maestría",ltTotal[1][0].alum_otro, ltTotal[1][0].cicl_cond, ltTotal[1][0].nive_otro],
      ],
    };

    await doc.table(table, {columnsSize: [ 150, 80, 115, 115 ],
    });

    doc.fontSize(10);
    doc.moveDown(2);

    doc.text ( `Se incluye como parte de esta solicitud un expediente que contiene la información y documentación de la totalidad del alumnado y programas educativos de este Centro Universitario, según se solicita en el numeral 3 del apartado 9 de las Reglas de Operación del Programa antes mencionado.`, {align: 'justify'});
    doc.text ( `
Sin otro particular, reciban un cordial saludo.`, {align: 'justify'});
    doc.moveDown(2)
    .text ( `Atentamente`, {align: 'center'});
    doc.font('Helvetica-Bold')    
    .text ( `"PIENSA Y TRABAJA"
"1925-2025, Un Siglo de Pensar y Trabajar"`, {align: 'center'});
    doc.font('Helvetica')
    .text ( `${ltDire[0].fecha_texto}`, {align: 'center'});
    doc.moveDown(4);
    doc.moveTo(180, doc.y)
    .lineTo(450, doc.y)
    .stroke();
    doc.moveDown(2);
   doc.text ( `${ltDire[0].nombre}
${ltDire[0].carg_rect}`, {align: 'center'});

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
    
    doc.rect(84, doc.y-2, 456, (ltDire[0].dependencia.length > 65?25:15))
        .lineWidth(0)
        .fill("#f2f2f2")
        .stroke();
        //doc.moveDown()
    

    doc.fillColor('black')
        .fontSize(9)
        .text(`    Centro universitario que presenta la solicitud: `, {align: 'left'});

    doc.moveDown(-1)
    doc.x = 280
    doc.fillColor('black')
        .fontSize(9)
        .text(`${ltDire[0].dependencia}`, {align: 'center'});

    doc.x = 80
    doc.moveDown(2)
    //columna 1
    doc.rect(84, doc.y-6, 160, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(84, doc.y+12, 160, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(84, doc.y+30, 160, 18)
        .lineWidth(1)
        .stroke();
    //columna 2
    doc.rect(244, doc.y-6, 40, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(244, doc.y+12, 40, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(244, doc.y+30, 40, 18)
        .lineWidth(1)
        .stroke();
    //columna 3
    doc.rect(300, doc.y-6, 160, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(300, doc.y+12, 160, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(300, doc.y+30, 160, 18)
        .lineWidth(1)
        .stroke();
    //columna 4
    doc.rect(460, doc.y-6, 80, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(460, doc.y+12, 80, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(460, doc.y+30, 80, 18)
        .lineWidth(1)
        .stroke();
    doc.x = 80

    //texto columna 1
    doc.moveDown(-1)
    doc.fillColor('#047195')
        .fontSize(8)
        .text(`
Total de alumnos a condonar

Alumnos de Maestría a condonar

Alumnos de Doctorado a condonar
            `, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });

    //texto columna 2
    doc.moveDown(-7)
        .fillColor('#000000')
        .fontSize(8)
        .text(`
${ltTotal[1][0].alum_tota}

${ltTotal[1][0].alum_otro}

${ltTotal[1][0].alum_doct}
            `, {
                width: 400,      // Ancho de la columna
                align: 'right',
                columns: 2,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });

//texto columna 3
    doc.x = 300
    doc.moveDown(-7)
    doc.fillColor('#047195')
        .fontSize(8)
        .text(`
Monto total a condonar

Monto a condonar de nivel maestría

Monto a condonar de nivel doctorado
            `, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });

    //texto columna 4
    doc.moveDown(-7)
        .fillColor('#000000')
        .fontSize(8)
        .text(`
$ ${Number(ltTotal[1][0].nive_tota).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}            

$ ${Number(ltTotal[1][0].nive_otro).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

$ ${Number(ltTotal[1][0].nive_doct).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            `, {
                width: 480,      // Ancho de la columna
                align: 'right',
                columns: 2,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });


    doc.x = 80
    doc.moveDown(2)
    doc.fillColor('#047195')
        .fontSize(10)
        .text(`Fecha de elaboración: 05/11/2025`)

    doc.moveDown(2)

    doc.rect(84, doc.y-21, 456, 25)
        .lineWidth(0)
        .fill("#f2f2f2")
        .stroke();
        //doc.moveDown()
    
    doc.moveDown(-1)

    doc.fillColor("#047195")
        .font('Helvetica')
        .fontSize(12)
        .text (`NOMBRE Y FIRMA DE REVISOR Y AUTORIZADOR`, {align: 'center'});

    //columna 1
    doc.rect(84, doc.y+10, 200, 80)
        .lineWidth(1)
        .stroke();
    
    doc.rect(84, doc.y+90, 200, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(84, doc.y+108, 200, 18)
        .lineWidth(1)
        .stroke();
    
    //columna 2
    doc.rect(340, doc.y+10, 200, 80)
        .lineWidth(1)
        .stroke();
    
    doc.rect(340, doc.y+90, 200, 18)
        .lineWidth(1)
        .stroke();
    
    doc.rect(340, doc.y+108, 200, 18)
        .lineWidth(1)
        .stroke();

    //texto columna 1
    doc.x = 100
    doc.moveDown(7)
    doc.fillColor('#047195')
        .fontSize(8)
        .text(`${ltDire[1].cargo}`, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });

    doc.fillColor('#000000')
        .fontSize(8)
        .text(`
${ltDire[1].nombre}
            `, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });  

    
    //texto columna 2
    doc.x = 360
    doc.moveDown(-4)
    doc.fillColor('#047195')
        .fontSize(8)
        .text(`${ltDire[2].cargo}`, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });

    doc.fillColor('#000000')
        .fontSize(8)
        .text(`
${ltDire[2].nombre}
            `, {
                width: 160,      // Ancho de la columna
                align: 'center',
                columns: 1,      // ¡PDFKit lo hace automáticamente!
                columnGap: 15    // Espacio entre columnas
        });


    doc.x = 65
    doc.moveDown(3)
    table = {
    headers: [{label:"#", align: 'center', headerAlign: 'center' },
        {label:"Nombre del Programa", align: 'left', headerAlign: 'center' },
        {label:"Código del estudiante", align: 'center', headerAlign: 'center'},
        {label:"Nombre", align: 'left', headerAlign: 'center'},
        {label:"Ciclo a condonar", align: 'center', headerAlign: 'center'},
        {label:"Nivel del programa", align: 'center', headerAlign: 'center'},
        {label:"Arancel por concepto de Matrícula", align: 'right', headerAlign: 'center', renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => { return `$ ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } }
        ],
      rows: laDeta
    };

    await doc.table(table, {columnsSize: [ 20, 120, 60, 120, 40, 60, 70 ],
        //addPage: true, 
        onPageAdd: (doc) => {
        doc.y = 120;
        
    }
    });

    doc.end();
});

const progap_dashboardx = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query.lnDepe)
    
    lcSQL = `
    SELECT d.siglas as mes, SUM(if(a.id_estado = 3, 1, 0)) AS completa, SUM(if(a.id_estado = 4, 1, 0)) AS rechazada, 
            SUM(if(IFNULL(a.id_estado,0) <> 4 AND IFNULL(a.id_estado,0) <> 3, 1, 0)) AS pendiente 
        FROM progap_alumnos a LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id
        WHERE a.id_convocatoria = ${req.query.lnConvo} ${(req.query.lnDepe > 0?' and a.id_centro_universitario = ' + req.query.lnDepe:'')}
        group BY d.siglas
        ORDER BY d.siglas
    `
    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)

});

const progap_dashboardx2 = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT SUM(if(a.id_estado = 3 AND LEFT(p.nivel,1) = 'D', 1, 0)) AS dcompleta, 
            SUM(if(a.id_estado = 4 AND LEFT(p.nivel,1) = 'D', 1, 0)) AS drechazada, 
            SUM(if(IFNULL(a.id_estado,0) <> 4 AND IFNULL(a.id_estado,0) <> 3 AND IFNULL(LEFT(p.nivel,1),"M") = 'D', 1, 0)) AS dpendiente,
            SUM(if(a.id_estado = 3 AND LEFT(p.nivel,1) <> 'D', 1, 0)) AS mcompleta, 
            SUM(if(a.id_estado = 4 AND LEFT(p.nivel,1) <> 'D', 1, 0)) AS mrechazada, 
            SUM(if(IFNULL(a.id_estado,0) <> 4 AND IFNULL(a.id_estado,0) <> 3 AND IFNULL(LEFT(p.nivel,1),"M") <> 'D', 1, 0)) AS mpendiente  
	FROM progap_alumnos a LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id
		LEFT JOIN progap_programa p ON a.id_programa = p.id
        WHERE a.id_convocatoria = ${req.query.lnConvo} ${(req.query.lnDepe > 0?' and a.id_centro_universitario = ' + req.query.lnDepe:'')}
    `
    const rows = await util.gene_cons(lcSQL)
    const lnTotal = parseInt(rows[0].dcompleta) + parseInt(rows[0].drechazada) + parseInt(rows[0].dpendiente) + parseInt(rows[0].mcompleta) + parseInt(rows[0].mrechazada) + parseInt(rows[0].mpendiente)
    //console.log(lnTotal)
    const vertical = [
        { id: 1, mes: "D. Completos", valor: rows[0].dcompleta, porcen: ((rows[0].dcompleta*100)/lnTotal).toFixed(2) },
        { id: 2, mes: "D. Rechazados", valor: rows[0].drechazada, porcen: ((rows[0].drechazada*100)/lnTotal).toFixed(2) },
        { id: 3, mes: "D. Pendientes", valor: rows[0].dpendiente, porcen: ((rows[0].dpendiente*100)/lnTotal).toFixed(2) },
        { id: 4, mes: "M. Completos", valor: rows[0].mcompleta, porcen: ((rows[0].mcompleta*100)/lnTotal).toFixed(2) },
        { id: 5, mes: "M. Rechazados", valor: rows[0].mrechazada, porcen: ((rows[0].mrechazada*100)/lnTotal).toFixed(2) },
        { id: 6, mes: "M. Pendientes", valor: rows[0].mpendiente, porcen: ((rows[0].mpendiente*100)/lnTotal).toFixed(2) }
    ];

    return res.json(vertical)

});

const progap_dashboardx3 = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT d.siglas, SUM(if(ifnull(a.id_estado,1) = 1, 1, 0)) AS s1, SUM(if(ifnull(a.id_estado,1) = 2, 1, 0)) AS s2,
            SUM(if(ifnull(a.id_estado,1) = 3, 1, 0)) AS s3, SUM(if(ifnull(a.id_estado,1) = 4, 1, 0)) AS s4,
            SUM(if(ifnull(a.id_estado,5) = 2, 1, 0)) AS s5, COUNT(*) AS total
        FROM progap_alumnos a LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id 
        WHERE a.id_convocatoria = ${req.query.lnConvo} ${(req.query.lnDepe > 0?' and a.id_centro_universitario = ' + req.query.lnDepe:'')}
        group BY 1
        ORDER BY 1 DESC 
        LIMIT 10
    `
    const rows = await util.gene_cons(lcSQL)

    let loDatos = []
    for (i = 0; i < rows.length; i++){
        
        const lcDeta = [{id:i+'.1', value: rows[i].s1, tipo:1, label:'<br><br>SIN ENVIAR (' + rows[i].s1 + ')'},
        {id:i+'.2', value: rows[i].s2, tipo:2, label:'<br><br>ENVIADA A REVISION (' + rows[i].s2 + ')'},
        {id:i+'.3', value: rows[i].s3, tipo:3, label:'<br><br>SOLICITUD COMPLETA (' + rows[i].s3 + ')'},
        {id:i+'.4', value: rows[i].s4, tipo:4, label:'<br><br>RECHAZADA (' + rows[i].s4 + ')'},
        {id:i+'.5', value: rows[i].s99, tipo:99, label:'<br><br>ES NECESARIO CORREGIR (' + rows[i].s99 + ')'}
        ]

        const lcGrupo = 
            {id:i, label: rows[i].siglas + ' (' + rows[i].total + ')', value:rows[i].total, data:lcDeta}

        //console.log(lcGrupo)
        loDatos.push(lcGrupo)
    }

    //console.log(loDatos)

    return res.json(loDatos)

});

const progap_dashboardx4 = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    //console.log(req.query)
    
    lcSQL = `
    SELECT SUM(if(ifnull(LEFT(p.nivel,1),'M') = 'D', 1, 0)) AS dtotal, SUM(if(a.id_estado = 3 AND LEFT(p.nivel,1) = 'D', 1, 0)) AS dcompleta, 		
            SUM(if(IFNULL(a.id_estado,0) <> 3 AND IFNULL(LEFT(p.nivel,1),"M") = 'D', 1, 0)) AS dpendienter,
            SUM(if(IFNULL(a.id_estado,0) <> 3 and IFNULL(a.id_estado,0) <> 4 AND IFNULL(LEFT(p.nivel,1),"M") = 'D', 1, 0)) AS dpendiente,
            SUM(if(ifnull(LEFT(p.nivel,1),'M') <> 'D', 1, 0)) AS mtotal, SUM(if(a.id_estado = 3 AND LEFT(p.nivel,1) <> 'D', 1, 0)) AS mcompleta, 
            SUM(if(IFNULL(a.id_estado,0) <> 3 AND IFNULL(LEFT(p.nivel,1),"M") <> 'D', 1, 0)) AS mpendienter, 
            SUM(if(IFNULL(a.id_estado,0) <> 3 AND IFNULL(a.id_estado,0) <> 4 AND IFNULL(LEFT(p.nivel,1),"M") <> 'D', 1, 0)) AS mpendiente  
        FROM progap_alumnos a LEFT JOIN progap_dependencias d ON a.id_centro_universitario = d.id
            LEFT JOIN progap_programa p ON a.id_programa = p.id
        WHERE a.id_convocatoria = ${req.query.lnConvo} ${(req.query.lnDepe > 0?' and a.id_centro_universitario = ' + req.query.lnDepe:'')}
    `
    const rows = await util.gene_cons(lcSQL)

    return res.json(rows)

});

const progap_prograx = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT p.id, p.clave_cgipv, d.siglas,  p.nivel, p.programa, p.clave_911, p.duracion, if(p.participa = 1, "SI", "NO") AS participa
        FROM progap_programa p LEFT JOIN progap_dependencias d ON p.id_cu = d.id
        ORDER BY p.nivel, p.programa, d.siglas	
    `

    const rows = await util.gene_cons(lcSQL)
    return res.json(rows)
});

const progap_impo_progx = ( async (req, res) => {
    
    //console.log(req.file)
    
    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(laExtencion != 'XLS' && laExtencion != 'XLSX'){
        res.json({"status" : "error", "message": "El archivo no es un formato compatible", "data":{}})
    }

    const loExcel = await other_utils.leer_excel(req.file.path); 

    if (loExcel.status === "error"){
        return res.json(loExcel);
    }

    //console.log(loExcel)
    let lcSQL = `
    SELECT p.clave_cgipv, d.siglas, p.nivel, p.programa, p.clave_911, IFNULL(p.duracion, '') as duracion, p.id, p.id_cu,
            0 as cambio, '' as camp_dife 
        FROM progap_programa p LEFT JOIN progap_dependencias d ON p.id_cu = d.id
        ORDER BY p.clave_cgipv
`

    const datosBD = await util.gene_cons(lcSQL)

    // Creamos el mapa usando el ID como llave para búsqueda rápida
    const mapaBD = new Map();
    datosBD.forEach(reg => {
        mapaBD.set(reg.clave_cgipv.toString(), reg);
    });

lcSQL = `
    SELECT id, siglas, dependencia 
        FROM progap_dependencias 
        WHERE id_antecesor = 0 
`

    const depenBD = await util.gene_cons(lcSQL)

    // Creamos el mapa usando el ID como llave para búsqueda rápida
    const mdepeBD = new Map();
    depenBD.forEach(reg => {
        mdepeBD.set(reg.siglas.toString(), reg);
    });
    

    datosExcel = loExcel.datos;
    let lcUPDATE = "", lcORIGIN = "", laActualiza = []

    datosExcel.forEach(fila => {
        //console.log(fila)
        //console.log(Object.values(fila)[0].toString());
        const idExcel = Object.values(fila)[0].toString(); // Ajusta al nombre de tu columna en Excel
        //const estatusExcel = fila["ESTATUS"];  // Ajusta al nombre de tu columna en Excel

        // Si el ID existe en la BD
        lcUPDATE = ""
        lcORIGIN = ""
        lnIDDepen = ''
        if (mapaBD.has(idExcel)) {
            const estatusActual = mapaBD.get(idExcel);
            //console.log(fila)
            //console.log(estatusActual)
            for (i = 0; i < 6; i++){
                if (Object.values(estatusActual)[i] != Object.values(fila)[i]){
                    lcUPDATE = lcUPDATE + (lcUPDATE != ''? ', ': '') + Object.keys(estatusActual)[i] + "= '" + (!Object.values(fila)[i]?'':Object.values(fila)[i]) + "'"
                    lcORIGIN = lcORIGIN + (lcORIGIN != ''? ', ': '') + Object.keys(estatusActual)[i] + "= '" + (!Object.values(estatusActual)[i]?'':Object.values(estatusActual)[i]) + "'"
                }
            }
            if (lcUPDATE != ''){
                if (mdepeBD.has(Object.values(fila)[1])) {
                    lnIDDepen = mdepeBD.get(Object.values(fila)[1]).id
                }
            }

            laActualiza.push({ marcar: (lcUPDATE!=''?1:0), id: Object.values(estatusActual)[6], clave_cgipv: Object.values(fila)[0], siglas: Object.values(fila)[1], 
                nivel: Object.values(fila)[2], programa: Object.values(fila)[3], clave_911: Object.values(fila)[4], 
                duracion: Object.values(fila)[5], actual: lcORIGIN, update: lcUPDATE, id_cu : lnIDDepen})

            // Solo agregamos si el estatus es diferente
            /* if (estatusActual !== estatusExcel) {
                paraActualizar.push({ id: idExcel, nuevoEstatus: estatusExcel });
            } */
        }
        else 
        {
            if (mdepeBD.has(Object.values(fila)[1])) {
                lnIDDepen = mdepeBD.get(Object.values(fila)[1]).id
            }
            
            laActualiza.push({marcar: 1, id: Object.values(fila)[0], clave_cgipv: Object.values(fila)[0], siglas: Object.values(fila)[1], 
                    nivel: Object.values(fila)[2], programa: Object.values(fila)[3], clave_911: Object.values(fila)[4], 
                    duracion: Object.values(fila)[5], actual: '', update: 'NUEVO', id_cu : lnIDDepen})
        }
    });

    return res.json(laActualiza)

});


const progap_actu_progx = ( async (req, res) => {
    
    //console.log(req.file)
    
    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(laExtencion != 'XLS' && laExtencion != 'XLSX'){
        res.json({"status" : "error", "message": "El archivo no es un formato compatible", "data":{}})
    }

    const loExcel = await other_utils.leer_excel(req.file.path); 

    if (loExcel.status === "error"){
        return res.json(loExcel);
    }
    
    let lcSQL = `
    SELECT p.clave_cgipv, d.siglas, p.nivel, p.programa, p.clave_911, IFNULL(p.duracion, '') as duracion, p.id, p.id_cu,
            0 as cambio, '' as camp_dife, IF(ifnull(participa, 0) = 1, "SI", "NO") as participa 
        FROM progap_programa p LEFT JOIN progap_dependencias d ON p.id_cu = d.id
        ORDER BY p.clave_cgipv
`

    const datosBD = await util.gene_cons(lcSQL)

    //console.log(datosBD)

    // Creamos el mapa usando el ID como llave para búsqueda rápida
    const mapaBD = new Map();
    loExcel.datos.forEach(reg => {
        mapaBD.set(Object.values(reg)[0].toString(), reg);
    });

    let lcUPDATE = "", lcORIGIN = "", laActualiza = []

    //console.log(req.sessionID);
    datosBD.forEach(fila => {
        
        //console.log(fila)
        //console.log(Object.values(fila)[0].toString());
        const idExcel = Object.values(fila)[0].toString(); // Ajusta al nombre de tu columna en Excel
        //const estatusExcel = fila["ESTATUS"];  // Ajusta al nombre de tu columna en Excel

        // Si el ID existe en la BD
        lcUPDATE = ""
        lcORIGIN = ""

        if (mapaBD.has(idExcel)) {
            const estatusActual = mapaBD.get(idExcel);
            lcUPDATE = "SI"
        }
        else 
        {
            lcUPDATE = "NO"
        }
        laActualiza.push({ marcar: (fila.participa == lcUPDATE?0:1), id: fila.id, clave_cgipv: fila.clave_cgipv, 
            siglas: fila.siglas, nivel: fila.nivel, programa: fila.programa, clave_911: fila.clave_911, 
            duracion: fila.duracion, actual: fila.participa, update: lcUPDATE, id_cu : fila.id_cu})

    });

    return res.json(laActualiza)

});

const progap_actu_progx2 = (async (req, res) => {

    //console.log(req.body)
    let lcSQL = '', rows = [], lnCambios = 0
    for(i = 0; i < req.body.length; i++){
        lcSQL = `UPDATE progap_programa SET participa = ${(req.body[i].update=='SI'?1:0)} WHERE id = ${req.body[i].id} AND ifnull(participa,0) = ${(req.body[i].update=='SI'?0:1)}`
        rows = await util.gene_cons(lcSQL)
        
        lnCambios = lnCambios + Number(rows.affectedRows)
        //console.log(rows)
    }
    //console.log(lnCambios)

    return res.json({"error":false, "mensage":"Se aplicaron " + lnCambios + " cambios exitosamente"})
});

const progap_impo_progx2 = (async (req, res) => {

    //console.log(req.body)
    let lcSQL = '', rows = [], lnCambios = 0
    for(i = 0; i < req.body.length; i++){
        if(req.body[i].update == "NUEVO"){
            lcSQL = `INSERT INTO progap_programa (clave_cgipv, id_cu, nivel, programa, clave_911, duracion, participa)
	                    VALUES ('${req.body[i].clave_cgipv}', '${req.body[i].id_cu}', '${req.body[i].nivel}', 
                            '${req.body[i].programa}', '${req.body[i].clave_911}', '${req.body[i].duracion}', 1)
            `
        }
        else{
            lcSQL = `UPDATE progap_programa SET ${req.body[i].update} WHERE id = ${req.body[i].id} `
        }
        
        //console.log(lcSQL)
        rows = await util.gene_cons(lcSQL)
        lnCambios = lnCambios + Number(rows.affectedRows)
        //console.log(rows)
    }
    //console.log(lnCambios)

    return res.json({"error":false, "mensage":"Se aplicaron " + lnCambios + " cambios exitosamente"})
});

const progap_nestudiax = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = ''
    if(req.body.id > 0){                        //si es modificación
        
        lcSQL = `
            SELECT * 
                FROM progap_alumnos
                WHERE id = ${req.body.id}
        `
        modifica = await util.gene_cons(lcSQL)

        //console.log(req.body.id)
        //console.log(modifica)

        if (modifica.length <= 0){
            return res.json({"status" : "error", "message": "No se econtro al alumno a modificar"})
        }

        lcSQL = `
            SELECT * 
                FROM progap_alumnos
                WHERE codigo = '${req.body.codigo}' AND id != ${req.body.id} AND id_convocatoria = ${modifica[0].id_convocatoria}
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "El usuario ya existe"})
        }


        /* lcSQL = `UPDATE progap_usuarios SET usuario = '${req.body.codigo}', 
            contrasena = '${req.body.contrasena}', 
            nombre = '${req.body.nombre}', 
            apellido_paterno = '${req.body.apellido_paterno}', 
            apellido_materno =  '${req.body.apellido_materno}', 
            id_centro_universitario = ${req.body.centro}, 
            correo = '${req.body.correo_institucional}' 
        WHERE id = ${req.body.id}
        ` */
        lcSQL = `UPDATE progap_alumnos SET codigo = '${req.body.codigo}', 
            nombre = '${req.body.nombre}', 
            apellido_paterno = '${req.body.apellido_paterno}', 
            apellido_materno = '${req.body.apellido_materno}', 
            curp = '${req.body.curp}', 
            id_centro_universitario = ${req.body.centro}, 
            id_programa = ${req.body.programa}, 
            correo_institucional = '${req.body.correo_institucional}', 
            id_ciclo_ingreso = ${req.body.id_ciclo_ingreso}, 
            id_ciclo_curso = ${req.body.id_ciclo_curso}, 
            id_ciclo_condonar = ${req.body.id_ciclo_condonar} 
        WHERE id = ${req.body.id}
        `

        modifico = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El estudiante se modificó exitosamente"})
        
    }
    else                                           //si es usuario nuevo
    {
        lcSQL = `
            SELECT * 
                FROM progap_usuarios
                WHERE USUARIO = '${req.body.codigo}'
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "El usuario ya existe"})
        }

        lcSQL = `
        INSERT INTO progap_usuarios (usuario, contrasena, md5HASH, nombre, apellido_paterno, apellido_materno, id_centro_universitario, correo,
            id_tipo_usuario, estado, id_convocatoria) 
        VALUES ('${req.body.codigo}', '${req.body.contrasena}', UUID(), '${req.body.nombre}', '${req.body.apellido_paterno}', 
            '${req.body.apellido_materno}', ${req.body.centro}, '${req.body.correo_institucional}', 5, ${req.body.id_estado},
            (SELECT id FROM progap_convocatoria WHERE id_status = 1 order BY id desc LIMIT 1)
            );

        INSERT INTO progap_alumnos (id_usuario, codigo, nombre, apellido_paterno, apellido_materno, curp, id_centro_universitario, id_programa,
            correo_institucional, id_ciclo_ingreso, id_ciclo_curso, id_ciclo_condonar, id_estado, id_convocatoria) 
        VALUES (LAST_INSERT_ID(), '${req.body.codigo}', '${req.body.nombre}', '${req.body.apellido_paterno}', '${req.body.apellido_materno}', '${req.body.curp}', 
                ${req.body.centro}, ${req.body.programa}, '${req.body.correo_institucional}', ${req.body.id_ciclo_ingreso}, ${req.body.id_ciclo_curso}, 
                ${req.body.id_ciclo_condonar}, ${req.body.id_estado},
                (SELECT id FROM progap_convocatoria WHERE id_status = 1 order BY id desc LIMIT 1)
                )
    `
        //console.log(lcSQL)
        rows = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El usuario se creo exitosamente"})
    }
});

const progap_ndirectivox = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = ''
    if(req.body.id > 0){                        //si es modificación
        
        lcSQL = `
            SELECT * 
                FROM progap_altos_mandos
                WHERE id = ${req.body.id}
        `
        modifica = await util.gene_cons(lcSQL)

        //console.log(req.body.id)
        //console.log(modifica)

        if (modifica.length <= 0){
            return res.json({"status" : "error", "message": "No se econtro al directivo a modificar"})
        }

        lcSQL = `UPDATE progap_altos_mandos SET nombres = '${req.body.nombres}', 
            genero = '${req.body.genero}', 
            correo = '${req.body.correo}', 
            telefono = '${req.body.telefono}', 
            celular = '${req.body.celular}', 
            cargo = '${req.body.cargo}', 
            id_cu = ${req.body.id_cu}, 
            id_grado = ${req.body.id_grado}
        WHERE id = ${req.body.id}
        `
        //console.log(lcSQL)
        modifico = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El directivo se modificó exitosamente"})
        
    }
    else                                           //si es usuario nuevo
    {

        lcSQL = `
        INSERT INTO progap_altos_mandos (nombres, genero, correo, telefono, celular, cargo, id_cu, id_grado) 
        VALUES ('${req.body.nombres}', '${req.body.genero}', '${req.body.correo}', '${req.body.telefono}', 
            '${req.body.celular}', '${req.body.cargo}', ${req.body.id_cu}, ${req.body.id_grado})

    `
        //console.log(lcSQL)
        rows = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El directivo se creo exitosamente"})
    }
});

const progap_nusuariox = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = ''
    if(req.body.id > 0){                        //si es modificación
        
        lcSQL = `
            SELECT * 
                FROM progap_usuarios
                WHERE id = ${req.body.id}
        `
        modifica = await util.gene_cons(lcSQL)

        //console.log(req.body.id)
        //console.log(modifica)

        if (modifica.length <= 0){
            return res.json({"status" : "error", "message": "No se econtro al usuario a modificar"})
        }

        lcSQL = `
            SELECT * 
                FROM progap_usuarios
                WHERE usuario = '${req.body.usuario}' AND id != ${req.body.id} 
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "El usuario ya existe"})
        }

        lcSQL = `UPDATE progap_usuarios SET usuario = '${req.body.usuario}', 
            contrasena = '${req.body.contrasena}', 
            nombre = '${req.body.nombre}', 
            apellido_paterno = '${req.body.apellido_paterno}', 
            apellido_materno = '${req.body.apellido_materno}', 
            genero = ${req.body.genero}, 
            id_nivel_estudios = ${req.body.id_nivel_estudios}, 
            id_centro_universitario = ${req.body.id_centro_universitario}, 
            telefonos = '${req.body.telefonos}', 
            extension = '${req.body.extension}', 
            celular = '${req.body.celular}', 
            correo = '${req.body.correo}', 
            id_tipo_usuario = ${req.body.id_tipo_usuario}, 
            estado = ${req.body.estado}, 
            id_convocatoria = ${req.body.id_convocatoria}
        WHERE id = ${req.body.id}            
        `

        console.log(lcSQL)

        modifico = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El usuario se modificó exitosamente"})
        
    }
    else                                           //si es usuario nuevo
    {
        lcSQL = `
            SELECT * 
                FROM progap_usuarios
                WHERE USUARIO = '${req.body.codigo}'
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "El usuario ya existe"})
        }

        lcSQL = `
        INSERT INTO progap_usuarios (usuario, contrasena, md5HASH, nombre, apellido_paterno, apellido_materno, id_centro_universitario, correo,
            id_tipo_usuario, estado, id_convocatoria, genero, id_nivel_estudios, telefonos, extension, celular) 
        VALUES ('${req.body.usuario}', '${req.body.contrasena}', UUID(), '${req.body.nombre}', '${req.body.apellido_paterno}', 
            '${req.body.apellido_materno}', ${req.body.id_centro_universitario}, '${req.body.correo}', 5, ${req.body.estado},
            (SELECT id FROM progap_convocatoria WHERE id_status = 1 order BY id desc LIMIT 1), ${req.body.genero}, ${req.body.id_nivel_estudios},
            '${req.body.telefonos}', '${req.body.extension}', '${req.body.celular}');
    `
        console.log(lcSQL)
        rows = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El usuario se creo exitosamente"})
    }
});

const progap_nprograx = (async (req, res) => {

    if (req.groups.indexOf(",ADMI_PROGAP,") <= 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = ''
    if(req.body.id > 0){                        //si es modificación
        
        lcSQL = `
            SELECT * 
                FROM progap_programa
                WHERE id = ${req.body.id}
        `
        modifica = await util.gene_cons(lcSQL)

        //console.log(req.body.id)
        //console.log(modifica)

        if (modifica.length <= 0){
            return res.json({"status" : "error", "message": "No se econtro el programa a modificar"})
        }

        lcSQL = `
            SELECT * 
                FROM progap_programa
                WHERE id <> ${req.body.id} and (clave_cgipv = '${req.body.clave_cgipv}' or clave_911 = '${req.body.clave_911}')
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "La clave CGIPV o clave 911 ya existen"})
        }

        lcSQL = `UPDATE progap_programa SET clave_cgipv = '${req.body.clave_cgipv}', 
            id_cu = ${req.body.id_cu}, 
            nivel = '${req.body.nivel}', 
            programa = '${req.body.programa}', 
            clave_911 = '${req.body.clave_911}', 
            duracion = ${req.body.duracion}, 
            participa = ${req.body.participa}
        WHERE id = ${req.body.id}
        `
        console.log(lcSQL)
        modifico = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El programa se modificó exitosamente"})
        
    }
    else                                           //si es usuario nuevo
    {

        lcSQL = `
            SELECT * 
                FROM progap_programa
                WHERE clave_cgipv = '${req.body.clave_cgipv}' or clave_911 = '${req.body.clave_911}'
        `

        activo = await util.gene_cons(lcSQL)

        if (activo.length > 0){
            return res.json({"status" : "error", "message": "La clave CGIPV o clave 911 ya existen"})
        }

        lcSQL = `
        INSERT INTO progap_programa (clave_cgipv, id_cu, nivel, programa, clave_911, duracion, participa) 
        VALUES ('${req.body.clave_cgipv}', ${req.body.id_cu}, '${req.body.nivel}', '${req.body.programa}', 
            '${req.body.clave_911}', ${req.body.duracion}, ${req.body.participa})

    `
        //console.log(lcSQL)
        rows = await util.gene_cons(lcSQL)

        return res.json({"status" : "server", "message": "El programa se creo exitosamente"})
    }
});

const progap_nfocamx = (async (req, res) => {

    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    let idExtraido = '', lcSQL = ''

    if(laExtencion != 'PDF'){
        return res.json({"status" : false, "message": "Sólo se permiten archivos con extención PDF", "data":{}})
    }

    laComando = path.join(__dirname, "../apipython", "leeQR2.py") 
    laArgs  = path.join(__dirname, "../uploads/", req.file.filename)

    console.log(laComando)
    console.log(laArgs)


    try {
        // 5. ESPERAR a que la Promesa de Python se resuelva
        const resultadoPython = await other_utils.ejecutarPython(laComando, laArgs);
        
        console.log(resultadoPython)
        
        if (resultadoPython.substring(0,13) == "Contenido QR:"){
            idExtraido = resultadoPython.split('/').pop();
            console.log(idExtraido); 
            
            lcSQL = `
            SELECT * 
                FROM progap_tram_focam 
                WHERE uid = ?
            `
            rows = await util.gene_cons(lcSQL, [idExtraido])

            console.log(rows); 
            
            if (rows.length <= 0){
                return res.json({"status" : false, "message": "El QR no se econtro en la base de datos", "data":{}})
            }

            if (rows[0].id != req.body.idFocam){
                return res.json({"status" : false, "message": "El QR no pertenece a este estudiante", "data":{}})
            }
        }
        else{
            return res.json({"status" : false, "message": "No se econtro QR o no fue generado por el sistema", "data":{}})
        }

    } catch (error) {
        console.error("Error al procesar el archivo:", error);
        res.status(500).json({ 
            status: "error", 
            message: "Fallo al procesar el archivo con Python.",
            detalle: error.message
        });
    }

    //inserta el registro para guardar el archivo de la oficialía
    lcSQL = `
    INSERT INTO progap_archivo (id_orig, descrip, fecha, usuario, uid) 
        VALUES (?, ?, now(), ?, ?)
    `

    const laInsert = await util.gene_cons(lcSQL, [req.body.idFocam, req.file.originalname, req.userId, util.gene_id_11()])
    //console.log(laInsert)

    
    const lfOriginal  = path.join(__dirname, "../uploads/", req.file.filename)
    //const lfDestino = config.SERV_ARCH  + 'OPARCHIVO\\' + laInsert.insertId + '.' + laExtencion 
    const lfDestino = path.join(config.SERV_ARCH, 'PROGAB', laInsert.insertId + '.' + laExtencion);

    //console.log(lfOriginal)
    //console.log(lfDestino)


    try {
        //await fs.copyFile(lfOriginal, lfDestino);
        await fs.promises.copyFile(lfOriginal, lfDestino);
        if (!fs.existsSync(lfDestino)) {
            
            lcSQL = `
    DELETE FROM progap_archivo WHERE id_arch = ?
    `
            const laDelete = await util.gene_cons(lcSQL, [laInsert.insertId])
            return res.json({"status" : false, "message": "Error al guardar el archivo"});
        }
        //console.log('¡Archivo copiado con éxito!');
    } catch (err) {
        //console.log(err);
        lcSQL = `
    DELETE FROM progap_archivo WHERE id_arch = ?
    `
        const laDelete = await util.gene_cons(lcSQL, [laInsert.insertId])
        return res.json({"status" : false, "message": "Error al guardar el archivo"});
    }

    return res.json({"status" : "server", "message": "El archivo se cargo correctamente"});

});

const progap_recu_arch = (async (req, res) => {

    //console.log(req.query.out)
    lcSQL = `
    SELECT UID AS id, DESCRIP as nombre
        FROM progap_archivo 
        WHERE id_orig = ?
        ORDER BY fecha DESC

    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.lnTram])

    return res.json(rows)

});

const pdownload = (async (req, res) => {

    let lcSQL = ''
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0){
        return res.render("sin_derecho")
    }
        
    lcSQL = `
    SELECT *
        FROM progap_archivo 
        WHERE UID = ?
    `
    //console.log(lcSQL)
    const rows = await util.gene_cons(lcSQL, [req.query.id])

    if (!rows || rows.length <= 0){
        return res.send("No se econtro el archivo en la base de datos")
    }


    //const ruta_fisica = config.SERV_ARCH + 'OPARCHIVO/' + rows[0].ID_ARCH + path.extname(rows[0].DESCRIP);
    const nombreArchivo = rows[0].ID_ARCH + path.extname(rows[0].DESCRIP).toUpperCase();
    const ruta_fisica = path.join(config.SERV_ARCH, 'PROGAP', nombreArchivo);
    
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

const progap_actu_estux = ( async (req, res) => {
    
    //console.log(req.file)
    
    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(laExtencion != 'XLS' && laExtencion != 'XLSX'){
        res.json({"status" : "error", "message": "El archivo no es un formato compatible", "data":{}})
    }

    const loExcel = await other_utils.leer_excel(req.file.path); 

    if (loExcel.status === "error"){
        return res.json(loExcel);
    }

    let lcSQL = `
    SELECT a.codigo, CONCAT(a.nombre, ' ', a.apellido_paterno, ' ', a.nombre) AS nombre, a.curp, a.correo_institucional,
            d.siglas, p.clav_siia, p.programa, p.oferta, v.id_ciclo_ingreso, v.id_ciclo_curso, v.estatus, v.sus_desde, v.sus_hasta,
            v.cred_obte, v.cred_carr, v.avance, p.clave_911
        FROM progap_alumno a LEFT JOIN progap_alum_conv v ON a.codigo = v.codigo
            LEFT JOIN progap_dependencias d ON v.id_centro_universitario = d.id
            LEFT JOIN progap_programa p ON v.id_programa = p.id
`
    const datosBD = await util.gene_cons(lcSQL)

    // Creamos el mapa usando el ID como llave para búsqueda rápida
    const mapaBD = new Map();
    datosBD.forEach(reg => {
        mapaBD.set(reg.codigo.toString(), reg);
    });

lcSQL = `
    SELECT id, siglas, dependencia 
        FROM progap_dependencias 
        WHERE id_antecesor = 0 
`

    const depenBD = await util.gene_cons(lcSQL)

    // Creamos el mapa usando el ID como llave para búsqueda rápida
    const mdepeBD = new Map();
    depenBD.forEach(reg => {
        mdepeBD.set(reg.siglas.toString(), reg);
    });
    

    datosExcel = loExcel.datos;
    let lcUPDATE = "", lcORIGIN = "", laActualiza = []

    datosExcel.forEach(fila => {
        //console.log(fila)
        //console.log(Object.values(fila)[0].toString());
        const idExcel = Object.values(fila)[0].toString(); // Ajusta al nombre de tu columna en Excel
        //const estatusExcel = fila["ESTATUS"];  // Ajusta al nombre de tu columna en Excel

        // Si el ID existe en la BD
        lcUPDATE = ""
        lcORIGIN = ""
        lnIDDepen = ''
        if (mapaBD.has(idExcel)) {
            const estatusActual = mapaBD.get(idExcel);
            //console.log(fila)
            //console.log(estatusActual)
            for (i = 0; i < 6; i++){
                if (Object.values(estatusActual)[i] != Object.values(fila)[i]){
                    lcUPDATE = lcUPDATE + (lcUPDATE != ''? ', ': '') + Object.keys(estatusActual)[i] + "= '" + (!Object.values(fila)[i]?'':Object.values(fila)[i]) + "'"
                    lcORIGIN = lcORIGIN + (lcORIGIN != ''? ', ': '') + Object.keys(estatusActual)[i] + "= '" + (!Object.values(estatusActual)[i]?'':Object.values(estatusActual)[i]) + "'"
                }
            }
            if (lcUPDATE != ''){
                if (mdepeBD.has(Object.values(fila)[1])) {
                    lnIDDepen = mdepeBD.get(Object.values(fila)[1]).id
                }
            }

            laActualiza.push({ marcar: (lcUPDATE!=''?1:0), id: Object.values(estatusActual)[6], clave_cgipv: Object.values(fila)[0], siglas: Object.values(fila)[1], 
                nivel: Object.values(fila)[2], programa: Object.values(fila)[3], clave_911: Object.values(fila)[4], 
                duracion: Object.values(fila)[5], actual: lcORIGIN, update: lcUPDATE, id_cu : lnIDDepen})

            // Solo agregamos si el estatus es diferente
            /* if (estatusActual !== estatusExcel) {
                paraActualizar.push({ id: idExcel, nuevoEstatus: estatusExcel });
            } */
        }
        else 
        {
            if (mdepeBD.has(Object.values(fila)[1])) {
                lnIDDepen = mdepeBD.get(Object.values(fila)[1]).id
            }
            
            laActualiza.push({marcar: 1, id: Object.values(fila)[0], clave_cgipv: Object.values(fila)[0], siglas: Object.values(fila)[1], 
                    nivel: Object.values(fila)[2], programa: Object.values(fila)[3], clave_911: Object.values(fila)[4], 
                    duracion: Object.values(fila)[5], actual: '', update: 'NUEVO', id_cu : lnIDDepen})
        }
    });

    return res.json(laActualiza)

});

module.exports = {
    progap_usuariox,
    progap_directivox,
    progap_estudiax,
    progap_convocax,
    progap_exacamx,
    progap_focamx,
    progap_form01,
    progap_form02,
    progap_dashboardx,
    progap_dashboardx2,
    progap_dashboardx3,
    progap_dashboardx4,
    progap_prograx,
    progap_impo_progx,
    progap_actu_progx,
    progap_actu_progx2,
    progap_impo_progx2,
    progap_nestudiax,
    progap_ndirectivox,
    progap_nusuariox,
    progap_nprograx,
    progap_nfocamx,
    progap_recu_arch,
    pdownload,
    progap_actu_estux,

}