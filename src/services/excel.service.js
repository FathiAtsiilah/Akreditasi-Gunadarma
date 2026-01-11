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

   async exportAccreditationsToExcel(accreditations) {
      try {
         const workbook = new ExcelJS.Workbook();
         const worksheet = workbook.addWorksheet("Data Akreditasi");

         // Set column headers
         worksheet.columns = [
            { header: "No", key: "no", width: 5 },
            { header: "Kode", key: "code", width: 20 },
            { header: "Program Studi", key: "major_name", width: 35 },
            { header: "Jenjang", key: "level", width: 12 },
            { header: "Fakultas", key: "faculty_name", width: 30 },
            { header: "Peringkat", key: "rank", width: 15 },
            { header: "Tanggal Berlaku", key: "year", width: 15 },
            { header: "Tanggal Berakhir", key: "expired_on", width: 15 },
            { header: "Lembaga", key: "institution_name", width: 25 },
            { header: "Tipe Lembaga", key: "institution_type", width: 15 },
            { header: "Status", key: "active", width: 12 },
         ];

         // Style header row
         worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
         worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
         };
         worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

         // Add data rows
         accreditations.forEach((acc, index) => {
            const row = worksheet.addRow({
               no: index + 1,
               code: acc.code || "-",
               major_name: acc.major?.name || "-",
               level: acc.major?.level || "-",
               faculty_name: acc.major?.faculty?.name || "-",
               rank: acc.rank || "-",
               year: acc.year ? new Date(acc.year).toLocaleDateString("id-ID") : "-",
               expired_on: acc.expired_on ? new Date(acc.expired_on).toLocaleDateString("id-ID") : "-",
               institution_name: acc.institution?.name || "-",
               institution_type: acc.institution?.type || "-",
               active: acc.active ? "Aktif" : "Tidak Aktif",
            });

            // Alternate row colors
            if (index % 2 === 0) {
               row.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFF2F2F2" },
               };
            }

            // Center alignment for specific columns
            row.getCell("no").alignment = { horizontal: "center" };
            row.getCell("level").alignment = { horizontal: "center" };
            row.getCell("rank").alignment = { horizontal: "center" };
            row.getCell("year").alignment = { horizontal: "center" };
            row.getCell("expired_on").alignment = { horizontal: "center" };
            row.getCell("institution_type").alignment = { horizontal: "center" };
            row.getCell("active").alignment = { horizontal: "center" };
         });

         // Add borders to all cells
         worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
               cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
               };
            });
         });

         return workbook;
      } catch (error) {
         console.error("Failed to export accreditations to Excel:", error);
         throw new Error("Failed to export accreditations to Excel");
      }
   }
}

module.exports = new ExcelService();
