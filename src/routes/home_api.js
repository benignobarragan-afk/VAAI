const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const homeCtrl = require("../controllers/homeApiControllers.js")


router.post("/usua_nuevx", midd.verifyToken, homeCtrl.usua_nuevx);

module.exports = router