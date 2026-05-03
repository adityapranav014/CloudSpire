import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="text-text-secondary text-sm mt-1">Sign in to your account to continue</p>
        </div>

        <div className="layer-raised rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-text-muted transition-colors group-focus-within:text-primary" />
                <input {...register('email')} type="email" placeholder="name@company.com" autoComplete="email"
                  className={'w-full bg-bg-elevated border ' + (errors.email ? 'border-accent-rose' : 'border-border-default') + ' focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm'} />
              </div>
              {errors.email && <p className="text-accent-rose text-[11px] ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-text-muted transition-colors group-focus-within:text-primary" />
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                  className={'w-full bg-bg-elevated border ' + (errors.password ? 'border-accent-rose' : 'border-border-default') + ' focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-3 pl-10 pr-10 outline-none transition-all text-sm'} />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-3.5 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-rose text-[11px] ml-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full shiny-primary rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Sign In <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>)}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-text-secondary text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary font-semibold hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}
