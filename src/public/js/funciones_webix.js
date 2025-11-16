webix.ui.datafilter.rowCount = webix.extend({
    refresh: function (master, node, value) {
        node.firstChild.innerHTML = "Total: " + master.count();

    }
}, webix.ui.datafilter.summColumn);

webix.protoUI({
    name: "colorlist",
    defaults: {
        css: "wbx_colorlist",
        select: true,
        scroll: "auto"
    },
    type: {
        // define look of list items
        templateStart: function (obj, common, markers) {
            var start = "<div webix_l_id='" + obj.id + "' class='" + common.classname(obj, common, markers) + "' style='height:" + common.heightSize(obj, common) + ";";
            if (markers && markers.webix_selected)
                start += "background: " + obj.color + " !important; color: " + obj.text_color + " !important;";
            return start + "'>";
        },
        template: function (obj) {
            return "<div class='wbx_colorbar' style='background:" + obj.color + ";'>&nbsp;</div>" + obj.value;
        }
    },
    on_click: {
        webix_list_item: function (e, id) {
            if (this.config.select) {
                if (this.config.select == "multiselect") {
                    if (this.getSelectedId(true).indexOf(id) === -1)
                        this.select(id, true);
                    else
                        this.unselect(id);
                }
                else
                    this.select(id);
            }
        }
    }
}, webix.ui.list);

function mytip(obj, common) {
    var column = common.column.id;
    if (column == "rank") return "Not real";
    return obj[column];
};


function getDtableChecked(id) {
    var checked = [];
    $$(id).data.each(function (obj) {
        if (obj.marcar == 1) checked.push(obj.id);
    });

    return checked;
}


function addViewTabView(view, header, src) {
   view.addView({
        header: header,
        body: {
            view: "iframe", id: webix.uid(), src: src,
            type: {
                height: 60
            }
        },
        close: true
    });
}

function getTab(view, tab) {
    var lnIndex = 0
    for(var i = 0; i < view.getMultiview().getChildViews().length; i ++) {
        if(view.getMultiview().getChildViews()[i].config.id == tab) {
            lnIndex = i;
            break;
        }
    }

    return lnIndex
}

function convertDate(date) {
    //FORMATO dd/mm/YYYY
    
    if (date == '1900-01-01' || date == undefined) return "";
    var parts = date.split("/");
    var lnAnio = parts[2];
    var lnMes = (parts[1] == 1 ? 0 : parts[1] - 1);
    var lnDia = parts[0];

    return new Date(lnAnio, lnMes, lnDia);
}

function convertDate2(date) {
    //FORMATO YYYY-mm-dd
    
    if (date == '1900-01-01' || date == undefined) return "";

    var parts = date.split("-");
    var lnAnio = parts[0];
    var lnMes = (parts[1] == 1 ? 0 : parts[1] - 1);
    var lnDia = parts[2];

    return new Date(lnAnio, lnMes, lnDia);
}


function dateStringFilter(value, filter){
    var format = webix.Date.dateToStr("%d/%m/%Y")
    value = format(value).trim()
    filter = filter.toString().toLowerCase().trim();
    return value.indexOf(filter) >= 0;
}

function convertToDatetime(datetime, tipo = "/") {
    if(datetime === "") return "";

    var parts = datetime.split(tipo);

    if(tipo = "/") {
        var lnAnio = parts[2].substring(0,4);
        var lnMes = parts[1] - 1;
        var lnDia = parts[0];
        var lcTipo = parts[2].substring(parts[2].length - 2, parts[2].length)
        var lnHora = (lcTipo == "AM" ? parts[2].substring(5,7) : 13 + (parts[2].substring(5,7) -1))
        var lnMinutos = parts[2].substring(8,10)
        
        return new Date(lnAnio, lnMes, lnDia, lnHora, lnMinutos);
    } else {
        return ""
    }
    
}

/**
 * Generate a unique string based on two datetimes.
 * This function returns a string.
 */
function sys2015() {
    const base36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sys2015 = '';

    const actualDate = new Date();
    const midNight = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDay(), 0, 0, 0);
    const seconds = (actualDate.getTime() - midNight.getTime()) / 1000;
    let miliseconds = seconds * 1000;
    let secondDate = new Date(actualDate.getFullYear(), 0, 1);
    secondDate.setDate(secondDate.getDate() + 1 + (actualDate.getFullYear() % 100) * 367);
    let days = Math.floor((((secondDate.getTime() - actualDate.getTime())) / (1000 * 3600 * 24)));

    for (let xx = 1; xx <= 6; xx++) {
        sys2015 = base36.substring(Math.abs(Math.floor(miliseconds % 36)), Math.abs(Math.floor(miliseconds % 36)) + 1) + sys2015;
        miliseconds = miliseconds / 36;
    }

    for (xx = 1; xx <= 3; xx++) {
        sys2015 = base36.substring((days % 36), (days % 36) + 1) + sys2015;
        days = Math.floor(days / 36);
    }

    return `_${sys2015}`;
}

function randomColor() {
    let randomHex = Math.floor(Math.random()*12340000).toString(16);
    return "#" + (randomHex.length === 6 ? randomHex : randomHex +  Math.floor(Math.random()*15).toString(16) )
}

function isDarkColor(color) {
    let { r, g, b } = hexToRgb(color.trim());
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) < 155;
}

function hexToRgb(color) {
    const hex = color.substring(1);      // strip #
    const rgb = parseInt(hex, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue

    return { r, g, b };
}

// const openWindow =(title, url, id_toolbar = "toolbarVentanas") =>{
//             var wid = webix.uid();
//             webix.ui({
//                 view: "window", id: wid, fullscreen:true, resize: true,
//                 move: true, left: 0, top: 0, width: 1200, height: 800, 
//                 on:{
//                     onShow:()=>{
//                         $$(wid).config.move = !$$(wid).config.fullscreen;
//                     }
//                 },
//                 head: {
//                     view: "toolbar",
//                     cols: [
//                         { view: "label", label: title },
//                         {
//                             view: "icon", icon: 'mdi mdi-arrange-bring-forward', tooltip:"Abre en una nueva ventana",
//                             click:()=>{
//                                 window.open(url);
//                             }
//                         },
//                         { view: "icon", icon: 'mdi mdi-window-minimize', tooltip:"Minimiza la ventana",
//                             click:()=>{
//                                 $$(wid).hide();
//                                 $$(id_toolbar).show()
//                                 $$(id_toolbar).addView({
//                                     width:200, 
//                                     id:"sub"+wid,
//                                     css:"item_window",
//                                     cols:[
//                                     {
//                                         label:title.substr(0, 15), view:"label", css:{"padding":"0 0 0 10px"},
//                                         click:()=>{ 
//                                             $$(id_toolbar).removeView("sub"+wid)
//                                             $$(wid).show();
//                                         }
//                                     },
//                                     {
//                                         view:"button", type:"icon", icon:"mdi mdi-window-maximize", borderless:true, width:32, 
//                                         click:()=>{ 
//                                             $$(id_toolbar).removeView("sub"+wid)
//                                             $$(wid).show();
//                                         }
//                                     },
//                                     {
//                                         view:"button", type:"icon", icon:"mdi mdi-window-close", borderless:true, width:32, click:()=>{
//                                             $$(wid).close();

//                                             $$(id_toolbar).removeView("sub"+wid);
//                                             hideToolbarWindow()
//                                         }
//                                     }
//                                     ]
//                                 })
//                             } 
//                         },
//                         { view: "icon", icon: 'mdi mdi-fullscreen', tooltip:"Maximiza la ventana",
//                             click:()=>{
//                                 var ventana = $$(wid)
                                
//                               ventana.config.fullscreen = !ventana.config.fullscreen;
//                               ventana.config.move = !ventana.config.fullscreen
//                               ventana.setPosition((ventana.config.fullscreen? 0:50),(ventana.config.fullscreen? 0:50))
//                               ventana.resize();
//                             } 
//                         },
//                         { 
//                             view: "icon", icon: 'mdi mdi-close', tooltip:"Cierra la ventana", 
//                             click: ()=>{
                                
//                                 $$(wid).close(); 
//                                 hideToolbarWindow()
//                             }
//                         }
//                     ]
//                 },
//                 body: {
//                     view: "iframe",
//                     src: url
//                 }
//             }).show();
//         }

//         const hideToolbarWindow = (id_toolbar)=>{
//             if($$(id_toolbar).getChildViews().length === 0){
//                 $$(id_toolbar).hide();
//             }
//         }