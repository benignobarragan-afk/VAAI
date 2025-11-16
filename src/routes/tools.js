const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const toolCtrl = require(path.join(__dirname,"..", "controllers/toolsControllers.js"))



const router = express.Router()

router.get("/tools", midd.verifyToken, toolCtrl.tools);
router.get("/tools_pdf", midd.verifyToken, toolCtrl.tools_pdf);
router.get("/tools_sqr", midd.verifyToken, toolCtrl.tools_sqr);
router.get("/tools_qr", midd.verifyToken, toolCtrl.tools_qr);

module.exports = router