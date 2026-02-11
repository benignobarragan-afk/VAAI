const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const homeCtrl = require("../controllers/homeApiControllers.js")


router.post("/usua_nuevx", midd.verifyToken, homeCtrl.usua_nuevx);
router.post("/usua_nuevx2", midd.verifyToken, homeCtrl.usua_nuevx2);
router.post("/usua_nuevx3", midd.verifyToken, homeCtrl.usua_nuevx3);
router.get("/gene_menu", midd.verifyToken, homeCtrl.gene_menu);
router.get("/usuariosx", midd.verifyToken, homeCtrl.usuariosx);
router.post("/prin_ca_pax", midd.verifyToken, homeCtrl.prin_ca_pax);
router.post("/camb_skin", midd.verifyToken, homeCtrl.camb_skin);


module.exports = router