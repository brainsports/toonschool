const fs = require('fs');
let code = fs.readFileSync('src/modules/student/pages/StudentMyPage.tsx', 'utf8');

code = code.replace(
  "import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'",
  "import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'\nimport StudentPageShell from '../components/layout/StudentPageShell'"
);

const startIdx = code.indexOf('  return (\n    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-800">');
const endIdx = code.indexOf('{/* Left Column (8/12) */}');
if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `  return (\n    <StudentPageShell bgVariant="pastel" maxWidth="2xl">\n      <div className="py-6 px-4 md:px-8 max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">\n          \n          `;
  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
}

const endStr = `      </main>\n\n    </div>\n  )\n}`;
const newEndStr = `      </div>\n    </StudentPageShell>\n  )\n}`;
code = code.replace(endStr, newEndStr);

fs.writeFileSync('src/modules/student/pages/StudentMyPage.tsx', code);
console.log('Done');
