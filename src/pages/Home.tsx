import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  DollarSign,
  FolderKanban,
  ArrowUpRight,
  Building2,
  Handshake,
  Receipt,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useDeals } from '@/hooks/useDeals';
import { cn } from '@/lib/utils';

const QUOTES = [
  { quote: "The energy of a company starts from the top.", author: "Adam Neumann" },
  { quote: "I'm not crazy. My mother had me tested.", author: "Sheldon Cooper" },
  { quote: "Bazinga!", author: "Sheldon Cooper" },
  { quote: "I cry because others are stupid and it makes me sad.", author: "Sheldon Cooper" },
  { quote: "I'm not insane. My mother had me tested.", author: "Sheldon Cooper" },
  { quote: "I'm quite capable of being civil. I simply choose not to be.", author: "Sheldon Cooper" },
  { quote: "I'm a physicist. I have a working knowledge of the entire universe.", author: "Sheldon Cooper" },
  { quote: "People can't be happy all the time. That's not a real thing.", author: "Sheldon Cooper" },
  { quote: "Change is never easy. You fight to hold on. You fight to let go.", author: "Sheldon Cooper" },
  { quote: "Hard work and focus are the real secrets to success.", author: "Sheldon Cooper" },
  { quote: "One cries because one is sad. I cry because others are stupid.", author: "Sheldon Cooper" },
  { quote: "I would have been here sooner, but the bus kept stopping for other people.", author: "Sheldon Cooper" },
  { quote: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" },
  { quote: "I think it's possible for ordinary people to choose to be extraordinary.", author: "Elon Musk" },
  { quote: "Persistence is very important. You should not give up unless you are forced to give up.", author: "Elon Musk" },
  { quote: "Move fast. Speed is one of your main advantages over large competitors.", author: "Sam Altman" },
  { quote: "Great execution is at least 10 times more important and a 100 times harder than a good idea.", author: "Sam Altman" },
  { quote: "Long-term thinking is rare and incredibly valuable.", author: "Sam Altman" },
  { quote: "Make something people want.", author: "Paul Graham" },
  { quote: "Live in the future, then build what's missing.", author: "Paul Graham" },
  { quote: "A startup is a company designed to grow fast.", author: "Paul Graham" },
  { quote: "Think AI or stay irrelevant.", author: "Irrelevant" },
];

const Home = () => {
  const { leads } = useLeads();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { deals } = useDeals();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteFading, setIsQuoteFading] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Rotate quotes every 10 seconds with fade effect
  useEffect(() => {
    const timer = setInterval(() => {
      setIsQuoteFading(true);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        setIsQuoteFading(false);
      }, 300);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Date calculations
  const dateInfo = useMemo(() => {
    const now = currentTime;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const quarter = Math.floor(currentMonth / 3) + 1;
    const quarterStartMonth = (quarter - 1) * 3;
    const quarterEndMonth = quarterStartMonth + 2;
    const quarterStart = new Date(currentYear, quarterStartMonth, 1);
    const quarterEnd = new Date(currentYear, quarterEndMonth + 1, 0);

    const totalDaysInQuarter = Math.ceil((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDaysInQuarter - daysElapsed);
    const quarterProgress = Math.min(100, Math.round((daysElapsed / totalDaysInQuarter) * 100));

    const weekday = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString('es-ES', { month: 'long' });
    const year = now.getFullYear();

    return {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      day,
      month: month.charAt(0).toUpperCase() + month.slice(1),
      year,
      quarter,
      daysRemaining,
      quarterProgress,
    };
  }, [currentTime]);

  const currentQuote = QUOTES[quoteIndex];

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeLeads = leads?.filter(l =>
      !['CERRADO_GANADO', 'CERRADO_PERDIDO'].includes(l.stage)
    ).length || 0;

    const activeClients = clients?.length || 0;

    const activeProjects = projects?.filter(p =>
      p.stage === 'CERRADO_GANADO'
    ).length || 0;

    const activeDeals = deals?.filter(d => d.status === 'ACTIVE') || [];
    const totalMRR = activeDeals.reduce((sum, deal) => sum + (Number(deal.mrr_usd) || 0), 0);

    return { activeLeads, activeClients, activeProjects, totalMRR };
  }, [leads, clients, projects, deals]);

  const quickLinks = [
    { name: 'Funnel', href: '/funnel', icon: TrendingUp, color: 'emerald', description: 'Pipeline de ventas' },
    { name: 'Empresas', href: '/empresas', icon: Building2, color: 'blue', description: 'Gestión de leads' },
    { name: 'Clientes', href: '/clients', icon: Handshake, color: 'violet', description: 'Clientes activos' },
    { name: 'Finanzas', href: '/finance', icon: Receipt, color: 'amber', description: 'Control financiero' },
  ];

  return (
    <div className="min-h-screen -m-6 lg:-m-8 -mb-6 lg:-mb-8 relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Animated gradient orbs - now covering full page */}
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[20%] right-[25%] w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-[80px]" />

      {/* Grid pattern - full page */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='white'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 min-h-screen flex flex-col pb-6 lg:pb-8">
        {/* Hero Section */}
        <div className="px-6 lg:px-8 pt-8 lg:pt-12 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              {/* Left side - Date & Quote */}
              <div className="flex-1 space-y-6">
                {/* Date display */}
                <div>
                  <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-2">
                    {dateInfo.weekday}
                  </p>
                  <div className="flex items-baseline gap-4">
                    <span className="text-7xl lg:text-8xl font-bold text-white leading-none">
                      {dateInfo.day}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-2xl lg:text-3xl font-light text-zinc-400">
                        {dateInfo.month}
                      </span>
                      <span className="text-lg text-zinc-600">
                        {dateInfo.year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quote with fade animation */}
                <div className={cn(
                  "transition-all duration-300 max-w-xl",
                  isQuoteFading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                )}>
                  <p className="text-xl lg:text-2xl text-zinc-300 font-light leading-relaxed mb-2">
                    "{currentQuote.quote}"
                  </p>
                  <p className="text-sm text-purple-400 font-medium">
                    — {currentQuote.author}
                  </p>
                </div>

                {/* Quarter progress inline */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500">Q{dateInfo.quarter}</span>
                    <div className="w-32 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full"
                        style={{ width: `${dateInfo.quarterProgress}%` }}
                      />
                    </div>
                    <span className="text-sm text-zinc-500">{dateInfo.quarterProgress}%</span>
                  </div>
                  <span className="text-sm text-zinc-600">
                    {dateInfo.daysRemaining} días restantes
                  </span>
                </div>
              </div>

              {/* Right side - Mr. Irrelevant */}
              <div className="hidden lg:block relative">
                <div className="absolute -inset-8 bg-gradient-to-t from-purple-500/30 via-violet-500/15 to-transparent blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-purple-500/30 rounded-full blur-2xl" />
                <img
                  src="https://storage.googleapis.com/cluvi/agent007.png"
                  alt="Mr. Irrelevant"
                  className="relative h-72 w-auto object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-6 lg:px-8 pb-8 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Link to="/finance" className="group">
                <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white mb-0.5">
                      ${metrics.totalMRR.toLocaleString()}
                    </p>
                    <p className="text-sm text-zinc-500">MRR Activo</p>
                  </div>
                </div>
              </Link>

              <Link to="/funnel" className="group">
                <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white mb-0.5">
                      {metrics.activeLeads}
                    </p>
                    <p className="text-sm text-zinc-500">Leads Activos</p>
                  </div>
                </div>
              </Link>

              <Link to="/clients" className="group">
                <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Handshake className="h-4 w-4 text-violet-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-violet-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white mb-0.5">
                      {metrics.activeClients}
                    </p>
                    <p className="text-sm text-zinc-500">Clientes</p>
                  </div>
                </div>
              </Link>

              <Link to="/tech/projects" className="group">
                <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <FolderKanban className="h-4 w-4 text-amber-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-amber-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold text-white mb-0.5">
                      {metrics.activeProjects}
                    </p>
                    <p className="text-sm text-zinc-500">Proyectos</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Access */}
            <div>
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                Acceso Rápido
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {quickLinks.map((link) => (
                  <Link key={link.name} to={link.href}>
                    <div className={cn(
                      "group flex items-center gap-3 p-3.5 rounded-xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm transition-all duration-300",
                      "hover:scale-[1.02] hover:border-transparent",
                      link.color === 'emerald' && "hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/10",
                      link.color === 'blue' && "hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/10",
                      link.color === 'violet' && "hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/10",
                      link.color === 'amber' && "hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/10",
                    )}>
                      <div className={cn(
                        "p-2 rounded-lg border transition-colors",
                        link.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                        link.color === 'blue' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                        link.color === 'violet' && "bg-violet-500/10 border-violet-500/20 text-violet-400",
                        link.color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                      )}>
                        <link.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-zinc-200">{link.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{link.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
