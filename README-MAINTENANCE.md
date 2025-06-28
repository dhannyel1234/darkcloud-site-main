# Página de Manutenção - Dark Cloud 🌑

Este documento explica como funciona a página de manutenção do projeto Dark Cloud e como ativá-la quando necessário.

## Visão Geral 🔍

A página de manutenção foi projetada para ser exibida quando o site estiver passando por atualizações, correções ou qualquer tipo de manutenção programada. Ela inclui:

- ✨ Design visual consistente com o tema espacial do site
- ⏱️ Contador regressivo para informar aos usuários quando o serviço estará disponível novamente
- 📧 Informações de contato para suporte
- 🚀 Animações e elementos visuais interativos

## Arquivos Implementados 📁

1. `src/app/maintenance/page.tsx` - Componente React da página de manutenção
2. `src/app/maintenance/styles.css` - Estilos específicos para a página de manutenção
3. `src/middleware.ts` - Middleware para controlar o redirecionamento para a página de manutenção

## Como Ativar o Modo de Manutenção 🔧

Para ativar o modo de manutenção, siga estes passos:

1. Abra o arquivo `src/middleware.ts`
2. Altere a constante `MAINTENANCE_MODE` de `false` para `true`:

```typescript
// Altere esta linha
const MAINTENANCE_MODE = true; // Ativando o modo de manutenção
```

3. Salve o arquivo e reinicie o servidor se necessário

Quando o modo de manutenção estiver ativo, todas as requisições para o site serão redirecionadas para a página de manutenção, exceto as rotas definidas em `ALLOWED_PATHS`.

## Como Personalizar ⚙️

### Alterando a Data de Término ⏰

Por padrão, o contador regressivo está configurado para 24 horas a partir do momento em que a página é carregada. Para alterar este comportamento:

1. Abra o arquivo `src/app/maintenance/page.tsx`
2. Localize o seguinte trecho de código:

```typescript
// Data estimada para o fim da manutenção (24 horas a partir de agora)
const endDate = new Date();
endDate.setHours(endDate.getHours() + 24);
```

3. Modifique conforme necessário, por exemplo, para definir uma data específica:

```typescript
const endDate = new Date('2024-12-31T23:59:59');
```

### Alterando a Mensagem 💬

Para alterar a mensagem exibida na página de manutenção:

1. Abra o arquivo `src/app/maintenance/page.tsx`
2. Localize e modifique os textos conforme necessário

## Rotas Permitidas Durante a Manutenção 🛣️

Por padrão, as seguintes rotas continuarão acessíveis mesmo quando o site estiver em modo de manutenção:

- `/maintenance` - A própria página de manutenção
- `/_next` - Recursos necessários para a página de manutenção funcionar
- `/favicon.ico` - Favicon do site

Para adicionar mais rotas permitidas, edite o array `ALLOWED_PATHS` no arquivo `src/middleware.ts`.

## Desativando o Modo de Manutenção 🔓

Para desativar o modo de manutenção e restaurar o acesso normal ao site:

1. Abra o arquivo `src/middleware.ts`
2. Altere a constante `MAINTENANCE_MODE` de `true` para `false`:

```typescript
const MAINTENANCE_MODE = false; // Desativando o modo de manutenção
```

3. Salve o arquivo e reinicie o servidor se necessário