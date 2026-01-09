const jwt = require("jsonwebtoken");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const { cacheUsuarios } = require("../middlewares/authjwt");


const signin = async (req, res) => {
    //res.json("signin")
    //console.log(req.body)
    //console.log(config.SECRET)
    //console.log(req.userId)
    
    let conn;
    try {
        // 2. Obtener una conexión del pool
        conn = await pool.getConnection();
        
        // 3. Ejecutar la consulta
        const rows = await conn.query("SELECT user_id, password, acceso FROM passfile WHERE user_id = " + req.body.username, [1]);
        //console.log(rows)
        
        if(!rows)
        {
            res.status(401).json({
                "mensaje":"El usuario no existe",
                "ok":false})
            return false;
        }

        if(rows[0].password != req.body.password)
        {
            res.status(401).json({
                "mensaje":"La contraseña no es correcto",
                "ok":false
            })
            return false;
        }
        const token = jwt.sign({id:req.body.username}, config.SECRET, {expiresIn: '15m'})
        const rtoken = jwt.sign({id:req.body.username, acceso:rows[0].acceso}, config.RSECRET, {expiresIn: '7d'})
        
        //borra el cache por si apenas inicio sesión en un equipo nuevo
        cacheUsuarios.delete(req.body.username);

        res.cookie("refresh_token", rtoken, {
            httpOnly: true,             //la cookie solo se puede acceder en el servidor
            secure: false,
            sameSite: "strict"
        }).cookie("access_token", token, {
            httpOnly: true,             //la cookie solo se puede acceder en el servidor
            secure: false,
            sameSite: "strict"
        })
        .json({
            token,
            "ok":true
        })


    } catch (err) {
        throw err;
    } finally {
        // 4. Devolver la conexión al pool (¡Muy Importante!)
        if (conn) conn.release(); 
    }

}


module.exports = {
    signin: signin
}