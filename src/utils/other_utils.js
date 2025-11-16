const {spawn} = require("child_process")
const path = require('path');


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


module.exports = {
    ejecutarPython,
    form_fechSQL

}
