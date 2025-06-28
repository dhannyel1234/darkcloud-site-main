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
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Faz a chamada para verificar se o usuário é admin
            const adminCheckResponse = await fetch(
                `${process.env.NEXTAUTH_URL || request.nextUrl.origin}/api/admin/get?user_id=${token.sub}`,
                {
                    method: 'GET',
                    headers: {
                        'Cookie': request.headers.get('cookie') || '',
                        'Host': request.headers.get('host') || ''
                    }
                }
            );

            // Se a resposta não for bem-sucedida, redireciona para a página 404
            if (!adminCheckResponse.ok) {
                return NextResponse.redirect(new URL('/', request.url));
            }

            // Permite o acesso se o usuário for admin
            return NextResponse.next();
        } catch (error) {
            // Em caso de erro, redireciona para a página 404 por segurança
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Permite o acesso para outras rotas
    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*'
};