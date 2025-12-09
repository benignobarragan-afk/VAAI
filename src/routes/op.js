const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const opCtrl = require("../controllers/opControllers.js")

router.get("/op_cucs", midd.verifyToken, opCtrl.op_cucs);
router.get("/op_ofic", midd.verifyToken, opCtrl.op_ofic);
router.get("/op_aingr", midd.verifyToken, opCtrl.op_aingr);
router.get("/op_nofic", midd.verifyToken, opCtrl.op_nofic);
router.get("/op_ningr", midd.verifyToken, opCtrl.op_ningr);
router.get("/op_admi", midd.verifyToken, opCtrl.op_admi);
router.get("/op_reof0", midd.verifyToken, opCtrl.op_reof0);
router.get("/op_sofic", midd.verifyToken, opCtrl.op_sofic);
router.get("/op_seofic", midd.verifyToken, opCtrl.op_seofic);
router.get("/op_plan", midd.verifyToken, opCtrl.op_plan);
router.get("/op_bplan", midd.verifyToken, opCtrl.op_bplan);
router.get("/op_nplanti", midd.verifyToken, opCtrl.op_nplanti);
router.get("/op_grup", midd.verifyToken, opCtrl.op_grup);
router.get("/op_bgrup", midd.verifyToken, opCtrl.op_bgrup);
router.get("/op_ngrup", midd.verifyToken, opCtrl.op_ngrup);
router.get("/op_sdofic", midd.verifyToken, opCtrl.op_sdofic);
router.get("/op_rgraf", midd.verifyToken, opCtrl.op_rgraf);
router.get("/op_hofic", midd.verifyToken, opCtrl.op_hofic);
router.get("/op_pend", midd.verifyToken, opCtrl.op_pend);
router.get("/op_ingr", midd.verifyToken, opCtrl.op_ingr);
router.get("/op_detalle", midd.verifyToken, opCtrl.op_detalle);
router.get("/detalle_ofic_No", midd.verifyToken, opCtrl.detalle_ofic_No);
router.get("/op_reof0", midd.verifyToken, opCtrl.op_reof0);
router.get("/busc_ofic", midd.verifyToken, opCtrl.busc_ofic);
router.get("/new_ord__serv", midd.verifyToken, opCtrl.new_ord__serv);


module.exports = router