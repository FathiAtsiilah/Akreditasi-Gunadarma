const ExcelJS = require("exceljs");
const path = require("path");

class ExcelService {
   async convertExcelToJson(filepath) {
      try {
         const filePath = path.join(__dirname, filepath);
         const workbook = new ExcelJS.Workbook();
         await workbook.xlsx.readFile(filePath);
         const worksheet = workbook.worksheets[0];
         const jsonData = [];

         worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowObject = {};
            row.eachCell((cell, colNumber) => {
               const header = worksheet.getRow(1).getCell(colNumber).value;
               rowObject[header] = cell.value;
            });
            jsonData.push(rowObject);
         });
         return jsonData;
      } catch (error) {
         console.error("Failed to process the request", error);
         throw new Error("Failed to process the request");
      }
   }

   transformData(input) {
      return input.map((item) => {
         const customData = {};
         for (const key of Object.keys(item)) {
            if (key.startsWith("data_[custom]_")) {
               const pathArr = key.replace("data_[custom]_", "").split("_");
               let current = customData;
               while (pathArr.length > 1) {
                  const part = pathArr.shift();
                  if (!part) continue;
                  const isArray = part.match(/\[(\d+)\]/);
                  if (isArray) {
                     const index = parseInt(isArray[1], 10);
                     const arrayKey = part.replace(/\[.*?\]/, "");

                     if (!current[arrayKey]) current[arrayKey] = [];
                     if (!current[arrayKey][index]) current[arrayKey][index] = {};

                     current = current[arrayKey][index];
                  } else {
                     if (!current[part]) current[part] = {};
                     current = current[part];
                  }
               }
               if (pathArr[0]) {
                  let value = item[key];
                  if (value === true) value = true;
                  else if (value === false) value = false;
                  else value = isNaN(value) ? value : Number(value);

                  current[pathArr[0]] = value;
               }
            }
         }
         if (Object.keys(customData).length === 1) {
            const key = Object.keys(customData)[0];
            customData[key] = Array.isArray(customData[key]) ? customData[key] : [customData[key]];
         }
         const cleanedItem = Object.fromEntries(
            Object.entries(item).filter(([key]) => !key.startsWith("data_[custom]_"))
         );
         if (customData["choices"]) {
            customData["choices"][""].map((choice) => {
               if (!choice.image) {
                  choice.image = null;
               }
            });
            customData["choices"] = customData["choices"][""];
         }
         if (customData["solutions"]) {
            customData["solutions"] = customData["solutions"][""];
         }
         return {
            ...cleanedItem,
            data: customData,
         };
      });
   }
}

module.exports = new ExcelService();
