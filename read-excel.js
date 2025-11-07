const XLSX = require('xlsx');

const workbook = XLSX.readFile('1762256587515_templateDumpReport.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Headers:', data[0]);
console.log('\nFirst Entry (Row 2):');
console.log(data[1]);
console.log('\nSecond Entry (Row 3):');
console.log(data[2]);
