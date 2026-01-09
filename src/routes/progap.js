const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const progapCtrl = require(path.join(__dirname,"..", "controllers/progapControllers.js"))



const router = express.Router()

router.get("/progap", midd.verifyToken, progapCtrl.progap);
router.get("/progap_dashboard", midd.verifyToken, progapCtrl.progap_dashboard);
router.get("/progap_cata", midd.verifyToken, progapCtrl.progap_cata);
router.get("/progap_usuario", midd.verifyToken, progapCtrl.progap_usuario);
router.get("/progap_directivo", midd.verifyToken, progapCtrl.progap_directivo);
router.get("/progap_estudia", midd.verifyToken, progapCtrl.progap_estudia);
router.get("/progap_convoca", midd.verifyToken, progapCtrl.progap_convoca);
router.get("/progap_exacam", midd.verifyToken, progapCtrl.progap_exacam);
router.get("/progap_focam", midd.verifyToken, progapCtrl.progap_focam);
router.get("/progap_progra", midd.verifyToken, progapCtrl.progap_progra);
router.get("/progap_impo_prog", midd.verifyToken, progapCtrl.progap_impo_prog);
router.get("/progap_convo", midd.verifyToken, progapCtrl.progap_convo);
router.get("/progap_actu_prog", midd.verifyToken, progapCtrl.progap_actu_prog);
router.get("/progap_nestudia", midd.verifyToken, progapCtrl.progap_nestudia);
router.get("/progap_ndirectivo", midd.verifyToken, progapCtrl.progap_ndirectivo);
router.get("/progap_nusuario", midd.verifyToken, progapCtrl.progap_nusuario);

module.exports = router