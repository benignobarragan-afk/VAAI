const express = require("express")
const path = require("path")
const pool = require(path.join(__dirname,"..", "db"))
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const toolCtrl = require(path.join(__dirname,"..", "controllers/toolsApiControllers.js"))
const multer = require("multer")

const upload = multer({ dest: 'src/uploads' })

const router = express.Router()

router.post("/tools_pdfx", midd.verifyToken, upload.single('upload'), toolCtrl.tools_pdfx);
router.post("/tools_qrx", midd.verifyToken, upload.single('upload'), toolCtrl.tools_qrx);
router.post("/tools_qrx2", midd.verifyToken, upload.single('upload'), toolCtrl.tools_qrx2);

module.exports = router