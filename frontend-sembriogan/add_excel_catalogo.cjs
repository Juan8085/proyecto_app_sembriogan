const fs = require('fs');
let c = fs.readFileSync('src/components/AdminCatalogo.jsx', 'utf8');

if (!c.includes('import * as XLSX')) {
    c = c.replace(
        "import { useState, useEffect } from 'react';",
        "import { useState, useEffect, useRef } from 'react';\nimport * as XLSX from 'xlsx';"
    );
    
    // Add the functions before `return (`
    const excelFunctions = `
  const fileInputRef = useRef(null);

  const descargarPlantilla = () => {
    const ws = XLSX.utils.json_to_sheet([{
      tipo: "Semen Angus Rojo",
      descripcion: "Pajilla importada de alta genética",
      costo: 150000,
      esServicio: "NO",
      stock: 50,
      imagen: ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo");
    XLSX.writeFile(wb, "Plantilla_Catalogo_Sembriogan.xlsx");
  };

  const handleImportarExcel = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const res = await fetch('http://localhost:3000/api/catalogo/masivo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if(json.success) {
           alert(json.mensaje);
           cargarCatalogo();
        } else {
           alert("Error: " + json.mensaje);
        }
      } catch(err) {
         alert("Error procesando el archivo Excel");
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return`;
  
    c = c.replace("if (loading) return", excelFunctions);
    
    // Add the buttons to the UI
    const uiButtons = `<div className="flex gap-2">
            <button onClick={descargarPlantilla} className="bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-xl hover:bg-emerald-200 transition text-sm">
              📥 Descargar Plantilla
            </button>
            <button onClick={() => fileInputRef.current.click()} className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl hover:bg-blue-200 transition text-sm">
              📤 Importar Masivo
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportarExcel} accept=".xlsx, .xls" className="hidden" />
          </div>
        </div>`;
        
    c = c.replace(
        '<h2 className="text-xl font-bold text-gray-800">Inventario Actual</h2>\n        </div>',
        '<h2 className="text-xl font-bold text-gray-800">Inventario Actual</h2>\n          ' + uiButtons
    );
    
    fs.writeFileSync('src/components/AdminCatalogo.jsx', c);
}
