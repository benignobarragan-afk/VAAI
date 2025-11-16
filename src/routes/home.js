const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const homeCtrl = require(path.join(__dirname,"..", "controllers/homeControllers.js"))



const router = express.Router()

router.all("/", midd.verifyToken, homeCtrl.intro);
router.all("/intro", midd.verifyToken, homeCtrl.intro);
router.get("/logout", homeCtrl.logout);
router.get("/sin_derecho", homeCtrl.sin_derecho);

module.exports = router