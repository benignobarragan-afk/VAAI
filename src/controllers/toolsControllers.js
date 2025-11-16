const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));



const tools = ((req, res) => {
    res.render("tools/tools");
});

const tools_pdf = ((req, res) => {
    res.render("tools/tools_pdf");
});

const tools_qr = ((req, res) => {
    res.render("tools/tools_qr");
});

const tools_sqr = ((req, res) => {
    res.render("tools/tools_sqr");
});


module.exports = {
    tools,
    tools_pdf,
    tools_qr,
    tools_sqr
}