const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const progapCtrl = require("../controllers/progapApiControllers.js")

router.get("/progap_usuariox", midd.verifyToken, progapCtrl.progap_usuariox);
router.get("/progap_directivox", midd.verifyToken, progapCtrl.progap_directivox);
router.get("/progap_estudiax", midd.verifyToken, progapCtrl.progap_estudiax);
router.get("/progap_convocax", midd.verifyToken, progapCtrl.progap_convocax);
router.get("/progap_exacamx", midd.verifyToken, progapCtrl.progap_exacamx);
router.get("/prueba", midd.verifyToken, progapCtrl.prueba);
router.get("/prueba2", midd.verifyToken, progapCtrl.prueba2);


module.exports = router