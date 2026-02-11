const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const opCtrl = require("../controllers/genApiControllers.js")

router.get("/cmb_depew", midd.verifyToken, opCtrl.cmb_depew);
router.get("/cmb_persw", midd.verifyToken, opCtrl.cmb_persw);
router.get("/cmb_progap_depe", midd.verifyToken, opCtrl.cmb_progap_depe);
router.get("/cmb_progap_prog", midd.verifyToken, opCtrl.cmb_progap_prog);
router.get("/cmb_prov", midd.verifyToken, opCtrl.cmb_prov);

module.exports = router