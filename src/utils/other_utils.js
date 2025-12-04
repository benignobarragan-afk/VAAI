const {spawn} = require("child_process")
const path = require('path');
const crypto = require('crypto');
const pool = require(path.join(__dirname, "..", "db"))
const nodemailer = require('nodemailer');
const config = require(path.join(__dirname, "..", "config"));


const ejecutarPython = (async (pythonScriptPath, args) => {
    return new Promise((resolve, reject) => {
        
        // Inicia el proceso de Python (Asegúrate de que 'python' esté en el PATH o usa 'python3')
        const pythonProcess = spawn('python', [pythonScriptPath, args]);
        let pythonResponse = '';
        let errorOutput = '';

        // 1. Manejo del flujo de datos: Concatenar toda la salida
        pythonProcess.stdout.on('data', (data) => {
            pythonResponse += data.toString();
        });

        // 2. Manejo de errores de salida (Si Python usa print() para errores)
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // 3. Manejo del evento de CIERRE del proceso (el final real)
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                // Si el código de salida no es 0, hubo un error en Python
                console.error(`Error en el script Python (código ${code}): ${errorOutput}`);
                reject(new Error(`El script Python falló. Salida de error: ${errorOutput}`));
                return;
            }
            // 4. Resuelve la promesa con la respuesta completa
            resolve(pythonResponse.trim()); 
        });

        // Manejo de errores de inicio del proceso (ej: si 'python' no se encuentra)
        pythonProcess.on('error', (err) => {
            reject(new Error(`Error al iniciar el proceso Python: ${err.message}`));
        });
    });
});

const form_fechSQL = ( (fechaDDMMYYYY) => {
    
    if (!fechaDDMMYYYY || typeof fechaDDMMYYYY !== 'string') {
        return null;
    }
    
    // 1. Divide la cadena usando la barra '/' como separador
    const partes = fechaDDMMYYYY.split('/'); // ["13", "11", "2025"]

    if (partes.length === 3) {
        // 2. Reorganiza las partes al formato ISO: YYYY-MM-DD
        const [dia, mes, anio] = partes; // Asignación por desestructuración
        
        // 3. Devuelve la cadena unida por guiones
        return `${anio}-${mes}-${dia}`; // Salida: "2025-11-13"
    }

    return null; // Formato de entrada incorrecto

});

const gene_cont = ( (nomb_usua, codigo) => {

    function generarSegmentoAleatorio(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            // Usa crypto.randomInt para obtener un índice seguro
            result += chars[crypto.randomInt(chars.length)];
        }
        return result;
    }


    // Obtener una longitud aleatoria para el segmento aleatorio (entre 3 y 5)
    // Longitud total será: 2 + (3 a 5) + 1 + 2 = 8 a 10
    const randomLength = crypto.randomInt(3, 6); // Genera 3, 4, o 5
    
    const anioCorto = new Date().getFullYear().toString().slice(-2); // Obtener '25'
    const simbolos = '!@#$%&*';
    
    // --- 1. Extraer Iniciales (Parte Memorable) ---
    const partesNombre = nomb_usua.trim().split(/\s+/).slice(0, 2);
    let iniciales = 'Ua'; // Valor seguro por defecto
    
    if (partesNombre.length >= 1) {
        iniciales = partesNombre[0].charAt(0).toUpperCase(); // Mayúscula
        
        if (partesNombre.length >= 2) {
            iniciales += partesNombre[1].charAt(0).toLowerCase(); // Minúscula
        } else if (partesNombre[0].length >= 2) {
            iniciales += partesNombre[0].charAt(1).toLowerCase();
        } else {
            iniciales += 'a';
        }
    }
    
    // --- 2. Elementos Aleatorios (Parte Impredecible) ---
    
    // Segmento alfanumérico aleatorio (3, 4, o 5 caracteres)
    const segmentoAleatorio = generarSegmentoAleatorio(randomLength); 
    
    // Símbolo aleatorio
    const simboloAleatorio = simbolos[crypto.randomInt(simbolos.length)];
    
    // --- 3. Ensamblar la Contraseña ---
    
    // Longitud final: 8, 9 o 10 caracteres
    const contrasena = `${iniciales}${segmentoAleatorio}${simboloAleatorio}${anioCorto}`;
    
    return contrasena;


});

const registrarVisita = (async (logData) => {
    const sql = `
        INSERT INTO log_visitas 
        (metodo, url, status_code, ip_cliente, usuario_id, tiempo_respuesta_ms, fecha_visita)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
        logData.method,
        logData.url,
        logData.status,
        logData.ip,
        logData.userId || 'GUEST', // Si el usuario no está autenticado, registrar como GUEST
        logData.responseTime
    ];

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(sql, params);
    } catch (error) {
        // MUY IMPORTANTE: Si el log falla, no queremos que la aplicación se caiga.
        console.error("Error al registrar la bitácora:", error.message);
    } finally {
        if (conn) conn.release();
    }

});

const envi_corr = (async (lcCorreo, lnTipo) => {
    
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Usar el servicio predefinido de Gmail
        auth: {
            user: config.EMAIL_USER, 
            pass: config.EMAIL_PASS, 
        },
        // Opcional: Ignorar errores de certificado (solo en desarrollo)
        // tls: { rejectUnauthorized: false } 
    });

    // 2. Definir los detalles del correo
    let mailOptions = {
        from: `Soporte de la UdeG <${EMAIL_USER}>`, 
        to: to, 
        subject: subject, 
        html: htmlBody, 
        // Si quieres adjuntar archivos, usa la propiedad 'attachments':
        /* attachments: [
            {
                filename: 'documento.pdf',
                path: '/ruta/local/al/archivo.pdf' 
            }
        ]
        */
    };

    // 3. Enviar el correo y esperar el resultado
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Mensaje enviado: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        // Devolver el error específico (p. ej., error de autenticación)
        return { success: false, error: error.message }; 
    }

});

module.exports = {
    ejecutarPython,
    form_fechSQL,
    gene_cont,
    registrarVisita,
    envi_corr

}
