import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const viteTagPath = join(process.cwd(), 'snippets', 'vite-tag.liquid');

try {
  let content = readFileSync(viteTagPath, 'utf-8');
  
  // Remover | split: '?' | first de todos os lugares
  content = content.replace(/\|\s*split:\s*'\?'\s*\|\s*first/g, '');
  
  // Remover preload: preload_stylesheet problemático
  content = content.replace(/stylesheet_tag:\s*preload:\s*preload_stylesheet/g, 'stylesheet_tag');
  
  writeFileSync(viteTagPath, content, 'utf-8');
  console.log('✅ vite-tag.liquid corrigido com sucesso!');
} catch (error) {
  console.error('❌ Erro ao corrigir vite-tag.liquid:', error.message);
  process.exit(1);
}
