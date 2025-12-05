const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const homeCtrl = require(path.join(__dirname,"..", "controllers/homeControllers.js"))



const router = express.Router()

router.all("/", midd.verifyToken, homeCtrl.intro);
router.all("/intro", midd.verifyToken, homeCtrl.intro);
router.get("/logout", midd.verifyToken, homeCtrl.logout);
router.get("/sin_derecho", homeCtrl.sin_derecho);
router.get("/principal", midd.verifyToken, homeCtrl.principal);
router.get("/usuarios", midd.verifyToken, homeCtrl.usuarios);
router.get("/usua_nuev", midd.verifyToken, homeCtrl.usua_nuev);

module.exports = router