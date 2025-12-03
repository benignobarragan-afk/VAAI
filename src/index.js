
const express = require("express")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken");
const ejs =require("ejs")
const path = require("path")
const pool = require('./db')

const app = express();

// 1. Crear el Pool de Conexiones


const AuthRoutes = require("./routes/auth")
const HomeRoutes = require("./routes/home")
const HomeApiRoutes = require("./routes/home_api")
const GenApiRoutes = require("./routes/gen_api")
const OpRoutes = require("./routes/op")
const ToolsRoutes = require("./routes/tools")
const OpApiRoutes = require("./routes/op_api")
const ToolsApiRoutes = require("./routes/tools_api")
//const UserRoutes = require("./routes/user")

//settings
app.set('views', path.join(__dirname,'views'))
app.set('view engine', 'ejs')

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(async (req, res, next) => {
    next();    
});

//routes
app.use("/api/auth", AuthRoutes)
app.use(HomeRoutes)
app.use("/api/", HomeApiRoutes)
app.use("/op", OpRoutes)
app.use("/tools", ToolsRoutes)
app.use("/api/op", OpApiRoutes)
app.use("/api/gen", GenApiRoutes)
app.use("/api/tools", ToolsApiRoutes)


//app.use(UserRoutes)

app.listen(3000)
console.log("Servidor corriendo en el puerto 3000")
