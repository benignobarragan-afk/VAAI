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

module.exports = router