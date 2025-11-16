webix.i18n.locales["es-ES"] = { //"es-ES" - the locale name, the same as the file name
    groupDelimiter: " ", //a mark that divides numbers with many digits into groups
    groupSize: 3, //the number of digits in a group
    decimalDelimeter: ",", //the decimal delimiter
    decimalSize: 2, //the number of digits after the decimal mark

    parseFormat: "%d/%m/%Y",
    parseFormatStr: "%d/%m/%Y", //applied to columns with 'format:webix.i18n.dateFormatStr'
    dateFormat: "%d/%m/%Y", //applied to columns with 'format:webix.i18n.dateFormatStr'
    timeFormat: "%H:%i", //applied to columns with 'format:webix.i18n.dateFormatStr'
    longDateFormat: "%d %F %Y", //applied to columns with 'format:webix.i18n.longDateFormatStr'
    fullDateFormat: "%d.%m.%Y %H:%i", //applied to cols with 'format:webix.i18n.fullDateFormatStr'

    price: "$ {obj}", //EUR - currency name. Applied to cols with 'format:webix.i18n.priceFormat'
    calendar: {
        monthFull: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
            "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ],
        monthShort: ["En", "Feb", "Mar", "Abr", "Mayo", "Jun", "Jul", "Ago", "Sep", "Oct",
            "Nov", "Dic"
        ],
        dayFull: ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"],
        dayShort: ["Dom", "Lun", "Mar", "Mier", "Jue", "Vier", "Sab"],
        hours: "Horas",
        minutes: "Minutos",
        done: "Listo",
        clear: "Limpiar",
        today: "Hoy"

    },
    dataExport: {
        page: "Página",
        of: "de"
    },
    PDFviewer: {
        of: "de",
        automaticZoom: "Zoom automático",
        actualSize: "Tamaño real",
        pageFit: "Tamaño de página",
        pageWidth: "Ancho de página",
        pageHeight: "Altura de la página"
    },
    aria: {
        calendar: "Calendario",
        increaseValue: "Aumentar el valor",
        decreaseValue: "Disminuye el valor",
        navMonth: ["Mes anterior", "Próximo mes"],
        navYear: ["Año anterior", "Próximo año"],
        navDecade: ["Década anterior", "Próxima década"],
        dateFormat: "%d %F %Y",
        monthFormat: "%F %Y",
        yearFormat: "%Y",
        hourFormat: "Horas: %G",
        minuteFormat: "Minutos: %i",
        removeItem: "Retire el elemento",
        pages: ["Primera página", "Pagina anterior", "Siguiente página", "Ultima página"],
        page: "Página",
        headermenu: "Menú de títulos",
        openGroup: "Grupo de columnas abiertas",
        closeGroup: "Primer grupo de columnas",
        closeTab: "Cerrar tab",
        showTabs: "Mostrar más tabs",
        resetTreeMap: "Volver a la vista original",
        navTreeMap: "Elevar a mismo nivel",
        nextTab: "Siguiente tab",
        prevTab: "Tab anterior",
        multitextSection: "Añadir elemento",
        multitextextraSection: "Retire el elemento",
        showChart: "Espectáculo chart",
        hideChart: "Esconder chart",
        resizeChart: "Cambiar el tamaño el chart"

    },
    richtext: {
        underline: "Subrayar",
        bold: "Negrita",
        italic: "Itálico"
    },
    combo: {
        select: "Seleccionar",
        selectAll: "Seleccionar todo",
        unselectAll: "Deselecciona todo"
    },
    message: {
        ok: "OK",
        cancel: "Cancelar"
    }
};
webix.i18n.setLocale("es-ES");