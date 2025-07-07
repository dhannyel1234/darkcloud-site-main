# 🔧 Configuração do OpenPix - Solução para QR Code

## ❌ Problema Identificado

O QR code não está sendo gerado para os planos Alfa, Omega e Beta porque:

1. **Falta de configuração das variáveis de ambiente**
2. **Dados do QR code não estavam sendo salvos no estado**
3. **Autenticação incorreta com a API OpenPix**

## ✅ Soluções Implementadas

### 1. Correção na Função handleBuyPlan
- ✅ Adicionado salvamento dos dados do QR code no estado `qrData`
- ✅ Agora o QR code é exibido corretamente após a criação da cobrança

### 2. Correção na Autenticação OpenPix
- ✅ Corrigida a função `criarCobrancaOpenPix` em `src/lib/openpix.ts`
- ✅ Corrigida a API `/api/openpix/create.ts`
- ✅ Agora usa o formato correto de autenticação: `Basic {token}`

## 🔧 Configuração Necessária

### Passo 1: Criar arquivo .env.local
Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# OpenPix Configuration
# IMPORTANTE: Use o AppID completo da OpenPix

# Opção 1: OPENPIX_API_KEY (recomendado)
OPENPIX_API_KEY=Basic Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0X0pHZnJ1bW1zVWhxbEpJZUMrUy9vL3l2S1hUVmhqQk5rYTlCVXFldXRQZDg9

# Opção 2: OPENPIX_APP_ID (legacy)
OPENPIX_APP_ID=Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0X0pHZnJ1bW1zVWhxbEpJZUMrUy9vL3l2S1hUVmhqQk5rYTlCVXFldXRQZDg9
```

### Passo 2: Obter o AppID Correto da OpenPix

1. **Acesse o painel da OpenPix**: [https://app.openpix.com.br](https://app.openpix.com.br)
2. **Faça login** na sua conta
3. **Vá em "Configurações" > "API"**
4. **Copie o AppID completo** (não apenas o Client ID)

O AppID deve ter este formato:
```
Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
```

### Passo 3: Codificar o AppID em Base64

1. **Acesse**: [https://www.base64encode.org](https://www.base64encode.org)
2. **Cole o AppID completo** no campo de entrada
3. **Clique em "Encode"**
4. **Copie o resultado** (será algo como: `Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0X0pHZnJ1bW1zVWhxbEpJZUMrUy9vL3l2S1hUVmhqQk5rYTlCVXFldXRQZDg9)

### Passo 4: Atualizar o .env.local

Substitua o token no arquivo `.env.local` pelo seu token real:

```env
OPENPIX_API_KEY=Basic SEU_TOKEN_CODIFICADO_AQUI
```

## 🧪 Teste a Configuração

### 1. Reinicie o servidor
```bash
npm run dev
```

### 2. Teste as variáveis de ambiente
Acesse: `http://localhost:3000/api/test-env`

### 3. Teste a conexão OpenPix
- Vá para a página de planos
- Clique em "Testar Conexão" (botão de debug)
- Verifique se aparece "✅ Conexão com OpenPix OK!"

### 4. Teste a geração de QR Code
- Clique em "Assinar Plano" em qualquer plano (Alfa, Omega, Beta)
- Verifique se o QR code é gerado e exibido

## 🔍 Debug

### Se ainda não funcionar:

1. **Verifique os logs do console** do navegador
2. **Verifique os logs do servidor** no terminal
3. **Teste o token** no painel da OpenPix
4. **Confirme se a conta está ativa** e não em modo sandbox

### Logs esperados no console:
```
🔍 Iniciando compra do plano: {name: "Alfa", ...}
🧑‍💻 Usuário: {discordId: "...", email: "..."}
🔄 Criando cobrança OpenPix: {user: {...}, plan: {...}, value: 497}
📡 Status da resposta: 200
✅ Cobrança criada com sucesso: charge_123456
🔗 QR Code: https://api.openpix.com.br/api/v1/charge/123456/qrcode
```

## 🚨 Erros Comuns

### Erro 401 - Token Inválido
- Verifique se o AppID está correto
- Confirme se não há espaços extras
- Teste se o AppID funciona no painel da OpenPix

### QR Code não aparece
- Verifique se os dados estão sendo salvos no estado `qrData`
- Confirme se a resposta da OpenPix contém `qrCodeImage`
- Verifique se não há erros no console

### Erro de CORS
- Confirme se está usando HTTPS em produção
- Verifique se o domínio está configurado no painel da OpenPix

## 📞 Suporte

Se ainda tiver problemas:
1. Entre em contato com o suporte da OpenPix
2. Verifique a documentação oficial: [https://docs.openpix.com.br](https://docs.openpix.com.br)
3. Confirme se sua conta tem permissões para usar a API

# Configuração da OpenPix

Este guia explica como configurar a integração com a OpenPix no projeto.

## 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure as seguintes variáveis:

```bash
# OpenPix
OPENPIX_APP_ID="seu-app-id-aqui"
```

## 2. Testando a Integração

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse http://localhost:3000 e faça login com sua conta Discord

3. Escolha um dos planos disponíveis:
- Alfa (R$ 19,90)
- Omega (R$ 29,90)
- Beta (R$ 39,90)

4. Você será redirecionado para a página de pagamento com o QR Code Pix

5. Use o aplicativo do seu banco para escanear o QR Code ou copie o código Pix

6. Após o pagamento, você será redirecionado automaticamente

## 3. Troubleshooting

Se encontrar algum erro, verifique:

1. Se o `OPENPIX_APP_ID` está configurado corretamente no `.env.local`
2. Se o servidor está rodando na porta 3000
3. Se você está logado com sua conta Discord
4. Se há conexão com a internet

## 4. Suporte

Em caso de problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do servidor
3. Entre em contato com o suporte da OpenPix se necessário 