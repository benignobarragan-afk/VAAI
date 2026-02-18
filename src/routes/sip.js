const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const sipCtrl = require("../controllers/sipControllers.js")

router.get("/sip", midd.verifyToken, sipCtrl.sip);
router.get("/sip_soli_prog", midd.verifyToken, sipCtrl.sip_soli_prog);
router.get("/sip_nsoli_prog", midd.verifyToken, sipCtrl.sip_nsoli_prog);
router.get("/sip_materia", midd.verifyToken, sipCtrl.sip_materia);


module.exports = router