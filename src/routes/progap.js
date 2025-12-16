const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const progapCtrl = require(path.join(__dirname,"..", "controllers/progapControllers.js"))



const router = express.Router()

router.get("/progap", midd.verifyToken, progapCtrl.progap);
router.get("/progap_dashboard", midd.verifyToken, progapCtrl.progap_dashboard);

module.exports = router