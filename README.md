# 🌩️ DarkCloud

<div align="center">
  <img src="./public/darkcloud.png" alt="DarkCloud Logo" width="200" />
  <p>Plataforma de gerenciamento de máquinas virtuais na Azure com integração ao Discord</p>
</div>

## 📋 Sobre o Projeto

DarkCloud é uma plataforma que permite a criação e gerenciamento de máquinas virtuais na Azure, com foco em máquinas para jogos e aplicações que necessitam de GPUs. O sistema oferece integração com Discord para autenticação e gerenciamento de usuários, além de processamento de pagamentos via MercadoPago.

## 🚀 Funcionalidades

- **🔐 Autenticação via Discord**: Login e registro de usuários através da API do Discord
- **☁️ Integração com Azure**: Criação e gerenciamento de máquinas virtuais na plataforma Azure
- **💳 Processamento de Pagamentos**: Integração com MercadoPago para processamento de pagamentos
- **👑 Painel Administrativo**: Gerenciamento de usuários, máquinas e pagamentos
- **💬 Webhook Discord**: Notificações automáticas de vendas e eventos no Discord
- **📦 Gerenciamento de Estoque**: Controle de disponibilidade de máquinas virtuais
- **🛠️ Modo de Manutenção**: Sistema de manutenção para atualizações sem interrupção para administradores

## ⚙️ Tecnologias Utilizadas

- **🎨 Frontend**: Next.js, React, TailwindCSS, Radix UI
- **🔌 Backend**: Next.js API Routes, Node.js
- **🗄️ Banco de Dados**: MongoDB (Mongoose)
- **🔑 Autenticação**: NextAuth.js com Discord Provider
- **☁️ Cloud**: Azure (Virtual Machines, Network, Compute)
- **💰 Pagamentos**: MercadoPago, EfiBank (Antigo GerenciaNet)
- **✨ Estilização**: TailwindCSS, Framer Motion

## 🔧 Instalação e Configuração

### Pré-requisitos

- 📦 Node.js (versão 18 ou superior)
- 📦 NPM ou Yarn
- ☁️ Conta na Azure com permissões para criar recursos
- 🎮 Aplicativo Discord registrado para autenticação
- 💰 Conta no MercadoPago para processamento de pagamentos

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/darkcloud.git
cd darkcloud
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

# Discord
DISCORD_CLIENT_ID="sua_client_id_aqui"
DISCORD_CLIENT_SECRET="sua_client_secret_aqui"
DISCORD_BOT_TOKEN="seu_bot_token_aqui"
DISCORD_GUILD_ID="seu_guild_id_aqui"
DISCORD_ROLE_ID="seu_role_id_aqui"
DISCORD_WEBHOOK_URL="sua_webhook_url_aqui"
DISCORD_WEBHOOK_LOGS_URL="sua_webhook_logs_url_aqui"

# MercadoPago
MERCADOPAGO_TOKEN="seu_token_aqui"

# EfiBank (Antigo GerenciaNet)
EFI_CLIENT_ID="seu_client_id_aqui"
EFI_CLIENT_SECRET="seu_client_secret_aqui"
EFI_CERT_PATH="caminho_do_certificado.p12"

# Azure
AZURE_SUBSCRIPTION_ID="sua_subscription_id_aqui"
AZURE_RESOURCE_GROUP_NAME="seu_resource_group_aqui"
AZURE_CLIENT_ID="seu_client_id_aqui"
AZURE_CLIENT_SECRET="seu_client_secret_aqui"
AZURE_TENANT_ID="seu_tenant_id_aqui"
AZURE_MACHINE_USERNAME="seu_username_aqui"
AZURE_MACHINE_PASSWORD="sua_senha_aqui"
AZURE_MACHINE_SNAPSHOT_ID_WIN11="seu_snapshot_id_aqui"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta_aqui"

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
# ou
yarn dev
```

5. Acesse a aplicação em `http://localhost:3000`

## 🚀 Implantação

Para implantar em produção:

```bash
npm run build
npm run start
# ou
yarn build
yarn start
```

## 🔒 Segurança

- 🔐 Nunca compartilhe suas chaves de API ou tokens
- 🛡️ Mantenha suas credenciais da Azure seguras
- 🔧 Utilize o modo de manutenção para atualizações críticas

## 🔧 Modo de Manutenção

O sistema possui um modo de manutenção que pode ser ativado através da API. Quando ativado, apenas administradores podem acessar o sistema, enquanto outros usuários são redirecionados para uma página de manutenção.

Para mais informações sobre o modo de manutenção, consulte o arquivo [README-MAINTENANCE.md](./README-MAINTENANCE.md).

## 📜 Licença

Este projeto está sob a licença [MIT](LICENSE).

## 📞 Suporte

Para suporte, entre em contato com a equipe de desenvolvimento através do Discord ou abra uma issue no repositório do projeto.