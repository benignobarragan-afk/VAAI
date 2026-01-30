const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const opCtrl = require("../controllers/opApiControllers.js")
const multer = require("multer")

//const upload = multer({ dest: 'src/uploads' })
const upload = multer({ dest: path.join(__dirname, '../uploads') }); 

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
router.get("/op_ningrx3", midd.verifyToken, opCtrl.op_ningrx3);
router.get("/cmb_control2W", midd.verifyToken, opCtrl.cmb_control2W);
router.get("/cmb_control3W", midd.verifyToken, opCtrl.cmb_control3W);
router.post("/op_ningrx", midd.verifyToken, opCtrl.op_ningrx);
router.post("/op_admix", midd.verifyToken, opCtrl.op_admix);
router.post("/op_nplan", midd.verifyToken, opCtrl.op_nplan);
router.post("/op_soficx", midd.verifyToken, opCtrl.op_soficx);
router.get("/op_hoficx", midd.verifyToken, opCtrl.op_hoficx);
router.get("/op_ingrx2", midd.verifyToken, opCtrl.op_ingrx2);
router.get("/cmb_correo", midd.verifyToken, opCtrl.cmb_correo);
router.post("/op_ngrupx", midd.verifyToken, opCtrl.op_ngrupx);
router.post("/op_reof0x", midd.verifyToken, opCtrl.op_reof0x);
router.get("/op_rgrafx", midd.verifyToken, opCtrl.op_rgrafx);
router.get("/op_rgrafx2", midd.verifyToken, opCtrl.op_rgrafx2);
router.get("/op_rgrafx3", midd.verifyToken, opCtrl.op_rgrafx3);
router.get("/op_rgrafx4", midd.verifyToken, opCtrl.op_rgrafx4);
router.post("/busc_oficx", midd.verifyToken, opCtrl.busc_oficx);
router.get("/new_ord__servx", midd.verifyToken, opCtrl.new_ord__servx);
router.post("/new_ord_servx2", midd.verifyToken, opCtrl.new_ord_servx2);
router.get("/detalle_ofic_Nox", midd.verifyToken, opCtrl.detalle_ofic_Nox);
router.get("/csg_sServx2", midd.verifyToken, opCtrl.csg_sServx2);
router.get("/seg_oficx", midd.verifyToken, opCtrl.seg_oficx);
router.post("/seg_oficx2", midd.verifyToken, opCtrl.seg_oficx2);
router.get("/recu_arch", midd.verifyToken, opCtrl.recu_arch);
router.get("/adownload", midd.verifyToken, opCtrl.adownload);
router.get("/op_nareax", midd.verifyToken, opCtrl.op_nareax);
router.post("/op_uoficio", midd.verifyToken, upload.single('upload'), opCtrl.op_uoficio);


module.exports = router