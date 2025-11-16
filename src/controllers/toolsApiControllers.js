const { AsyncLocalStorage } = require("async_hooks");
const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const config = require(path.join(__dirname, "..", "config"));
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));


const tools_pdfx = ( async (req, res) => {
    
    //console.log(req.file)
    
    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(laExtencion != 'PDF'){
        res.json({"status" : false, "message": "No se pudo recuperar el archivo", "data":{}})
    }

    laComando = path.join(__dirname, "../APIPython/PyPDFText", "PDFtoText.py") 
    laArgs  = path.join(__dirname, "../uploads/", req.file.filename)

    console.log(laComando)
    console.log(laArgs)
    try {
        // 5. ESPERAR a que la Promesa de Python se resuelva
        const resultadoPython = await other_utils.ejecutarPython(laComando, laArgs);

        // 6. Ahora que tenemos el resultado, respondemos al cliente
        res.json({
            "status": "server", 
            "message":resultadoPython,
//            texto_extraido: resultadoPython,
//            ruta_procesada: laArgs
        });

    } catch (error) {
        console.error("Error al procesar el archivo:", error);
        res.status(500).json({ 
            status: "error", 
            message: "Fallo al procesar el archivo con Python.",
            detalle: error.message
        });
    }

//    console.log(laComando)
//    res.json({"ruta":laComando})

    //res.render("tools/tools_pdf");
});


const tools_qrx = ( async (req, res) => {

//console.log(req.file)
    
    const laArchivo = req.file.originalname;
    const laExtencion = laArchivo.substring(laArchivo.lastIndexOf(".")+1).toUpperCase() ;
    //console.log(laExtencion);

    if(!["BMP", "PNG", "GIF", "JPG", "JPEG"].includes(laExtencion)){
        res.json({"status" : false, "message": "No envió un archivo valido", "data":{}})
    }

    laComando = path.join(__dirname, "../APIPython/PyPDFText", "leeQR.py") 
    laArgs  = path.join(__dirname, "../uploads/", req.file.filename)

    console.log(laComando)
    console.log(laArgs)
    try {
        // 5. ESPERAR a que la Promesa de Python se resuelva
        const resultadoPython = await other_utils.ejecutarPython(laComando, laArgs);
        const lnIniHTTP = resultadoPython.toUpperCase().indexOf("HTTP") 
        const lcURL = (lnIniHTTP >0 ? resultadoPython.substring(lnIniHTTP) : '')

        // 6. Ahora que tenemos el resultado, respondemos al cliente
        res.json({
            "status": "server", 
            "message":resultadoPython,
            "url": lcURL
//            texto_extraido: resultadoPython,
//            ruta_procesada: laArgs
        });

    } catch (error) {
        console.error("Error al procesar el archivo:", error);
        res.json({ 
            status: "serverexit", 
            message: "Fallo al procesar el archivo con Python.",
            url: "",
            detalle: error.message
        });
    }

//    console.log(laComando)
// 

});


module.exports = {
    tools_pdfx,
    tools_qrx
}