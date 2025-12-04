
const express = require("express")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken");
const ejs =require("ejs")
const path = require("path")
const pool = require('./db')
const outil = require('./utils/other_utils');

const app = express();
app.set('trust proxy', 'loopback');

morgan.token('user-id', function (req, res) {
    // Asumimos que tu middleware de autenticación pone el ID en req.user.id
    return req.userId ? req.userId : 'GUEST';
});

// ----------------------------------------------------
// 1. Crear el Stream Personalizado para Morgan
// ----------------------------------------------------
const customStream = {
    write: (message) => {
        // Morgan envía una línea de texto formateada en 'message'
        
        // El formato ahora es: ':method :url :status :response-time :remote-addr :user-id'
        
        // 1. Extraer los componentes. Usamos split(' ') y filtramos los espacios extra:
        const partes = message.trim().split(/\s+/);

        // Se esperan al menos 6 partes con el nuevo token :user-id
        if (partes.length >= 6) {
            const logData = {
                method: partes[0],
                url: partes[1],
                status: parseInt(partes[2], 10),
                responseTime: parseFloat(partes[3]),
                ip: partes[4],
                // El ID del usuario capturado por el token personalizado
                userId: partes[5], 
            };
            
            // 2. Llamar a la función asíncrona para guardar en la BD
            outil.registrarVisita(logData);
        }
    },
};

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

// Aplicar Morgan con el token personalizado
app.use(morgan(':method :url :status :response-time[0] :remote-addr :user-id', {
    // Usar el stream personalizado en lugar de process.stdout
    stream: customStream,
}));
//app.use(async (req, res, next) => {
//    next();    
//});

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
