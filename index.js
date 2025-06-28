// Este arquivo é o ponto de entrada para a Square Cloud
const { exec } = require('child_process');
const path = require('path');

// Verifica se estamos em ambiente de produção
const isProd = process.env.NODE_ENV === 'production';

// Caminho para o diretório do projeto
const projectDir = __dirname;

console.log('Iniciando o aplicativo DarkCloud...');
console.log('Diretório do projeto:', projectDir);

// Função para executar comandos
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${command}`);
    
    const childProcess = exec(command, { cwd: projectDir });
    
    childProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    childProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código de saída ${code}`));
      }
    });
  });
}

async function startApp() {
  try {
    // Em produção, primeiro fazemos o build
    if (isProd) {
      console.log('Ambiente de produção detectado. Construindo aplicativo...');
      await runCommand('npm run build');
    }
    
    // Inicia o servidor Next.js
    console.log('Iniciando o servidor Next.js...');
    await runCommand('npm run start');
  } catch (error) {
    console.error('Erro ao iniciar o aplicativo:', error);
    process.exit(1);
  }
}

// Inicia o aplicativo
startApp();
