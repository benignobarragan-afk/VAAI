const path = require("path")
const pool = require(path.join(__dirname, "..", "db"))
const crypto = require('crypto')
const qrcode = require('qrcode')

const gene_cons = async (lcSQL, parameters) => {

    let rows = {}

    try {
            conn = await pool.getConnection();            
            // 3. Ejecutar la consulta

            rows = await conn.query(lcSQL, (!parameters?[]:parameters));
            //console.log(rows);

        } catch (err) {
            //console.log(err)
            //res.json({err})
            throw err;
        } finally {
            // 4. Devolver la conexión al pool (¡Muy Importante!)
            if (conn) conn.release(); 
        }

        return rows;

}

const construirClausulaBusqueda = (lcDepe, lnTipo) => {
    
    // Equivalente a IF !EMPTY(lcDepe)
    if (!lcDepe || lcDepe.trim() === '') {
        // Equivalente a Response.write("[]") y return
        return false; 
    }

    let lcBusca = '';
    
    // Equivalente a lcCadena = lcDepe + " "
    // Añadimos un espacio al final para asegurar que la última palabra sea procesada en el bucle
    let lcCadena = lcDepe.trim() + ' '; 

    // 💡 DETERMINAR COLUMNA CLAVE (Equivalente a IIF(lnTipo=2,"descrip","dependen"))
    const columnaPrincipal = (lnTipo === '2' ? 'descrip' : (lnTipo === '3' ? 'o.descrip' : (lnTipo === '4' ? 'o.oficio' : 'dependen')));
    
    // Equivalente a DO WHILE !EMPTY(lcCadena)
    while (lcCadena.trim() !== '') {
        
        // 1. ENCONTRAR EL ESPACIO (Equivalente a AT(" ", lcCadena))
        const posEspacio = lcCadena.indexOf(' ');
        
        let palabra;
        
        if (posEspacio === -1) {
            // Esto no debería suceder si la última palabra tiene un espacio final.
            // Si sucede, tomamos el resto de la cadena.
            palabra = lcCadena.trim();
        } else {
            // 2. EXTRAER PALABRA (Equivalente a LEFT(lcCadena, AT(" ", lcCadena)-1))
            palabra = lcCadena.substring(0, posEspacio);
        }
        
        // Solo procesamos si hay una palabra válida
        if (palabra.length > 0) {
            
            // Equivalente a IF !EMPTY(lcBusca) ... lcBusca = lcBusca + " AND " ENDIF
            if (lcBusca.length > 0) {
                lcBusca += " AND ";
            }

            // 3. CONSTRUCCIÓN DE LA CLÁUSULA SQL (Usando Plantillas Literales)
            // Traduce: lcBusca = lcBusca + "concat(COLUMNA,ifnull(clave,'')) like '%" + PALABRA + "%'"
            lcBusca += `CONCAT(${columnaPrincipal}, IFNULL(clave,'')) LIKE '%${palabra}%'`;
        }

        // 4. PREPARAR PARA SIGUIENTE CICLO
        // Equivalente a lcCadena = ALLTRIM(SUBSTR(lcCadena, AT(" ", lcCadena)+1)) + " "
        // Eliminamos la palabra procesada y los espacios subsiguientes
        lcCadena = lcCadena.substring(posEspacio + 1).trimStart() + ' ';
    }

    // Devolver la cadena de búsqueda SQL
    return lcBusca;
}

const cade_busc = (lcCampo, lcCade_busq) => {
    
    // Equivalente a IF !EMPTY(lcDepe)
    if ((!lcCampo || lcCampo.trim() === '') || (!lcCade_busq || lcCade_busq.trim() === '')) {
        // Equivalente a Response.write("[]") y return
        return false; 
    }
    
    let lcBusca = ''
    let lcCadena = lcCade_busq.trim() + ' '; 

    while (lcCadena.trim() !== '') {
        
        // 1. ENCONTRAR EL ESPACIO (Equivalente a AT(" ", lcCadena))
        const posEspacio = lcCadena.indexOf(' ');
        
        let palabra;
        
        if (posEspacio === -1) {
            // Esto no debería suceder si la última palabra tiene un espacio final.
            // Si sucede, tomamos el resto de la cadena.
            palabra = lcCadena.trim();
        } else {
            // 2. EXTRAER PALABRA (Equivalente a LEFT(lcCadena, AT(" ", lcCadena)-1))
            palabra = lcCadena.substring(0, posEspacio);
        }
        
        // Solo procesamos si hay una palabra válida
        if (palabra.length > 0) {
            
            // Equivalente a IF !EMPTY(lcBusca) ... lcBusca = lcBusca + " AND " ENDIF
            if (lcBusca.length > 0) {
                lcBusca += " AND ";
            }

            lcBusca += `CONCAT(${lcCampo}) LIKE '%${palabra}%'`;
        }
        lcCadena = lcCadena.substring(posEspacio + 1).trimStart() + ' ';
    }

    // Devolver la cadena de búsqueda SQL
    return lcBusca;
}


const gene_id_11 = () => {

    // 1. Generar 8 bytes de datos aleatorios (64 bits)
    // Usamos 8 bytes porque 8 bytes * 8 bits/byte = 64 bits. 
    // Al codificar 64 bits en Base64, obtenemos ~11 caracteres.
    const buffer = crypto.randomBytes(8); 

    // 2. Codificar el buffer binario en Base64 URL-Safe
    //    'base64url' es mejor porque reemplaza los caracteres '+' y '/' 
    //    (que pueden causar problemas en URLs) por '-' y '_'.
    let base64 = buffer.toString('base64url');

    // 3. Limpiar y acortar a 11 caracteres (quitando el posible relleno '=')
    // El relleno '=' se usa al final de Base64, lo quitamos para asegurar 11 caracteres.
    base64 = base64.replace(/=/g, ''); 

    // Devolver los primeros 11 caracteres
    return base64.substring(0, 11); 
}

// Exporta la función (o un objeto con varias funciones)

const generarQrBase64 = async (texto) => {
    try {
        // qrcode.toDataURL genera la imagen del QR y la codifica en Base64
        const qrCodeDataUrl = await qrcode.toDataURL(texto, {
            // Opciones de estilo
            color: {
                dark: '#000000', // Color de los puntos (negro)
                light: '#ffffff' // Color de fondo (blanco)
            },
            //width: 256 // Tamaño en píxeles
            width: 128
        });
        return qrCodeDataUrl;

    } catch (err) {
        console.error("Error al generar el código QR:", err);
        throw new Error("Fallo en la generación del código QR.");
    }
}

const gene_gogl_doc = async (urlScript, loJson) => { 

    try {
        // 1. Convertir el objeto JavaScript a la cadena JSON requerida
        const lcJson = JSON.stringify(loJson);

        // 2. Realizar la solicitud POST asíncrona
        const response = await fetch(urlScript, {
            method: 'POST',
            // 3. Establecer la cabecera Content-Type
            headers: {
                'Content-Type': 'application/json' 
            },
            // 4. Adjuntar la cadena JSON al cuerpo de la solicitud
            body: lcJson 
        });

        //console.log(response);
        // Verificar si la respuesta fue exitosa (código 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fallo en la solicitud: ${response.status} ${response.statusText}. Respuesta: ${errorText}`);
        }

        // 5. Devolver la respuesta parseada como JSON
        //const resultadoJson = await response.json();
        //return resultadoJson;
        //console.log(response.text())
        const textoCompleto = await response.text();
        //console.log(textoCompleto)
        const lnfirst = textoCompleto.indexOf("*");
        const lnSecond = textoCompleto.indexOf("*", lnfirst+1);
        let googleDoc = ''
        if (lnfirst > 0 && lnfirst > 0){
            googleDoc = textoCompleto.substring(lnfirst+1, lnSecond);
        }
        
        return googleDoc;

    } catch (error) {
        console.error("Error al enviar datos al script de Google:", error.message);
        throw error;
    }
}

const construirClausulaBusquedaP = (lcDepe, lnTipo) => {
    
    // Equivalente a IF !EMPTY(lcDepe)
    if (!lcDepe || lcDepe.trim() === '') {
        // Equivalente a Response.write("[]") y return
        return "[]"; 
    }

    let lcBusca = '';
    
    // Equivalente a lcCadena = lcDepe + " "
    // Añadimos un espacio al final para asegurar que la última palabra sea procesada en el bucle
    let lcCadena = lcDepe.trim() + ' '; 

    console.log(lnTipo)

    switch (lnTipo) {
        case '10':
            lcCampo = " max(id_doficio_pk) as id, diri_nomb as value, diri_carg as cargo"
            columnaPrincipal = "CONCAT(TRIM(diri_nomb), IFNULL(diri_carg,''))"
            lcTabla = "gen_doficio"
            break;
        case '11':
            lcCampo = " id, nombre as value, cargo"
            columnaPrincipal = "CONCAT(TRIM(nombre), IFNULL(cargo,''))"
            lcTabla = "gen_op_cargo"
            break;

        default:
            lcCampo = "codigo as id, CONCAT('(',CAST(codigo AS CHAR),') ', IFNULL(apepat, ''), ' ', IFNULL(apemat, ''), ' ', IFNULL(nombre, '')) as value"
            columnaPrincipal = "CONCAT(CAST(codigo AS CHAR), IFNULL(apepat, ''), IFNULL(apemat, ''), IFNULL(nombre, ''))"
            lcTabla = "gen_personas"
            break
        }

    // Equivalente a DO WHILE !EMPTY(lcCadena)
    while (lcCadena.trim() !== '') {
        
        // 1. ENCONTRAR EL ESPACIO (Equivalente a AT(" ", lcCadena))
        const posEspacio = lcCadena.indexOf(' ');
        
        let palabra;
        
        if (posEspacio === -1) {
            // Esto no debería suceder si la última palabra tiene un espacio final.
            // Si sucede, tomamos el resto de la cadena.
            palabra = lcCadena.trim();
        } else {
            // 2. EXTRAER PALABRA (Equivalente a LEFT(lcCadena, AT(" ", lcCadena)-1))
            palabra = lcCadena.substring(0, posEspacio);
        }
        
        // Solo procesamos si hay una palabra válida
        if (palabra.length > 0) {
            
            // Equivalente a IF !EMPTY(lcBusca) ... lcBusca = lcBusca + " AND " ENDIF
            if (lcBusca.length > 0) {
                lcBusca += " AND ";
            }

            // 3. CONSTRUCCIÓN DE LA CLÁUSULA SQL (Usando Plantillas Literales)
            // Traduce: lcBusca = lcBusca + "concat(COLUMNA,ifnull(clave,'')) like '%" + PALABRA + "%'"
            lcBusca += `${columnaPrincipal} LIKE '%${palabra}%'`;
        }

        // 4. PREPARAR PARA SIGUIENTE CICLO
        // Equivalente a lcCadena = ALLTRIM(SUBSTR(lcCadena, AT(" ", lcCadena)+1)) + " "
        // Eliminamos la palabra procesada y los espacios subsiguientes
        lcCadena = lcCadena.substring(posEspacio + 1).trimStart() + ' ';
    }

    // Devolver la cadena de búsqueda SQL
    return `SELECT ${lcCampo} FROM ${lcTabla} WHERE ${lcBusca} ${(lnTipo == 10 ? 'GROUP BY 2,3' : '')} LIMIT 20`;
}

const BuscaOficio = (lcDepe) => {
    
    // Equivalente a IF !EMPTY(lcDepe)
    if (!lcDepe || lcDepe.trim() === '') {
        // Equivalente a Response.write("[]") y return
        return "[]"; 
    }

    let lcBusca = '';
    
    // Equivalente a lcCadena = lcDepe + " "
    // Añadimos un espacio al final para asegurar que la última palabra sea procesada en el bucle
    let lcCadena = lcDepe.trim() + ' '; 

    columnaPrincipal = "CONCAT(o.descrip, CAST(o.nume_cont AS CHAR))"

    // Equivalente a DO WHILE !EMPTY(lcCadena)
    while (lcCadena.trim() !== '') {
        
        // 1. ENCONTRAR EL ESPACIO (Equivalente a AT(" ", lcCadena))
        const posEspacio = lcCadena.indexOf(' ');
        
        let palabra;
        
        if (posEspacio === -1) {
            // Esto no debería suceder si la última palabra tiene un espacio final.
            // Si sucede, tomamos el resto de la cadena.
            palabra = lcCadena.trim();
        } else {
            // 2. EXTRAER PALABRA (Equivalente a LEFT(lcCadena, AT(" ", lcCadena)-1))
            palabra = lcCadena.substring(0, posEspacio);
        }
        
        // Solo procesamos si hay una palabra válida
        if (palabra.length > 0) {
            
            // Equivalente a IF !EMPTY(lcBusca) ... lcBusca = lcBusca + " AND " ENDIF
            if (lcBusca.length > 0) {
                lcBusca += " AND ";
            }

            // 3. CONSTRUCCIÓN DE LA CLÁUSULA SQL (Usando Plantillas Literales)
            // Traduce: lcBusca = lcBusca + "concat(COLUMNA,ifnull(clave,'')) like '%" + PALABRA + "%'"
            lcBusca += `${columnaPrincipal} LIKE '%${palabra}%'`;
        }

        // 4. PREPARAR PARA SIGUIENTE CICLO
        // Equivalente a lcCadena = ALLTRIM(SUBSTR(lcCadena, AT(" ", lcCadena)+1)) + " "
        // Eliminamos la palabra procesada y los espacios subsiguientes
        lcCadena = lcCadena.substring(posEspacio + 1).trimStart() + ' ';
    }

    // Devolver la cadena de búsqueda SQL
    return `SELECT ${lcCampo} FROM ${lcTabla} WHERE ${lcBusca} LIMIT 20`;
}

const gene_gogl_plan = async (urlScript, loJson) => { 

    try {
        // 1. Convertir el objeto JavaScript a la cadena JSON requerida
        const lcJson = JSON.stringify(loJson);

        // 2. Realizar la solicitud POST asíncrona
        const response = await fetch(urlScript, {
            method: 'POST',
            // 3. Establecer la cabecera Content-Type
            headers: {
                'Content-Type': 'application/json' 
            },
            // 4. Adjuntar la cadena JSON al cuerpo de la solicitud
            body: lcJson 
        });

        //console.log(response);
        // Verificar si la respuesta fue exitosa (código 200-299)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fallo en la solicitud: ${response.status} ${response.statusText}. Respuesta: ${errorText}`);
        }

        // 5. Devolver la respuesta parseada como JSON
        //const resultadoJson = await response.json();
        //return resultadoJson;
        //console.log(response.text())
        const textoCompleto = await response.text();
        //console.log(textoCompleto)
        const lnfirst = textoCompleto.indexOf("*");
        const lnSecond = textoCompleto.indexOf("*", lnfirst+1);
        let googleDoc = ''
        if (lnfirst > 0 && lnfirst > 0){
            googleDoc = textoCompleto.substring(lnfirst+1, lnSecond);
        }
        
        return googleDoc;

    } catch (error) {
        console.error("Error al enviar datos al script de Google:", error.message);
        throw error;
    }
}

module.exports = {
    construirClausulaBusqueda,
    gene_cons,
    gene_id_11,
    generarQrBase64,
    gene_gogl_doc,
    construirClausulaBusquedaP,
    BuscaOficio,
    gene_gogl_plan,
    cade_busc

}
