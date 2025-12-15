const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const util = require(path.join(__dirname, "..", "utils/busquedaUtils"));


const progap = ((req, res) => {
    if (req.groups.indexOf(",PROGAP,") < 0)        //si no tiene derechos
    {
        return res.render("sin_derecho")
    }

    const lcDerecho = req.groups;
    res.render("PROGAP/progap", {lcDerecho})
});

module.exports = {
    progap,
}
