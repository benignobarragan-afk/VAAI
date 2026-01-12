const jwt = require("jsonwebtoken");
const path = require("path")
//const pool = require('../db')
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));
const config = require(path.join(__dirname, "..", "config.js"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));

// DEFINE EL CACHÉ AQUÍ
const cacheUsuarios = new Map();

const verifyToken = async (req, res, next) => {
    
    try {
        //const token = req.headers["x-access-token"]
        const token = req.cookies["access_token"]

        //console.log(req)
        if (!token){
            
            //return res.status(403).json({"message":"No se encontró el token"});
            return res.render("login");
        }

        const decoded = jwt.verify(token, config.SECRET)

        //console.log(req.userId)
        req.userId = decoded.id

        //Valida el usuario en la base de datos
        try {
            //consulta el cache de usuario antes de la base de datos
            let datosUsuario = cacheUsuarios.get(req.userId);

            if (!datosUsuario) {
                const rows = await util.gene_cons("SELECT id_cent, Centro, nom_cen, Nombre, codigo, bloqueada, GROUPS FROM passfile WHERE user_id =  " + decoded.id)
                //console.log("consulto la base de datos")
                if (rows.length <= 0){
                    return res.status(401).json({"message":"No se localizó al usuario del token"});
                }

                if (rows[0].bloqueada == 1){
                    //return res.status(401).json({"message":"La cuenta del usuario se encuentra bloqueada"});
                    return res.render("cuen_bloq")
                }

            
                datosUsuario = {
                    id_cent : (!rows[0].id_cent ? 0 : rows[0].id_cent),
                    centro  : (!rows[0].centro ? '' : rows[0].centro),
                    nom_cen : (!rows[0].nom_cen ? '' : rows[0].nom_cen),
                    nom_usu : (!rows[0].Nombre ? '' : rows[0].Nombre),
                    codigo  : (!rows[0].codigo ? 0 : rows[0].codigo),
                    token   : token,
                    groups  : (typeof rows[0].GROUPS != 'string'?',,': ',' + rows[0].GROUPS.replace(/\s/g, "") + ',')
                };

                cacheUsuarios.set(req.userId, datosUsuario);
            }
/*             else 
            {
                console.log("consulto cache de usuario");
            }
 */            //conn = await pool.getConnection();
            
            // 3. Ejecutar la consulta
            //const rows = await conn.query("SELECT id_cent, Centro, nom_cen, Nombre, codigo, bloqueada, GROUPS FROM passfile WHERE user_id =  " + decoded.id, [1]);
            
            
//codigo antes del cache
/*             req.id_cent = (!rows[0].id_cent ? 0 : rows[0].id_cent);
            req.centro  = (!rows[0].centro ? '' : rows[0].centro);
            req.nom_cen = (!rows[0].nom_cen ? '' : rows[0].nom_cen);
            req.nom_usu = (!rows[0].Nombre ? '' : rows[0].Nombre);
            req.codigo  = (!rows[0].codigo ? 0 : rows[0].codigo);
            if (typeof rows[0].GROUPS != 'string' )
            {
                req.groups  = ',,'
            }
            else 
            {
                req.groups  = ',' + rows[0].GROUPS.replace(/\s/g, "") + ',' ;
            }
 */        
//nuevo codigo que lee cache
            req.id_cent = datosUsuario.id_cent;
            req.centro  = datosUsuario.centro;
            req.nom_cen = datosUsuario.nom_cen;
            req.nom_usu = datosUsuario.Nombre;
            req.codigo  = datosUsuario.codigo;
            req.groups  = datosUsuario.groups;

            //console.log(rows)
            //console.log(token != datosUsuario.token)
            const esRutaDatos = /^\/api/.test(req.path);
            
            if (token != datosUsuario.token){
                //console.log(req)
                if(other_utils.regi_even_segu(req.userId, 'DUPLICADO', req.ip)){
                    //limpia el cache
                    cacheUsuarios.delete(req.userId);
                }
                if (req.originalUrl.toLowerCase().includes('api')) {
                // Si es una petición de Webix (AJAX), mandamos el error para que el front redirija
                    //return res.status(401).json({ status: "error", message: "duplicate_session" });
                    return res.status(401).json({"error":true, "menssage":"Sesión duplicada"})
                } else {
                    // Si es una navegación normal, renderizamos tu página EJS
                    //return res.render("otro_equi");
                    return res.clearCookie('access_token').clearCookie('refresh_token').render("otro_equi");
                }
                
            }


        } catch (err) {
            console.log(err)
            res.json({err})
            throw err;
        } finally {
            // 4. Devolver la conexión al pool (¡Muy Importante!)
            if (conn) conn.release(); 
        }

        //console.log(decoded)

        
        next();
    } catch (error) {
        
        if (error.message === 'jwt expired') {
            try {
                const rtoken = req.cookies["refresh_token"];
                if (!rtoken) return res.render("login");

                // 1. Usamos el RSECRET para el refresh
                const rdecoded = jwt.verify(rtoken, config.RSECRET);
                
                // 2. IMPORTANTE: Usamos rdecoded.id porque req.userId no existe aún
                const rows = await util.gene_cons("SELECT id_cent, Centro, nom_cen, Nombre, codigo, bloqueada, GROUPS, acceso FROM passfile WHERE user_id = " + rdecoded.id);
                
                if (rows.length <= 0) return res.render("login");

                // 3. Verificamos sesión única (ajusta 'acceso' al nombre real de tu columna UUID)
                if (rdecoded.acceso !== rows[0].acceso) {
                    return res.clearCookie('access_token').clearCookie('refresh_token').render("login");
                }

                // 4. Generamos nuevo token usando el ID del refresh
                const ntoken = jwt.sign({ id: rdecoded.id }, config.SECRET, { expiresIn: '15m' });

                res.cookie("access_token", ntoken, {
                    httpOnly: true,
                    secure: false, 
                    sameSite: "strict"
                });
                
                other_utils.regi_even_segu(rdecoded.id, 'RENOVACION', req.ip)

                // 5. Actualizamos el caché conservando los del usuario

                let usuarioEnCache = {
                    id_cent : (!rows[0].id_cent ? 0 : rows[0].id_cent),
                    centro  : (!rows[0].centro ? '' : rows[0].centro),
                    nom_cen : (!rows[0].nom_cen ? '' : rows[0].nom_cen),
                    nom_usu : (!rows[0].Nombre ? '' : rows[0].Nombre),
                    codigo  : (!rows[0].codigo ? 0 : rows[0].codigo),
                    token   : ntoken,
                    groups  : (typeof rows[0].GROUPS != 'string'?',,': ',' + rows[0].GROUPS.replace(/\s/g, "") + ',')
                };

                cacheUsuarios.set(rdecoded.id, usuarioEnCache);

                // 6. Seteamos los datos en el req para que la ruta final los tenga
                req.userId  = rdecoded.id;
                req.id_cent = usuarioEnCache.id_cent;
                req.centro  = usuarioEnCache.centro;
                req.nom_cen = usuarioEnCache.nom_cen;
                req.nom_usu = usuarioEnCache.Nombre;
                req.codigo  = usuarioEnCache.codigo;
                req.groups  = usuarioEnCache.groups;

                console.log("Token renovado para usuario:", rdecoded.id);
                
                return next(); // FINALIZA AQUÍ SI TODO SALIÓ BIEN

            } catch (errRefresh) {
                console.log("Error en Refresh:", errRefresh);
                return res.render("login");
            }
        }

        console.log("Error de Verificación:", error.message);
        return res.render("login");
    }

}


module.exports = {
    verifyToken,
    cacheUsuarios
}