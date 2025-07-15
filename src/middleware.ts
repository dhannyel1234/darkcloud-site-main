import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    // Verifica se a rota é /dashboard/admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
        try {
            // Obtém o token da sessão
            const token = await getToken({ req: request });
            
            if (!token || !token.sub) {
                console.log('🔒 Middleware: Token não encontrado');
                return NextResponse.redirect(new URL('/404', request.url));
            }

            console.log('🔑 Middleware: Token encontrado para usuário:', token.sub);

            // Constrói a URL base
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;
            console.log('🌐 Middleware: URL base:', baseUrl);

            // Faz a chamada para verificar se o usuário é admin
            const adminCheckUrl = `${baseUrl}/api/admin/get?user_id=${token.sub}`;
            console.log('🔍 Middleware: Verificando admin em:', adminCheckUrl);

            const adminCheckResponse = await fetch(adminCheckUrl, {
                method: 'GET',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                    'Host': request.headers.get('host') || ''
                }
            });

            // Se a resposta não for bem-sucedida, redireciona para a página 404
            if (!adminCheckResponse.ok) {
                console.log('❌ Middleware: Usuário não é admin');
                return NextResponse.redirect(new URL('/404', request.url));
            }

            const adminData = await adminCheckResponse.json();
            console.log('✅ Middleware: Dados do admin:', adminData);

            // Se chegou até aqui, o usuário é admin - envia webhook para Discord
            await sendAdminAccessWebhook(request, token);

            // Permite o acesso se o usuário for admin
            return NextResponse.next();
        } catch (error) {
            // Em caso de erro, redireciona para a página 404 por segurança
            console.error('❌ Middleware: Erro ao verificar admin:', error);
            return NextResponse.redirect(new URL('/404', request.url));
        }
    }

    // Permite o acesso para outras rotas
    return NextResponse.next();
}

async function sendAdminAccessWebhook(request: NextRequest, token: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_ADMIN;
    
    if (!webhookUrl) {
        console.warn('DISCORD_WEBHOOK_ADMIN não está configurado');
        return;
    }

    try {
        // Obter horário atual formatado para o Brasil
        const now = new Date();
        const brazilTime = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(now);

        // Montar dados do Discord do usuário
        const discordData = {
            id: token.sub || 'N/A',
            name: token.name || 'N/A',
            email: token.email || 'N/A',
            image: token.picture || null,
            // Outros campos do Discord que podem estar disponíveis no token
            discriminator: token.discriminator || 'N/A',
            username: token.username || token.name || 'N/A'
        };

        // Criar embed para o Discord
        const embed = {
            title: "🔐 Acesso ao Dashboard Admin",
            description: "Um administrador acessou o dashboard",
            color: 0xff0000, // Cor vermelha para indicar acesso admin
            fields: [
                {
                    name: "👤 Usuário",
                    value: discordData.name,
                    inline: true
                },
                {
                    name: "📧 Email", 
                    value: discordData.email,
                    inline: true
                },
                {
                    name: "🆔 Discord ID",
                    value: discordData.id,
                    inline: true
                },
                {
                    name: "🌐 Rota Acessada",
                    value: `\`${request.nextUrl.pathname}\``,
                    inline: false
                },
                {
                    name: "🕒 Horário (Brasil)",
                    value: brazilTime,
                    inline: true
                },
                {
                    name: "🌍 IP",
                    value: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'N/A',
                    inline: true
                },
                {
                    name: "🖥️ User Agent",
                    value: `\`${request.headers.get('user-agent')?.substring(0, 100) || 'N/A'}\``,
                    inline: false
                }
            ],
            thumbnail: {
                url: discordData.image || undefined
            },
            timestamp: now.toISOString(),
            footer: {
                text: "Sistema de Monitoramento Admin"
            }
        };

        // Enviar webhook para o Discord
        const webhookPayload = {
            embeds: [embed],
            username: "Dump - Bypass",
            avatar_url: "https://cdn.discordapp.com/emojis/1234567890123456789.png" // Opcional: substitua por um ícone personalizado
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
        });

        if (!response.ok) {
            console.error('Erro ao enviar webhook para Discord:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Erro ao enviar webhook para Discord:', error);
        // Não propagar o erro para não afetar o acesso do admin
    }
}

export const config = {
    matcher: '/admin/:path*'
};