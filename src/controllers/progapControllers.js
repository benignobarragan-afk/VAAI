const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));


const progap = ((req, res) => {

    const lcDerecho = req.groups;
    console.log(lcDerecho.indexOf(",PROGAP,"))
    if (lcDerecho.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("PROGAP/progap", {lcDerecho})
});

const progap_dashboard = (async (req, res) => {
    
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
        SELECT id AS id, anio AS anio  
            FROM PROGAP_CONVOCATORIA
            ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL);

    lcSQL = `
        SELECT id, siglas, dependencia 
            FROM progap_dependencias 
            WHERE id IN (SELECT DISTINCT id_cu FROM progap_programa)
            ORDER BY siglas
    `
    const rows2 = await util.gene_cons(lcSQL);

    return res.render("progap/progap_dashboard", {rows, rows2})
});

const progap_cata = ((req, res) => {

    const lcDerecho = req.groups;

    if (lcDerecho.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("PROGAP/progap_cata", {lcDerecho})
});

const progap_usuario = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_usuario", {rows})
});

const progap_directivo = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT cargo AS id, cargo AS nombre 
        FROM  progap_altos_mandos
        GROUP BY cargo
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_directivo", {rows})
});

const progap_estudia = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_estudia", {rows})
});

const progap_convoca = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    return res.render("progap/progap_convoca")
});

const progap_exacam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_exacam", {rows})
});

const progap_focam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("progap/progap_focam", {rows})
});

const progap_progra = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("progap/progap_progra")
});

const progap_impo_prog = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("progap/progap_impo_prog")
});

const progap_convo = ((req, res) => {

    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("progap/progap_convo")

});

const progap_actu_prog = ((req, res) => {

    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    return res.render("progap/progap_actu_prog")

});

const progap_nestudia = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let lcSQL = `
    SELECT * 
        FROM progap_ciclos 
        ORDER BY nombre desc
    `

    const rows = await util.gene_cons(lcSQL)
    let usuario = [], depe_id = '', depe_value = '', prog_id = '', prog_value = ''

    if (req.query.lnID > 0){
    lcSQL = `
        SELECT a.id, a.codigo, u.contrasena, a.nombre, a.apellido_paterno, a.apellido_materno, a.curp, u.id_centro_universitario AS centro, 
                a.id_programa AS programa, a.correo_institucional, a.id_ciclo_ingreso, a.id_ciclo_curso, a.id_ciclo_condonar, 
                if(a.id_estado > 2, 1, 0) as id_estado 
            FROM progap_alumnos a LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
            WHERE a.id = ${req.query.lnID}

        `
        usuario = await util.gene_cons(lcSQL)

        //console.log(usuario)
        if(!!usuario[0].centro){                //verifica que exista la dependencia
            lcSQL = `
            SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
                FROM progap_dependencias
                WHERE id = ${usuario[0].centro}
            `
            depen = await util.gene_cons(lcSQL)

            //console.log(depen)

            depe_id = depen[0].id
            depe_value = depen[0].value
        }

        if(!!usuario[0].programa){              //verifica que exista el programa
            lcSQL = `
            SELECT  id, clave_cgipv, programa, concat('(',clave_cgipv ,') ', programa) as value 
                FROM progap_programa
                WHERE id = ${usuario[0].programa}
            `
            program = await util.gene_cons(lcSQL)

            prog_id = program[0].id
            prog_value = program[0].value
            //console.log(program)
        }
    }
    

    return res.render("progap/progap_nestudia", {rows, usuario, depe_id, depe_value, prog_id, prog_value})
});

const progap_ndirectivo = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let directivo = [], depe_id = '', depe_value = ''

    if (req.query.lnID > 0){
        lcSQL = `
        SELECT id, id_cu, nombres, id_grado, genero, correo, telefono, celular, cargo 
            FROM progap_altos_mandos
            WHERE id = ${req.query.lnID}

            `
        directivo = await util.gene_cons(lcSQL)

        console.log(directivo)

        if(!!directivo[0].id_cu){                //verifica que exista la dependencia
            lcSQL = `
            SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
                FROM progap_dependencias
                WHERE id = ${directivo[0].id_cu}
            `
            depen = await util.gene_cons(lcSQL)

            //console.log(depen)
            if (depen.length > 0){
                depe_id = depen[0].id
                depe_value = depen[0].value
            }
        }

    }
    

    return res.render("progap/progap_ndirectivo", {directivo, depe_id, depe_value})
});

const progap_nusuario = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    let lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    let usuario = [], depe_id = '', depe_value = ''

    if (req.query.lnID > 0){
    lcSQL = `
        SELECT id, usuario, contrasena, nombre, apellido_paterno, apellido_materno, genero, id_nivel_estudios,
                id_centro_universitario, telefonos, extension, celular, correo, id_tipo_usuario, estado, id_convocatoria
            FROM progap_usuarios
            WHERE id = ${req.query.lnID}

        `
        usuario = await util.gene_cons(lcSQL)

        console.log(usuario)
        if(!!usuario[0].id_centro_universitario){                //verifica que exista la dependencia
            lcSQL = `
            SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
                FROM progap_dependencias
                WHERE id = ${usuario[0].id_centro_universitario}
            `
            depen = await util.gene_cons(lcSQL)

            //console.log(depen)

            depe_id = depen[0].id
            depe_value = depen[0].value
        }
    }
    

    return res.render("progap/progap_nusuario", {rows, usuario, depe_id, depe_value})
});


const progap_nprogra = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let programa = [], depe_id = '', depe_value = ''

    if (req.query.lnID > 0){
        lcSQL = `
        SELECT id, clave_cgipv, id_cu, nivel, programa, clave_911, duracion, participa 
        	FROM progap_programa
            WHERE id = ${req.query.lnID}

            `
        programa = await util.gene_cons(lcSQL)

        console.log(req.query.lnID)
        console.log(programa)

        if(!!programa[0].id_cu){                //verifica que exista la dependencia
            lcSQL = `
            SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
                FROM progap_dependencias
                WHERE id = ${programa[0].id_cu}
            `
            depen = await util.gene_cons(lcSQL)

            //console.log(depen)
            if (depen.length > 0){
                depe_id = depen[0].id
                depe_value = depen[0].value
            }
        }

    }
    

    return res.render("progap/progap_nprogra", {programa, depe_id, depe_value})
});

const progap_dexacam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let exacam = []

    if (req.query.lnID > 0){
        lcSQL = `
    SELECT e.numero_oficio, e.id_cu, d.dependencia, e.id_convocatoria, d.id_responsable 
	    FROM progap_exacam e LEFT JOIN progap_dependencias d ON e.id_cu = d.id
	    WHERE e.id = ${req.query.lnID}
    `
        exacam = await util.gene_cons(lcSQL)

        console.log(req.query.lnID)
        console.log(exacam)

    }
    
    return res.render("progap/progap_dexacam", {exacam})
});

const progap_nfocam = (async (req, res) => {
    
    if (req.groups.indexOf(",ADMI_PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }
    
    let lcSQL = `
    SELECT * 
        FROM progap_ciclos 
        ORDER BY nombre desc
    `

    const rows = await util.gene_cons(lcSQL)
    let usuario = [], depe_id = '', depe_value = '', prog_id = '', prog_value = ''

    if (req.query.lnID > 0){
    lcSQL = `
        SELECT a.id, a.codigo, u.contrasena, a.nombre, a.apellido_paterno, a.apellido_materno, a.curp, u.id_centro_universitario AS centro, 
                a.id_programa AS programa, a.correo_institucional, a.id_ciclo_ingreso, a.id_ciclo_curso, a.id_ciclo_condonar, 
                if(a.id_estado > 2, 1, 0) as id_estado 
            FROM progap_alumnos a LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
            WHERE a.id = ${req.query.lnID}

        `
        usuario = await util.gene_cons(lcSQL)

        //console.log(usuario)
        if(!!usuario[0].centro){                //verifica que exista la dependencia
            lcSQL = `
            SELECT  id, siglas, dependencia, concat('(',siglas ,') ',  dependencia) as value 
                FROM progap_dependencias
                WHERE id = ${usuario[0].centro}
            `
            depen = await util.gene_cons(lcSQL)

            //console.log(depen)

            depe_id = depen[0].id
            depe_value = depen[0].value
        }

        if(!!usuario[0].programa){              //verifica que exista el programa
            lcSQL = `
            SELECT  id, clave_cgipv, programa, concat('(',clave_cgipv ,') ', programa) as value 
                FROM progap_programa
                WHERE id = ${usuario[0].programa}
            `
            program = await util.gene_cons(lcSQL)

            prog_id = program[0].id
            prog_value = program[0].value
            //console.log(program)
        }
    }
    

    return res.render("progap/progap_nfocam", {rows, usuario, depe_id, depe_value, prog_id, prog_value})
});

module.exports = {
    progap,
    progap_dashboard,
    progap_cata,
    progap_usuario,
    progap_directivo,
    progap_estudia,
    progap_convoca,
    progap_exacam,
    progap_focam,
    progap_progra,
    progap_impo_prog,
    progap_convo,
    progap_actu_prog,
    progap_nestudia,
    progap_ndirectivo,
    progap_nusuario,
    progap_nprogra,
    progap_dexacam,
    progap_nfocam,
}
