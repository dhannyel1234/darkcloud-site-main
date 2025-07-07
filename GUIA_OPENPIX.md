# 🔧 Guia de Configuração da OpenPix

## ❌ Problema Identificado

Você está usando apenas o **Client ID** da OpenPix, mas precisa do **AppID completo** para autenticação.

### Token Atual (Incorreto):
```
Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7
```

### Token Necessário (Correto):
```
Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
```

## ✅ Como Resolver

### 1. Acesse o Painel da OpenPix
- Vá para [https://app.openpix.com.br](https://app.openpix.com.br)
- Faça login na sua conta

### 2. Navegue até as Configurações da API
- No menu lateral, clique em **"Configurações"**
- Clique em **"API"** ou **"Integração"**

### 3. Copie o AppID Completo
- Procure por **"AppID"** ou **"Token de Autenticação"**
- **NÃO** copie apenas o "Client ID"
- Copie o **AppID completo** que deve ter este formato:
  ```
  Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
  ```

### 4. Atualize o Arquivo .env.local
```env
# ❌ INCORRETO (apenas Client ID)
OPENPIX_APP_ID=Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7

# ✅ CORRETO (AppID completo)
OPENPIX_APP_ID=Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
```

### 5. Teste a Configuração
1. Salve o arquivo `.env.local`
2. Reinicie o servidor Next.js
3. Acesse: `http://localhost:3000/api/test-env`
4. Verifique se o token está correto

## 🔍 Verificação

### Token Válido Deve Ter:
- ✅ Começar com `Client_Id_`
- ✅ Conter `:` (dois pontos)
- ✅ Ter o Client Secret após os dois pontos
- ✅ Não ter espaços extras

### Exemplos de Tokens Válidos:
```
Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
Basic Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_XXXXX
```

## 🚨 Erro 401 - Token Inválido

Se você ainda receber erro 401 após configurar o AppID completo:

1. **Verifique se o AppID está correto** no painel da OpenPix
2. **Confirme se não há espaços** no início ou fim do token
3. **Teste se o AppID funciona** no painel da OpenPix
4. **Verifique se a conta está ativa** e não em modo sandbox/teste

## 📞 Suporte

Se ainda tiver problemas:
1. Entre em contato com o suporte da OpenPix
2. Verifique a documentação oficial: [https://docs.openpix.com.br](https://docs.openpix.com.br)
3. Confirme se sua conta tem permissões para usar a API 

# Guia de Uso da OpenPix

Este guia explica como usar a integração com a OpenPix no projeto.

## 1. Fluxo de Pagamento

1. **Seleção do Plano**
   - Acesse a página inicial
   - Escolha um dos planos disponíveis:
     - Alfa (R$ 19,90)
     - Omega (R$ 29,90)
     - Beta (R$ 39,90)
   - Clique em "Comprar Agora"

2. **Pagamento**
   - Você será redirecionado para a página de pagamento
   - Um QR Code Pix será gerado
   - Você tem duas opções:
     - Escanear o QR Code com o app do seu banco
     - Copiar o código Pix e colar no app do seu banco

3. **Confirmação**
   - Após o pagamento, aguarde alguns segundos
   - A página será atualizada automaticamente
   - Você será redirecionado para a página de sucesso

## 2. Planos Disponíveis

### Plano Alfa
- Preço: R$ 19,90
- 2 horas de jogo
- Acesso a jogos básicos
- Suporte básico

### Plano Omega
- Preço: R$ 29,90
- 4 horas de jogo
- Acesso a todos os jogos
- Suporte prioritário

### Plano Beta
- Preço: R$ 39,90
- 8 horas de jogo
- Acesso a todos os jogos
- Suporte VIP
- Acesso antecipado a novos jogos

## 3. Dicas

1. **Antes de Pagar**
   - Verifique se está logado
   - Confirme o valor do plano
   - Tenha saldo suficiente na conta

2. **Durante o Pagamento**
   - Não feche a página
   - Aguarde a confirmação
   - Mantenha a conexão com a internet

3. **Após o Pagamento**
   - Aguarde o redirecionamento
   - Verifique seu e-mail
   - Salve o comprovante

## 4. Problemas Comuns

1. **QR Code não aparece**
   - Recarregue a página
   - Verifique sua conexão
   - Tente em outro navegador

2. **Pagamento não confirmado**
   - Aguarde alguns minutos
   - Verifique se o valor foi debitado
   - Entre em contato com o suporte

3. **Erro no redirecionamento**
   - Não feche a página
   - Aguarde alguns minutos
   - Se persistir, contate o suporte 

# Guia de Configuração OpenPix para Pagamentos Pix

## 🎯 Objetivo
Este guia explica como configurar corretamente a OpenPix para processar pagamentos Pix nos planos Alfa, Omega e Beta.

## ✅ Configuração Correta
A OpenPix usa **AppID** (não API Key) para autenticação. O AppID é um ClientID:ClientSecret codificado em Base64.

## 🔑 Como Obter o AppID

### 1. Acesse o Painel da OpenPix
- Vá para [https://app.openpix.com.br](https://app.openpix.com.br)
- Faça login na sua conta

### 2. Navegue para Configurações
- No menu lateral, clique em **"Configurações"**
- Selecione **"API"** ou **"Integração"**

### 3. Obtenha o AppID
- Procure por **"AppID"** ou **"Client ID"**
- Copie o valor do AppID (já codificado em Base64)

### 4. Formato do AppID
O AppID deve ter este formato (Base64):
```
Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0XzBuT2p2NW8yMDZ3YnMxdEZ5MGo1aHR1czNaV2xDK00vbFBIR1Rrd3lzcFU9
```

Quando decodificado, contém:
```
Client_Id_43c5a3ed-7429-4921-b980-bfab2478dcf7:Client_Secret_0nOjv5o206wbs1tFy0j5htus3ZWlC+K/lPHGTkwypspU=
```

## 📝 Configuração no Projeto

### 1. Arquivo .env.local
Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# AppID da OpenPix (ClientID:ClientSecret em Base64)
OPENPIX_APP_ID="Q2xpZW50X0lkXzQzYzVhM2VkLTc0MjktNDkyMS1iOTgwLWJmYWIyNDc4ZGZjNzpDbGllbnRfU2VjcmV0XzBuT2p2NW8yMDZ3YnMxdEZ5MGo1aHR1czNaV2xDK00vbFBIR1Rrd3lzcFU9"

# Outras configurações...
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret"
DISCORD_CLIENT_ID="seu-discord-client-id"
DISCORD_CLIENT_SECRET="seu-discord-client-secret"
MONGODB_URI="sua-mongodb-uri"
```

### 2. Reinicie o Servidor
Após configurar o `.env.local`:
```bash
npm run dev
```

## 🧪 Testando a Configuração

### 1. Rota de Teste
Acesse: `http://localhost:3000/api/test-env`

Esta rota irá:
- Verificar se o AppID está configurado
- Testar se é Base64 válido
- Fazer uma requisição de teste para a OpenPix
- Retornar o resultado detalhado

### 2. Teste de Pagamento
Acesse: `http://localhost:3000/order/basic?plan=alfa`

## 🔍 Verificações Importantes

### 1. Formato do AppID
- ✅ Deve ser uma string Base64 válida
- ✅ Quando decodificado, deve conter `Client_Id_` e `Client_Secret_`
- ✅ Deve conter `:` (dois pontos) quando decodificado

### 2. Status do AppID
- ✅ Deve estar **ativo** no painel da OpenPix
- ✅ Deve ter permissões para **Pix**
- ❌ Não pode estar expirado ou desabilitado

## 🚨 Erros Comuns e Soluções

### Erro: "appID inválido"
**Causa:** AppID incorreto ou inativo
**Solução:** 
1. Verifique se o AppID está correto no painel
2. Confirme se está ativo para Pix
3. Teste com a rota `/api/test-env`

### Erro: "401 Unauthorized"
**Causa:** AppID não encontrado ou mal formatado
**Solução:**
1. Verifique se `OPENPIX_APP_ID` está no `.env.local`
2. Confirme que não há espaços extras
3. Reinicie o servidor após alterações

### Erro: "500 Internal Server Error"
**Causa:** Problema na configuração ou AppID
**Solução:**
1. Verifique os logs do terminal
2. Teste com `/api/test-env`
3. Confirme formato do AppID

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique os logs do terminal
2. Teste com `/api/test-env`
3. Confirme a configuração no painel da OpenPix
4. Verifique se o AppID tem permissões para Pix

## 🔗 Links Úteis
- [Documentação OpenPix](https://docs.openpix.com.br/)
- [Painel OpenPix](https://app.openpix.com.br)
- [API Reference](https://docs.openpix.com.br/api) 