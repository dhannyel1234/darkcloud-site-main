import { NextResponse } from 'next/server';

export async function GET() {
  // Dados simulados (pode ser substituído por dados reais do banco de dados ou serviços externos)
  const services = [
    {
      name: 'API Principal',
      status: 'operational',
      description: 'Serviço principal da aplicação',
      uptime: '99.98%',
      responseTime: '42ms'
    },
    {
      name: 'Banco de Dados',
      status: 'operational',
      description: 'Banco de dados PostgreSQL',
      uptime: '99.95%',
      responseTime: '38ms'
    },
    {
      name: 'Autenticação',
      status: 'degraded',
      description: 'Serviço de autenticação de usuários',
      uptime: '98.72%',
      responseTime: '187ms'
    },
    {
      name: 'Armazenamento',
      status: 'outage',
      description: 'Serviço de armazenamento de arquivos',
      uptime: '94.31%',
      responseTime: '320ms'
    },
    {
      name: 'Notificações',
      status: 'maintenance',
      description: 'Serviço de envio de notificações',
      uptime: '97.45%',
      responseTime: '156ms'
    },
    {
      name: 'Gateway de Pagamentos',
      status: 'operational',
      description: 'Processamento de transações financeiras',
      uptime: '99.99%',
      responseTime: '65ms'
    }
  ];

  const incidents = [
    {
      date: '2024-05-15',
      title: 'Interrupção no serviço de armazenamento',
      status: 'resolved',
      description: 'O serviço de armazenamento apresentou instabilidade devido a uma atualização de segurança.',
      duration: '45 minutos'
    },
    {
      date: '2024-05-10',
      title: 'Lentidão no serviço de autenticação',
      status: 'resolved',
      description: 'O serviço de autenticação apresentou lentidão devido ao alto tráfego.',
      duration: '2 horas'
    },
    {
      date: '2024-04-28',
      title: 'Manutenção programada',
      status: 'completed',
      description: 'Manutenção programada para atualização do sistema de notificações.',
      duration: '3 horas'
    }
  ];

  const performanceMetrics = {
    cpuUsage: 42,
    memoryUsage: 58,
    networkTraffic: 76,
    diskUsage: 35
  };

  return NextResponse.json({
    services,
    incidents,
    performanceMetrics,
    lastUpdated: new Date().toISOString()
  });
}