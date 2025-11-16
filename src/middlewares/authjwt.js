const jwt = require("jsonwebtoken");
const path = require("path")
const pool = require('../db')
const config = require(path.join(__dirname, "..", "config.js"));

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
            conn = await pool.getConnection();
            
            // 3. Ejecutar la consulta
            const rows = await conn.query("SELECT id_cent, Centro, nom_cen, Nombre, codigo, bloqueada, GROUPS FROM passfile WHERE user_id =  " + decoded.id, [1]);
            //console.log(rows);
            if (rows.length <= 0){
                return res.status(401).json({"message":"No se localizó al usuario del token"});
            }
            if (rows[0].bloqueada === 1){
                return res.status(401).json({"message":"La cuenta del usuario se encuentra bloqueada"});
            }

            req.id_cent = (!rows[0].id_cent ? 0 : rows[0].id_cent);
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
            
            //console.log(rows)

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
        
        if (error.message === 'jwt expired'){                //si el tonken ya expiro
            //console.log("el token expiro")
            return res.render("login");
        }

        console.log(error)
        //return res.status(401).json({error})
        return res.render("login");
        
    }

}


module.exports = {
    verifyToken: verifyToken
}