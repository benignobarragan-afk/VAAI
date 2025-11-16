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
router.get("/op_noficx7", midd.verifyToken, opCtrl.op_noficx7);
router.get("/op_bgrupx", midd.verifyToken, opCtrl.op_bgrupx);
router.post("/op_noficx5", midd.verifyToken, opCtrl.op_noficx5);
router.post("/op_gofic", midd.verifyToken, opCtrl.op_gofic);
router.get("/op_sdoficx", midd.verifyToken, opCtrl.op_sdoficx);
router.get("/op_admix2", midd.verifyToken, opCtrl.op_admix2);
router.get("/op_ningrx2", midd.verifyToken, opCtrl.op_ningrx2);
router.get("/cmb_control2w", midd.verifyToken, opCtrl.cmb_control2w);
router.post("/op_ningrx", midd.verifyToken, opCtrl.op_ningrx);



module.exports = router