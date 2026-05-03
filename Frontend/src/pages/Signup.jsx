import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const [error, setError] = useState('');

  const { registerUser } = useAuth();
  // if (persona) { navigate('/dashboard', { replace: true }); return null; }

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const checks = [
    { label: 'At least 8 characters', pass: pwValue.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(pwValue) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(pwValue) },
  ];

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      await registerUser(data);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create an account</h1>
          <p className="text-text-secondary text-sm mt-1">Start optimizing your cloud spend today</p>
        </div>

        <div className="layer-raised rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-4 w-4 text-text-muted transition-colors group-focus-within:text-primary" />
                <input {...register('name')} type="text" placeholder="John Doe" autoComplete="name"
                  className={'w-full bg-bg-elevated border ' + (errors.name ? 'border-accent-rose' : 'border-border-default') + ' focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-sm'} />
              </div>
              {errors.name && <p className="text-accent-rose text-[11px] ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">Email address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-text-muted transition-colors group-focus-within:text-primary" />
                <input {...register('email')} type="email" placeholder="name@company.com" autoComplete="email"
                  className={'w-full bg-bg-elevated border ' + (errors.email ? 'border-accent-rose' : 'border-border-default') + ' focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-sm'} />
              </div>
              {errors.email && <p className="text-accent-rose text-[11px] ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-text-muted transition-colors group-focus-within:text-primary" />
                <input {...register('password', { onChange: e => setPwValue(e.target.value) })}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                  className={'w-full bg-bg-elevated border ' + (errors.password ? 'border-accent-rose' : 'border-border-default') + ' focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl py-2.5 pl-10 pr-10 outline-none transition-all text-sm'} />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-3 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-accent-rose text-[11px] ml-1">{errors.password.message}</p>}
              {pwValue.length > 0 && (
                <div className="pt-1 space-y-1.5">
                  {checks.map(({ label, pass }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] font-medium"
                      style={{ color: pass ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                      <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: pass ? 'rgba(16,185,129,0.12)' : 'var(--bg-elevated)', border: '1px solid ' + (pass ? 'var(--accent-emerald)' : 'var(--border-default)') }}>
                        {pass && <Check className="h-2 w-2" />}
                      </div>
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full shiny-primary rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Create Account <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></>)}
            </button>
          </form>

          <p className="text-center mt-6 text-[11px] text-text-muted leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center mt-8 text-text-secondary text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
