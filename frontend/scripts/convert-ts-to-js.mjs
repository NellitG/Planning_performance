import fs from 'fs/promises';
import path from 'path';
import ts from 'typescript';

const root = process.cwd();
const exts = ['.ts', '.tsx'];
const skipDirs = new Set(['node_modules', '.git', '.vscode', '.husky', '.idea']);
const files = [];

async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      await walk(path.join(dir, entry.name));
    } else {
      const ext = path.extname(entry.name);
      if (exts.includes(ext)) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
}

await walk(root);
for (const file of files) {
  const source = await fs.readFile(file, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      removeComments: false,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
      esModuleInterop: true,
    },
    fileName: file,
  });
  const ext = path.extname(file);
  const outFile = file.slice(0, -ext.length) + (ext === '.tsx' ? '.jsx' : '.js');
  await fs.writeFile(outFile, result.outputText, 'utf8');
  await fs.unlink(file);
  console.log('converted', file, '->', outFile);
}
