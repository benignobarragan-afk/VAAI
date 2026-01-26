const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const multer = require("multer")

const upload = multer({ dest: 'src/uploads' })


//const pool = require('../db')

const progapCtrl = require("../controllers/progapApiControllers.js")

router.get("/progap_usuariox", midd.verifyToken, progapCtrl.progap_usuariox);
router.get("/progap_directivox", midd.verifyToken, progapCtrl.progap_directivox);
router.get("/progap_estudiax", midd.verifyToken, progapCtrl.progap_estudiax);
router.get("/progap_convocax", midd.verifyToken, progapCtrl.progap_convocax);
router.get("/progap_exacamx", midd.verifyToken, progapCtrl.progap_exacamx);
router.get("/progap_focamx", midd.verifyToken, progapCtrl.progap_focamx);
router.get("/progap_form01", midd.verifyToken, progapCtrl.progap_form01);
router.get("/progap_form02", midd.verifyToken, progapCtrl.progap_form02);
router.get("/progap_dashboardx", midd.verifyToken, progapCtrl.progap_dashboardx);
router.get("/progap_dashboardx2", midd.verifyToken, progapCtrl.progap_dashboardx2);
router.get("/progap_dashboardx3", midd.verifyToken, progapCtrl.progap_dashboardx3);
router.get("/progap_dashboardx4", midd.verifyToken, progapCtrl.progap_dashboardx4);
router.get("/progap_prograx", midd.verifyToken, progapCtrl.progap_prograx);
router.post("/progap_impo_progx", midd.verifyToken, upload.single('upload'), progapCtrl.progap_impo_progx);
router.post("/progap_actu_progx", midd.verifyToken, upload.single('upload'), progapCtrl.progap_actu_progx);
router.post("/progap_actu_progx2", midd.verifyToken, upload.single('upload'), progapCtrl.progap_actu_progx2);
router.post("/progap_impo_progx2", midd.verifyToken, upload.single('upload'), progapCtrl.progap_impo_progx2);
router.post("/progap_nestudiax", midd.verifyToken, upload.single('upload'), progapCtrl.progap_nestudiax);
router.post("/progap_ndirectivox", midd.verifyToken, upload.single('upload'), progapCtrl.progap_ndirectivox);
router.post("/progap_nusuariox", midd.verifyToken, upload.single('upload'), progapCtrl.progap_nusuariox);
router.post("/progap_nprograx", midd.verifyToken, upload.single('upload'), progapCtrl.progap_nprograx);
router.post("/progap_nfocamx", midd.verifyToken, upload.single('upload'), progapCtrl.progap_nfocamx);

module.exports = router