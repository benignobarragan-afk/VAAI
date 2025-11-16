

function generacurp2(nombre, pa, sa, fecha, sexo, estado, anio, fechac) {

    nombre = nombre.toUpperCase();
    if (pa == '') {
        pa = "XXXXX";
    }
    else {
        pa = pa.toUpperCase();
    }
    if (sa == '') {
        sa = "XXXXX";
    }
    else {
        sa = sa.toUpperCase();
    }
    if (estado == "") {
        estado = "JC";
    }

    return fnCalculaCURP(nombre, pa, sa, fecha, sexo, estado, anio, fechac);
}
/* funcion redirige a la siguiente pagina con el curp nuevo */

/* funciones de ayuda para creacion de curp */
function ajustaCompuesto(str) {
    var compuestos = [/\bDA\b/, /\bDAS\b/, /\bDE\b/, /\bDEL\b/, /\bDER\b/, /\bDI\b/,
        /\bDIE\b/, /\bDD\b/, /\bEL\b/, /\bLA\b/, /\bLOS\b/, /\bLAS\b/, /\bLE\b/,
        /\bLES\b/, /\bMAC\b/, /\bMC\b/, /\bVAN\b/, /\bVON\b/, /\bY\b/];

    compuestos.forEach(function (compuesto) {
        if (compuesto.test(str)) {
            str = str.replace(compuesto, '');
        }
    });

    return str;
}
/* funciones de ayuda para creacion de curp */
function ajustaCompuesto2(str) {
    var compuestos = [/\bJOSE\b/, /\bMARIA\b/, /\bMA+\..\b/, /\bMA\b/, /\bDE\b/, /\bLA\b/, /\b(\.)\b/,
        /\bLAS\b/, /\bMC\b/, /\bVON\b/, /\bDEL\b/, /\bLOS\b/, /\bY\b/, /\bMAC\b/, /\bJ+\..\b/, /\bJ\b/,
        /\bVAN\b/];

    compuestos.forEach(function (compuesto) {
        if (compuesto.test(str)) {
            str = str.replace(compuesto, '');
        }
    });

    return str;
}
/* funciones de ayuda para creacion de curp */
function filtraInconvenientes(str) {
    var inconvenientes = ['BACA', 'LOCO', 'BUEI', 'BUEY', 'MAME', 'CACA', 'MAMO',
        'CACO', 'MEAR', 'CAGA', 'MEAS', 'CAGO', 'MEON', 'CAKA', 'MIAR', 'CAKO', 'MION',
        'COGE', 'MOCO', 'COGI', 'MOKO', 'COJA', 'MULA', 'COJE', 'MULO', 'COJI', 'NACA',
        'COJO', 'NACO', 'COLA', 'PEDA', 'CULO', 'PEDO', 'FALO', 'PENE', 'FETO', 'PIPI',
        'GETA', 'PITO', 'GUEI', 'POPO', 'GUEY', 'PUTA', 'JETA', 'PUTO', 'JOTO', 'QULO',
        'KACA', 'RATA', 'KACO', 'ROBA', 'KAGA', 'ROBE', 'KAGO', 'ROBO', 'KAKA', 'RUIN',
        'KAKO', 'SENO', 'KOGE', 'TETA', 'KOGI', 'VACA', 'KOJA', 'VAGA', 'KOJE', 'VAGO',
        'KOJI', 'VAKA', 'KOJO', 'VUEI', 'KOLA', 'VUEY', 'KULO', 'WUEI', 'LILO', 'WUEY',
        'LOCA'];

    if (inconvenientes.indexOf(str) > -1) {
        str = str.replace(/^(\w)\w/, '$1X');
    }
    return str;
}


/* funciones principal para creacion de curp */
function fnCalculaCURP(pstNombre, pstPaterno, pstMaterno, dfecha, pstSexo, pnuCveEntidad, anio, fechac) {
    //alert(pstNombre+pstPaterno+pstMaterno+dfecha+pstSexo+pnuCveEntidad);
    pstCURP1 = new Array();


    pstCURP = "";
    pstDigVer = "";
    contador = 0;
    contador1 = 0;
    pstCom = "";
    numVer = 0.00;
    valor = 0;
    sumatoria = 0;
    // se declaran las varibale que se van a utilizar para ontener la CURP
    NOMBRES = "";
    APATERNO = "";
    AMATERNO = "";
    T_NOMTOT = "";
    NOMBRE1 = ""; //PRIMER NOMBRE
    NOMBRE2 = ""; //DEMAS NOMBRES
    NOMBRES_LONGITUD = 0; //LONGITUD DE TODOS @NOMBRES
    var NOMBRE1_LONGITUD = 0; //LONGITUD DEL PRIMER NOMBRE(MAS UNO,EL QUE SOBRA ES UN ESPACIO EN BLANCO)
    APATERNO1 = ""; //PRIMER NOMBRE
    APATERNO2 = ""; //DEMAS NOMBRES
    APATERNO_LONGITUD = 0; //LONGITUD DE TODOS @NOMBRES
    APATERNO1_LONGITUD = 0; //LONGITUD DEL PRIMER NOMBRE(MAS UNO,EL QUE SOBRA ES UN ESPACIO EN BLANCO)
    AMATERNO1 = ""; //PRIMER NOMBRE
    AMATERNO2 = ""; //DEMAS NOMBRES
    AMATERNO_LONGITUD = 0; //LONGITUD DE TODOS @NOMBRES
    AMATERNO1_LONGITUD = 0; //LONGITUD DEL PRIMER NOMBRE(MAS UNO,EL QUE SOBRA ES UN ESPACIO EN BLANCO)
    VARLOOPS = 0; //VARIABLE PARA LOS LOOPS, SE INICIALIZA AL INICIR UN LOOP
    // Se inicializan las variables para obtener la primera parte de la CURP
    NOMBRES = pstNombre.replace(/^\s+|\s+$/g, "");
    NOMBRESini = pstNombre.replace(/^\s+|\s+$/g, "");
    //alert(NOMBRES);
    NOMBRES = ajustaCompuesto2(NOMBRES);
    //alert(NOMBRES);
    NOMBRES = ajustaCompuesto2(NOMBRES);
    NOMBRES = ajustaCompuesto2(NOMBRES);
    NOMBRES = ajustaCompuesto2(NOMBRES);
    //alert(NOMBRES);
    NOMBRES = NOMBRES.trim();
    NOMBRES = NOMBRES.trim();
    NOMBRES = NOMBRES.trim();
    NOMBRES_LONGITUDnom = NOMBRES.length
    if (NOMBRES_LONGITUDnom == 0) {
        NOMBRES = NOMBRESini;
    }
    APATERNO = pstPaterno.replace(/^\s+|\s+$/g, "");
    APATERNO = ajustaCompuesto(APATERNO);
    APATERNO = APATERNO.trim();
    APATERNO = APATERNO.trim();
    APATERNO = APATERNO.trim();
    AMATERNO = pstMaterno.replace(/^\s+|\s+$/g, "");
    AMATERNO = ajustaCompuesto(AMATERNO);
    AMATERNO = AMATERNO.trim();
    AMATERNO = AMATERNO.trim();
    AMATERNO = AMATERNO.trim();
    T_NOMTOT = APATERNO + ' ' + AMATERNO + ' ' + NOMBRES;
    // Se procesan los nombres de pila
    VARLOOPS = 0;
    while (VARLOOPS != 1) {
        NOMBRES_LONGITUD = NOMBRES.length
        var splitNombres = NOMBRES.split(" ");
        var splitNombre1 = splitNombres[0];
        NOMBRE1_LONGITUD = splitNombre1.length;
        //      NOMBRE1_LONGITUD = PATINDEX('% %',@NOMBRES)
        if (NOMBRE1_LONGITUD = 0) {
            NOMBRE1_LONGITUD = NOMBRES_LONGITUD;
        }
        NOMBRE1 = NOMBRES.substring(0, splitNombre1.length);
        NOMBRE2 = NOMBRES.substring(splitNombre1.length + 1, NOMBRES.length);
        // Se quitan los nombres de JOSE, MARIA,MA,MA.
        /*
        if (NOMBRE1 IN ('JOSE','MARIA','MA.','MA','DE','LA','LAS','MC','VON','DEL','LOS','Y','MAC','VAN') && NOMBRE2 != '')
        {
                NOMBRES = NOMBRE2
        }
        else
        {
                VARLOOPS = 1
        }
        */
        if (NOMBRE1 == 'JOSE' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }

        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'J.' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }

        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'MARIA' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'MA.' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'M.' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'M' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'MA' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'DE' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'LA' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'LAS' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'MC' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'VON' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'DEL' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'LOS' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'Y' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'MAC' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
        if (NOMBRE1 == 'VAN' && NOMBRE2 != '') {
            NOMBRES = NOMBRE2;
        }
        else {
            VARLOOPS = 1;
        }
    } // fin varloops <> 1
    // Se procesan los APELLIDOS, PATERNO EN UN LOOP
    VARLOOPS = 0;
    while (VARLOOPS != 1) {
        APATERNO_LONGITUD = APATERNO.length;
        var splitPaterno = APATERNO.split(" ");
        var splitPaterno1 = splitPaterno[0];
        APATERNO1_LONGITUD = splitPaterno1.length;
        if (APATERNO1_LONGITUD = 0) {
            APATERNO1_LONGITUD = APATERNO_LONGITUD;
        }
        APATERNO1 = APATERNO.substring(0, splitPaterno1.length);
        APATERNO2 = APATERNO.substring(splitPaterno1.length + 1, APATERNO.length);
        // Se quitan los sufijos
        if (APATERNO1 == 'DE' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'LA' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'LAS' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'MC' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'VON' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'DEL' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'DE' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'LOS' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'Y' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'MAC' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (APATERNO1 == 'VAN' && APATERNO2 != '') {
            APATERNO = APATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
    } // fin varloops
    // Faltan: )
    // Se procesan los APELLIDOS, MATERNO EN UN LOOP
    VARLOOPS = 0;
    //		alert(VARLOOPS);
    while (VARLOOPS != 1) {
        //SET @APATERNO_LONGITUD = LEN(@APATERNO)
        AMATERNO_LONGITUD = AMATERNO.length;
        //SET @APATERNO1_LONGITUD = PATINDEX('% %',@APATERNO)
        var splitMaterno = AMATERNO.split(" ");
        var splitMaterno1 = splitMaterno[0];
        AMATERNO1_LONGITUD = splitMaterno1.length;
        if (AMATERNO1_LONGITUD = 0) {
            AMATERNO1_LONGITUD = AMATERNO_LONGITUD;
        }
        AMATERNO1 = AMATERNO.substring(0, splitMaterno1.length);
        AMATERNO2 = AMATERNO.substring(splitMaterno1.length + 1, AMATERNO.length);
        // Se quitan los sufijos
        if (AMATERNO1 == 'DE' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'LA' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'LAS' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'MC' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'VON' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'DEL' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'DE' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'LOS' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'Y' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'MAC' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
        if (AMATERNO1 == 'VAN' && AMATERNO2 != '') {
            AMATERNO = AMATERNO2;
        }
        else {
            VARLOOPS = 1;
        }
    } // fin varloops
    // Se obtiene del primer apellido la primer letra y la primer vocal interna
    APATERNO1_LONGITUD2 = APATERNO1.length;
    if (APATERNO1_LONGITUD2 == 0) {
        pstCURP = 'X';
        pstCURP1[0] = 'X';
    }
    else {
        pstCURP = APATERNO1.substring(0, 1);
        pstCURP1[0] = APATERNO1.substring(0, 1);
    }
    if (APATERNO1_LONGITUD2 > 0) {
        APATERNO1_LONGITUD = APATERNO1.length;
        APATERNO1_LONGITUD_O = APATERNO1.length;
        var band_p = 0;
        VARLOOPS = 0 // EMPIEZA EN UNO POR LA PRIMERA LETRA SE LA VA A SALTAR
        while (APATERNO1_LONGITUD > VARLOOPS) {
            VARLOOPS = VARLOOPS + 1;
            // if SUBSTRING(@APATERNO1,@VARLOOPS,1) IN ('A','E','I','O','U')
            var compara = APATERNO1.substr(parseInt(VARLOOPS), 1);
            if (compara == 'A') {
                pstCURP = pstCURP + compara;
                pstCURP1[1] = compara;
                VARLOOPS = APATERNO1_LONGITUD;
                band_p = 1;
            }
            if (compara == 'E') {
                pstCURP = pstCURP + compara;
                VARLOOPS = APATERNO1_LONGITUD;
                pstCURP1[1] = compara;
                band_p = 1;
            }
            if (compara == 'I') {
                pstCURP = pstCURP + compara;
                VARLOOPS = APATERNO1_LONGITUD;
                pstCURP1[1] = compara;
                band_p = 1;
            }
            if (compara == 'O') {
                pstCURP = pstCURP + compara;
                VARLOOPS = APATERNO1_LONGITUD;
                pstCURP1[1] = compara;
                band_p = 1;
            }
            if (compara == 'U') {
                pstCURP = pstCURP + compara;
                VARLOOPS = APATERNO1_LONGITUD;
                pstCURP1[1] = compara;
                band_p = 1;
            }
        }
        if (band_p == 0) {
            pstCURP = pstCURP + 'X';
            pstCURP1[1] = 'X';
        }

    }
    else {
        pstCURP = pstCURP + 'X';
        pstCURP1[1] = 'X';
    }
    // Se obtiene la primer letra del apellido materno 
    AMATERNO1_LONGITUD = AMATERNO1.length;
    if (AMATERNO1_LONGITUD == 0) {
        pstCURP = pstCURP + 'X';
        pstCURP1[2] = 'X';
    }
    else {
        pstCURP = pstCURP + AMATERNO1.substring(0, 1);
        pstCURP1[2] = AMATERNO1.substring(0, 1);
    }
    if (NOMBRES.substring(0, 1) == ' ') {
        NOMBRES_LONGITUD2 = NOMBRES.length;
        NOMBRES = NOMBRES.substring(1, NOMBRES_LONGITUD2)
    }
    if (NOMBRES.substring(0, 1) == ' ') {
        NOMBRES_LONGITUD2 = NOMBRES.length;
        NOMBRES = NOMBRES.substring(1, NOMBRES_LONGITUD2)
    }
    if (NOMBRES.substring(0, 1) == ' ') {
        NOMBRES_LONGITUD2 = NOMBRES.length;
        NOMBRES = NOMBRES.substring(1, NOMBRES_LONGITUD2)
    }
    NOMBRES_LONGITUD = NOMBRES.length;
    // Se le agrega la primer letra del nombre
    if (NOMBRES_LONGITUD == 0) {
        pstCURP = pstCURP + 'X';
        pstCURP1[3] = 'X';
    }
    else {
        if (NOMBRES.substring(0, 1) == 'Ñ') {
            pstCURP = 'X';
            pstCURP1[3] = 'X';
        }
        else {
            //pstCURP = pstCURP + NOMBRES.substring(0, 1)+'--'+NOMBRES+'--';
            pstCURP = pstCURP + NOMBRES.substring(0, 1);
            pstCURP1[3] = NOMBRES.substring(0, 1);
        }
    }
    pstCURP = filtraInconvenientes(pstCURP);

    pstCURP1[4] = fechac;
    pstCURP1[5] = pstSexo;
    pstCURP1[6] = pnuCveEntidad;


    // pstCURP = pstCURP + NOMBRES.substring(0, 1);
    pstCURP = pstCURP + dfecha + pstSexo + pnuCveEntidad;
    // Se obtiene la primera consonante interna del apellido paterno
    VARLOOPS = 0;
    var band_pa = 0;
    //pstCURP = pstCURP + '-'+splitPaterno1+'-';
    while (splitPaterno1.length - 1 > VARLOOPS) {
        VARLOOPS = VARLOOPS + 1
        var compara = APATERNO1.substr(parseInt(VARLOOPS), 1);
        if (compara != 'A' && compara != 'E' && compara != 'I' && compara != 'O' && compara != 'U') {
            if (compara == 'Ñ') {
                pstCURP = pstCURP + 'X';
                pstCURP1[7] = 'X';
                band_pa = 1;
            }
            else {
                pstCURP = pstCURP + compara;
                pstCURP1[7] = compara;
                band_pa = 1;
            }
            VARLOOPS = splitPaterno1.length;

        }
    }
    if (band_pa == 0) {
        pstCURP = pstCURP + 'X';
        pstCURP1[7] = 'X';
    }
    // Se obtiene la primera consonante interna del apellido materno
    VARLOOPS = 0;
    band_pa = 0;
    //		pstCURP = pstCURP + splitMaterno1.length;
    //		pstCURP = pstCURP + '-'+splitMaterno1+'-';
    while (splitMaterno1.length - 1 > VARLOOPS) {
        VARLOOPS = VARLOOPS + 1;
        var compara = AMATERNO1.substr(parseInt(VARLOOPS), 1);
        if (compara != 'A' && compara != 'E' && compara != 'I' && compara != 'O' && compara != 'U') {
            if (compara == 'Ñ') {
                pstCURP = pstCURP + 'X';
                pstCURP1[8] = 'X';
                band_pa = 1;
            }
            else {
                pstCURP = pstCURP + compara;
                pstCURP1[8] = compara;
                band_pa = 1;
            }
            VARLOOPS = splitMaterno1.length;

        }


    }
    if (band_pa == 0) {
        pstCURP = pstCURP + 'X';
        pstCURP1[8] = 'X';
    }

    // Se obtiene la primera consonante interna del nombre
    VARLOOPS = 0;
    band_pa = 0;

    // pstCURP = pstCURP + '--'+NOMBRES+'--';
    while (NOMBRES.length - 1 > VARLOOPS) {
        //		while (splitNombre1.length > VARLOOPS) {
        //		alert(VARLOOPS);
        VARLOOPS = VARLOOPS + 1;
        var compara = NOMBRES.substr(parseInt(VARLOOPS), 1);
        //		alert(compara+" - "+NOMBRES+" - "+VARLOOPS)
        //			var compara = splitNombre1.substr(parseInt(VARLOOPS), 1);
        if (compara != 'A' && compara != 'E' && compara != 'I' && compara != 'O' && compara != 'U') {
            if (compara == 'Ñ') {
                pstCURP = pstCURP + 'X';
                pstCURP1[9] = 'X';
            }
            else {
                pstCURP = pstCURP + compara;
                pstCURP1[9] = compara;
            }
            VARLOOPS = NOMBRES.length;
            band_pa = 1;
        }
    }
    if (band_pa == 0) {
        pstCURP = pstCURP + 'X';
        pstCURP1[9] = compara;
    }
    // Se obtiene el digito verificador
    var contador = 18;
    var contador1 = 0;
    var valor = 0;
    var sumatoria = 0;
    while (contador1 <= 15) {
        //pstCom = SUBSTRING(@pstCURP,@contador1,1)
        var pstCom = pstCURP.substr(parseInt(contador1), 1);
        if (pstCom == '0') {
            valor = 0 * contador;
        }
        if (pstCom == '1') {
            valor = 1 * contador;
        }
        if (pstCom == '2') {
            valor = 2 * contador;
        }
        if (pstCom == '3') {
            valor = 3 * contador;
        }
        if (pstCom == '4') {
            valor = 4 * contador;
        }
        if (pstCom == '5') {
            valor = 5 * contador;
        }
        if (pstCom == '6') {
            valor = 6 * contador;
        }
        if (pstCom == '7') {
            valor = 7 * contador;
        }
        if (pstCom == '8') {
            valor = 8 * contador;
        }
        if (pstCom == '9') {
            valor = 9 * contador;
        }
        if (pstCom == 'A') {
            valor = 10 * contador;
        }
        if (pstCom == 'B') {
            valor = 11 * contador;
        }
        if (pstCom == 'C') {
            valor = 12 * contador;
        }
        if (pstCom == 'D') {
            valor = 13 * contador;
        }
        if (pstCom == 'E') {
            valor = 14 * contador;
        }
        if (pstCom == 'F') {
            valor = 15 * contador;
        }
        if (pstCom == 'G') {
            valor = 16 * contador;
        }
        if (pstCom == 'H') {
            valor = 17 * contador;
        }
        if (pstCom == 'I') {
            valor = 18 * contador;
        }
        if (pstCom == 'J') {
            valor = 19 * contador;
        }
        if (pstCom == 'K') {
            valor = 20 * contador;
        }
        if (pstCom == 'L') {
            valor = 21 * contador;
        }
        if (pstCom == 'M') {
            valor = 22 * contador;
        }
        if (pstCom == 'N') {
            valor = 23 * contador;
        }
        if (pstCom == 'Ñ') {
            valor = 24 * contador;
        }
        if (pstCom == 'O') {
            valor = 25 * contador;
        }
        if (pstCom == 'P') {
            valor = 26 * contador;
        }
        if (pstCom == 'Q') {
            valor = 27 * contador;
        }
        if (pstCom == 'R') {
            valor = 28 * contador;
        }
        if (pstCom == 'S') {
            valor = 29 * contador;
        }
        if (pstCom == 'T') {
            valor = 30 * contador;
        }
        if (pstCom == 'U') {
            valor = 31 * contador;
        }
        if (pstCom == 'V') {
            valor = 32 * contador;
        }
        if (pstCom == 'W') {
            valor = 33 * contador;
        }
        if (pstCom == 'X') {
            valor = 34 * contador;
        }
        if (pstCom == 'Y') {
            valor = 35 * contador;
        }
        if (pstCom == 'Z') {
            valor = 36 * contador;
        }
        contador = contador - 1;
        contador1 = contador1 + 1;
        sumatoria = sumatoria + valor;
    }
    numVer = sumatoria % 10;
    numVer = Math.abs(10 - numVer);

    if (numVer == 10) {
        numVer = 0;
    }
    if (anio < 2000) {
        pstDigVer = '0' + '' + numVer;
        pstCURP1[10] = '0';
        pstCURP1[11] = numVer;
    }
    if (anio >= 2000) {
        pstDigVer = 'A' + '' + numVer;
        pstCURP1[10] = 'A';
        pstCURP1[11] = numVer;
    }
    pstCURP = pstCURP + pstDigVer;

    //var div_res = document.getElementById('respcurp');
    //document.getElementById("curp").value = pstCURP;

    //alert('si llega');
    //setTimeout(function(){nuevocurp()}, 50);
    var curp_ensambla = "";
    for (var o = 0; o < 12; o++) {
        curp_ensambla += pstCURP1[o] + '-';
    }
    var mensajes = "";
    var error = 1;
    var aniover = 0;




    //document.getElementById("curp").value = pstCURP;
    //alert('si llega');
    //setTimeout(function(){nuevocurp()}, 50);
    //alert(pstCURP);
    // console.log('curp:', pstCURP)

    /* manda a llamar a la funcion que redirecciona a la siguente pagina junto con el tiempo */


    //setTimeout(function(){nuevocurp()}, 50);



    //console.log(pstCURP)
    return pstCURP



} // End if