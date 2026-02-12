const path = require("path")
const fs = require('fs');
const other_utils = require(path.join(__dirname, "..", "utils/other_utils"));

const plantilla01 = (async (doc, lcArch) => {

   const anchoPagina = doc.page.width;
   const altoPagina = doc.page.height;
   const margen = 50;

   // 1. ENCABEZADO

/*     doc.fontSize(10)
      .fillColor('#999999')
      .text('SISTEMA DE GESTIÓN VAAI', margen, 30, { align: 'left' })
      .text('Reporte de Control 2025', 0, 30, { align: 'right' });

   // Línea divisoria superior
   doc.moveTo(margen, 45)
      .lineTo(anchoPagina - margen, 45)
      .strokeColor('#cccccc')
      .stroke();
*/
   //imagen
   let lcArchivo = path.join(__dirname, "..", "pdf/imagenes/"+lcArch)
   //const llArchivo = await other_utils.exit_arch(lcArchivo)
   //if (llArchivo){
   if (fs.existsSync(lcArchivo)){
      doc.image(lcArchivo, 25, 25, {width: 630})
      //console.log("si entro en la función pantilla")
   }
   else
   {
      lcArchivo = path.join(__dirname, "..", "pdf/imagenes/VICERRECTORIA.jpg")
      doc.image(lcArchivo, 25, 25, {width: 580})
   }


   // 2. PIE DE PÁGINA
   doc.fontSize(8)
      .fillColor('#999999')
      .text(`Página: ${doc.bufferedPageRange().count}`, margen, altoPagina - 45, { align: 'center', lineBreak: false });

   doc.y = 120; // Resetear posición vertical para no encimar el encabezado

/*     // Línea divisoria inferior
   doc.moveTo(margen, altoPagina - 45)
      .lineTo(anchoPagina - margen, altoPagina - 45)
      .stroke();
*/
});

const plantillaOC = (async (doc, lcArch) => {

   const anchoPagina = doc.page.width;
   const altoPagina = doc.page.height;
   const margen = 50;

   // 1. ENCABEZADO

/*     doc.fontSize(10)
      .fillColor('#999999')
      .text('SISTEMA DE GESTIÓN VAAI', margen, 30, { align: 'left' })
      .text('Reporte de Control 2025', 0, 30, { align: 'right' });

   // Línea divisoria superior
   doc.moveTo(margen, 45)
      .lineTo(anchoPagina - margen, 45)
      .strokeColor('#cccccc')
      .stroke();
*/
   //imagen
   let lcArchivo = path.join(__dirname, "..", "pdf/imagenes/"+lcArch)
   //const llArchivo = await other_utils.exit_arch(lcArchivo)
   //if (llArchivo){
   if (fs.existsSync(lcArchivo)){
      doc.image(lcArchivo, 25, 25, {width: 630})
      //console.log("si entro en la función pantilla")
   }
   else
   {
      lcArchivo = path.join(__dirname, "..", "pdf/imagenes/VICERRECTORIA.jpg")
      doc.image(lcArchivo, 25, 25, {width: 580})
   }


   // 2. PIE DE PÁGINA
   doc.fontSize(8)
      .fillColor('#999999')
      .text(`Página: ${doc.bufferedPageRange().count}`, margen, altoPagina - 45, { align: 'center', lineBreak: false });

   doc.y = 120; // Resetear posición vertical para no encimar el encabezado

/*     // Línea divisoria inferior
   doc.moveTo(margen, altoPagina - 45)
      .lineTo(anchoPagina - margen, altoPagina - 45)
      .stroke();
*/
});


module.exports = {
    plantilla01,
    plantillaOC,
}


