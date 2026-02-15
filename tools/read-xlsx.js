const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../public/KISIP TOOL A.xlsx');
const wb = XLSX.readFile(filePath);

console.log('=== KISIP TOOL A.xlsx ===\n');
console.log('Sheet names:', wb.SheetNames.join(', '));

wb.SheetNames.forEach((name) => {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('\n--- Sheet:', name, '---');
  console.log('Rows:', data.length);
  data.slice(0, 80).forEach((row, i) => {
    console.log((i + 1).toString().padStart(3), '|', row.map(c => String(c).slice(0, 40)).join(' | '));
  });
  if (data.length > 80) console.log('... (' + (data.length - 80) + ' more rows)');
});
