const { writeFileSync } = require('fs');
const { resolve } = require('path');

const url = (process.env.SUPABASE_URL || '').trim();
const key = (process.env.SUPABASE_KEY || '').trim();

if (!url || !key) {
  console.error('❌ Defina SUPABASE_URL e SUPABASE_KEY (secrets do GitHub ou variáveis locais).');
  process.exit(1);
}

if (!/^https?:\/\//i.test(url)) {
  console.error('❌ SUPABASE_URL deve começar com https:// (ex: https://xxxxx.supabase.co)');
  console.error('   Valor recebido:', url);
  process.exit(1);
}

const content = `export const environment = {
  production: true,
  supabaseUrl: ${JSON.stringify(url)},
  supabaseKey: ${JSON.stringify(key)},
};
`;

const target = resolve(__dirname, '../src/environments/environment.prod.ts');
writeFileSync(target, content, 'utf8');
console.log('✓ environment.prod.ts gerado para produção');
