const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const multer = require("multer")

//const upload = multer({ dest: 'src/uploads' })
const upload = multer({ dest: path.join(__dirname, '../uploads') }); 

//const pool = require('../db')

const finCtrl = require("../controllers/finApiControllers.js")

router.get("/fin_orde_compx", midd.verifyToken, finCtrl.fin_orde_compx);
router.post("/fin_norde_compx2", midd.verifyToken, finCtrl.fin_norde_compx2);
router.post("/fin_norde_compx", midd.verifyToken, finCtrl.fin_norde_compx);



module.exports = router