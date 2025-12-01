import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu email y contraseña.'
          : error.message
        );
      } else {
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
        navigate('/');
      }
    } catch (err) {
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black">
      {/* Left side - Background image */}
      <div
        className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://storage.googleapis.com/cluvi/AI-Academy/fondo_erp.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo top */}
          <div className="flex items-center gap-3">
            <img
              src="https://academy.stayirrelevant.com/assets/irrelevant-logo-B9hN0rDI.png"
              alt="Irrelevant"
              className="h-9 w-auto"
            />
          </div>

          {/* Main tagline - center */}
          <div className="flex-1 flex items-center">
            <div className="space-y-6">
              <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                Think AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400">
                  or stay irrelevant
                </span>
              </h1>
              <p className="text-lg text-white/60 max-w-md leading-relaxed italic">
                "I'm not crazy. My mother had me tested."
              </p>
              <p className="text-sm text-purple-400 mt-2">— Dr. Sheldon Cooper</p>
            </div>
          </div>

          {/* Mr. Irrelevant - bottom right corner */}
          <div className="absolute bottom-0 right-8 hidden xl:block">
            {/* Glow behind character */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/40 via-violet-400/20 to-transparent blur-3xl scale-110" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 bg-purple-400/30 rounded-full blur-2xl" />
            <img
              src="https://storage.googleapis.com/cluvi/agent007.png"
              alt="Mr. Irrelevant"
              className="relative h-96 w-auto object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            />
          </div>

          {/* Spacer */}
          <div />
        </div>

        {/* Decorative glows */}
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[100px]" />
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-zinc-950">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center space-y-6 mb-8">
            <img
              src="https://academy.stayirrelevant.com/assets/irrelevant-logo-B9hN0rDI.png"
              alt="Irrelevant"
              className="h-8 w-auto mx-auto"
            />
            <p className="text-xl font-semibold text-white">
              Think AI <span className="text-purple-400">or stay irrelevant</span>
            </p>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              Iniciar sesión
            </h2>
            <p className="text-zinc-500">
              Accede a tu panel de control
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-zinc-300">
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    className="pl-11 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-zinc-300">
                  Contraseña
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-11 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white border-0 rounded-xl transition-all duration-300 group shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-zinc-950 text-zinc-600">
                Acceso exclusivo para el equipo
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-xs text-zinc-600">
              irrelevant ERP v1.0
            </p>
            <p className="text-xs text-zinc-700">
              © {new Date().getFullYear()} Irrelevant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
