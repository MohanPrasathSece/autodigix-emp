const fs = require('fs');
const path = require('path');
const dirs = ['src/admin/views', 'src/employee/views'];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('@tanstack/react-router')) {
        content = content.replace(/import \{ createFileRoute \} from "@tanstack\/react-router";\r?\n?/g, '');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Cleaned ' + fullPath);
      }
    }
  }
}

dirs.forEach(processDir);
