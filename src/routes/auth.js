const express = require("express"); 
const router = express.Router();
const path = require("path")
const midd = require(path.join(__dirname,"..", "middlewares/authjwt.js"))

//const pool = require('../db')

const authCtrl = require("../controllers/authControllers.js")

router.post("/signin", authCtrl.signin);


module.exports = router