const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const finCtrl = require("../controllers/finControllers.js")

router.get("/fin", midd.verifyToken, finCtrl.fin);
router.get("/fin_orde_comp", midd.verifyToken, finCtrl.fin_orde_comp);
router.get("/fin_norde_comp", midd.verifyToken, finCtrl.fin_norde_comp);

module.exports = router