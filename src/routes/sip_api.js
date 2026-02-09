const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))
const multer = require("multer")

//const upload = multer({ dest: 'src/uploads' })
const upload = multer({ dest: path.join(__dirname, '../uploads') }); 

//const pool = require('../db')

const sipCtrl = require("../controllers/sipApiControllers.js")


router.get("/sip_soli_progx", midd.verifyToken, sipCtrl.sip_soli_progx);


module.exports = router

