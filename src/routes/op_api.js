const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const opCtrl = require("../controllers/opApiControllers.js")

router.post("/op_cucsx2", midd.verifyToken, opCtrl.op_cucsx2);
router.get("/op_oficx5", midd.verifyToken, opCtrl.op_oficx5);
router.get("/cmb_controlw", midd.verifyToken, opCtrl.cmb_controlw);
router.get("/op_bplanx", midd.verifyToken, opCtrl.op_bplanx);
router.post("/op_nplantix", midd.verifyToken, opCtrl.op_nplantix);
router.get("/op_noficx4", midd.verifyToken, opCtrl.op_noficx4);
router.get("/op_noficx6", midd.verifyToken, opCtrl.op_noficx6);
router.get("/op_noficx7", midd.verifyToken, opCtrl.op_noficx7);
router.get("/op_bgrupx", midd.verifyToken, opCtrl.op_bgrupx);
router.post("/op_noficx5", midd.verifyToken, opCtrl.op_noficx5);
router.post("/op_gofic", midd.verifyToken, opCtrl.op_gofic);
router.get("/op_sdoficx", midd.verifyToken, opCtrl.op_sdoficx);
router.get("/op_admix2", midd.verifyToken, opCtrl.op_admix2);
router.get("/op_ningrx2", midd.verifyToken, opCtrl.op_ningrx2);
router.get("/cmb_control2W", midd.verifyToken, opCtrl.cmb_control2W);
router.get("/cmb_control3W", midd.verifyToken, opCtrl.cmb_control3W);
router.post("/op_ningrx", midd.verifyToken, opCtrl.op_ningrx);
router.post("/op_admix", midd.verifyToken, opCtrl.op_admix);
router.post("/op_nplan", midd.verifyToken, opCtrl.op_nplan);
router.post("/op_soficx", midd.verifyToken, opCtrl.op_soficx);
router.get("/op_hoficx", midd.verifyToken, opCtrl.op_hoficx);
router.get("/op_ingrx2", midd.verifyToken, opCtrl.op_ingrx2);


module.exports = router