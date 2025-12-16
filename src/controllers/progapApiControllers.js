const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));

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


module.exports = {
    progap_usuariox,
    progap_directivox,
    progap_estudiax,
    progap_convocax,
    progap_exacamx
}