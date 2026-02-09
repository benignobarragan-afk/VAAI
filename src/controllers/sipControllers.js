const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));

const sip = ((req, res) => {

    const lcDerecho = req.groups;
    
    //console.log(lcDerecho.indexOf(",SIP,"))
    
    if (lcDerecho.indexOf(",SIP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    res.render("sip/sip", {lcDerecho})
});


const sip_soli_prog = (async (req, res) => {
    
    if (req.groups.indexOf(",SIP_SOLI_PROG,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcSQL = `
    SELECT id AS id, anio AS anio  
        FROM PROGAP_CONVOCATORIA
        ORDER BY 2 DESC
    `

    const rows = await util.gene_cons(lcSQL)
    
    return res.render("sip/sip_soli_prog", {rows})
});

const sip_nsoli_prog = (async (req, res) => {
    
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
/*     lcSQL = `
        SELECT a.id, a.codigo, u.contrasena, a.nombre, a.apellido_paterno, a.apellido_materno, a.curp, u.id_centro_universitario AS centro, 
                a.id_programa AS programa, a.correo_institucional, a.id_ciclo_ingreso, a.id_ciclo_curso, a.id_ciclo_condonar, 
                if(a.id_estado > 2, 1, 0) as id_estado 
            FROM progap_alumnos a LEFT JOIN progap_usuarios u ON a.id_usuario = u.id
            WHERE a.id = ${req.query.lnID}

        ` */
    lcSQL = `
        SELECT t.id, t.codigo, a.nombre, a.apellido_paterno, a.apellido_materno, a.curp, t.id_centro_universitario AS centro, 
                t.id_programa AS programa, a.correo_institucional, t.id_ciclo_ingreso, t.id_ciclo_curso, t.id_ciclo_condonar, 
                if(a.id_estado > 2, 1, 0) as id_estado 
            FROM progap_tram_focam t LEFT JOIN progap_alumno a ON t.codigo = a.codigo
            WHERE t.id = ?

        `

        usuario = await util.gene_cons(lcSQL, [req.query.lnID])

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
    

    return res.render("sip/sip_nsoli_prog", {rows, usuario, depe_id, depe_value, prog_id, prog_value})
});

module.exports = {
    sip,
    sip_soli_prog,
    sip_nsoli_prog
}