import fs from 'fs';
import path from 'path';

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // text-white -> text-slate-50
  content = content.replace(/\btext-white\b/g, 'text-slate-50');

  // headers: tracking-tighter leading-tight
  content = content.replace(/<(h[1-3])\b([^>]*?)className=(["'])(.*?)\3/g, (match, tag, attr, q, cls) => {
      let newCls = cls;
      if (!newCls.includes('tracking-tighter')) newCls += ' tracking-tighter';
      if (!newCls.includes('leading-tight')) newCls += ' leading-tight';
      newCls = newCls.replace(/\b(tracking-tight|tracking-widest|leading-none|leading-snug)\b/g, '').replace(/\s+/g, ' ');
      return `<${tag}${attr}className=${q}${newCls.trim()}${q}`;
  });

  // For metadata labels: if font-black and tracking-[0.2em] or tracking-widest or uppercase
  content = content.replace(/className=(["'])(.*?)\1/g, (match, q, cls) => {
      let newCls = cls;
      if (newCls.includes('font-black') && (newCls.includes('tracking-widest') || newCls.includes('tracking-[0.2em]') || newCls.includes('uppercase'))) {
         newCls = newCls.replace(/\bfont-black\b/g, 'font-semibold');
      }
      return `className=${q}${newCls}${q}`;
  });

  // Any remaining font-black -> font-bold
  content = content.replace(/\bfont-black\b/g, 'font-bold');

  // leading-relaxed for paragraph text
  content = content.replace(/<p\b([^>]*?)className=(["'])(.*?)\2/g, (match, attr, q, cls) => {
      let newCls = cls;
      if (!newCls.includes('leading-relaxed') && !newCls.includes('leading-tight') && !newCls.includes('leading-none')) {
          newCls += ' leading-relaxed';
      }
      return `<p${attr}className=${q}${newCls.trim()}${q}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
