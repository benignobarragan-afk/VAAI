//Carga las variables del archivo .env al objeto process.env
require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

const express = require("express")
const helmet = require('helmet');
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken");
const ejs =require("ejs")
const path = require("path")
const pool = require('./db')
const outil = require('./utils/other_utils');

const app = express();

// 1. Configuración de límites (AQUÍ ES DONDE DEBE IR)
// Esto prepara al servidor para recibir los PDFs en Base64 del sistema SIVA
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Esto activa las protecciones básicas que pide ZAP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        
        // Solo permitimos scripts de nuestro propio servidor ('self')
        // Mantenemos 'unsafe-inline' y 'unsafe-eval' solo porque Webix los requiere internamente
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

        // Permite que Webix maneje eventos en los atributos de los elementos
        "script-src-attr": ["'unsafe-inline'"],

        // Estilos solo locales
        "style-src": ["'self'", "'unsafe-inline'"],

        // Fuentes (FontAwesome) solo locales
        "font-src": ["'self'"],

        // Bloqueamos cualquier conexión externa accidental
        "connect-src": ["'self'", "http://127.0.0.1:2727", "ws://127.0.0.1:2727"],
        
        // Imagenes locales y datos base64
        "img-src": ["'self'", "data:"],

        // Permite cargar el PDF dentro del iframe (visor nativo)
        "frame-src": ["'self'", "data:"],

        // Necesario para que algunos navegadores rendericen el PDF como objeto
        "object-src": ["'self'"],

        // Evita que otros sitios pongan a SIVA en un frame (protección contra Clickjacking)
        "frame-ancestors": ["'self'"]
      },
    },
    hidePoweredBy: true, // Esto quita la versión del servidor que ZAP marca
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true } // Activa el HSTS
  })
);

//cuando van a utilizar mi ip otro compañero
/* app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Si no es producción, permite HTTP y evita el error de SSL
        "upgrade-insecure-requests": isProduction ? [] : null, 
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "script-src-attr": ["'unsafe-inline'"],
      },
    },
    // Desactivamos protecciones de HTTPS solo en desarrollo
    hsts: isProduction,
    crossOriginOpenerPolicy: isProduction ? { policy: "same-origin" } : false,
  })
); */

/* app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      // ESTA LÍNEA ES LA QUE TE FALTA PARA LOS EVENTOS INLINE
      scriptSrcAttr: ["'unsafe-inline'"], 
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Para solucionar el error de appendChild (image_5a8b56)
      styleSrcAttr: ["'unsafe-inline'"], 
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      frameSrc: ["'self'"],
      upgradeInsecureRequests: [] // Esto evita conflictos si aún no tienes SSL
    },
  },
})); */

//codigo anterior de nginx
//app.set('trust proxy', 'loopback');
app.set('trust proxy', true);

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
const ProgapRoutes = require("./routes/progap")
const SipRoutes = require("./routes/sip")
const FinRoutes = require("./routes/fin")
const OpApiRoutes = require("./routes/op_api")
const ToolsApiRoutes = require("./routes/tools_api")
const ProgapApiRoutes = require("./routes/progap_api")
const SipApiRoutes = require("./routes/sip_api")
const FinApiRoutes = require("./routes/fin_api")
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
app.use("/progap", ProgapRoutes)
app.use("/sip", SipRoutes)
app.use("/fin", FinRoutes)
app.use("/api/op", OpApiRoutes)
app.use("/api/gen", GenApiRoutes)
app.use("/api/tools", ToolsApiRoutes)
app.use("/api/progap", ProgapApiRoutes)
app.use("/api/sip", SipApiRoutes)
app.use("/api/fin", FinApiRoutes)


app.listen(port)
console.log(`Servidor corriendo en el puerto ${port}`)
