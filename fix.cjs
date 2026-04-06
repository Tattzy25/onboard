const fs = require('fs');
const path = require('path');

const dir = './components/ui';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    let original = content;
    content = content.replace(/"\.\.\/\.\.\/lib\/utils"/g, '"@/src/lib/utils"');
    content = content.replace(/"@\/lib\/utils"/g, '"@/src/lib/utils"');
    
    if (content !== original) {
      fs.writeFileSync(p, content);
      console.log('Fixed', p);
    }
  }
});
