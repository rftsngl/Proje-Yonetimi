import { useMemo, useState } from 'react';
import { AppRole, LoginPayload, RegisterPayload } from '../types';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { DEPARTMENTS } from '../lib/departments';

interface AuthScreenProps {
  onLogin: (payload: LoginPayload) => Promise<void>;
  onRegister: (payload: RegisterPayload) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
}

const roleOptions: AppRole[] = [
  'Admin',
  'Product Manager',
  'Senior Developer',
  'Frontend Developer',
  'UI/UX Designer',
  'QA Engineer',
];

export default function AuthScreen({ onLogin, onRegister, error, isLoading }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState<LoginPayload>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({
    name: '',
    email: '',
    password: '',
    department: 'Yazılım',
  });

  const title = useMemo(
    () => (mode === 'login' ? 'Projene Güvenli Giriş Yap' : 'Ekibine Yeni Hesap Oluştur'),
    [mode],
  );

  const subtitle = useMemo(
    () =>
      mode === 'login'
        ? 'Rolüne göre görev, proje ve ekip görünümü otomatik olarak sana uyarlanır.'
        : 'Kayıt olduktan sonra rol tabanlı görünüm ve yetkiler otomatik tanımlanır.',
    [mode],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#f8fafc_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8 rounded-[36px] border border-white/70 bg-white/70 p-8 shadow-2xl shadow-indigo-100 backdrop-blur-xl lg:p-12">
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            <img
              src="/logo.jpg"
              alt="Zodiac logo"
              className="h-5 w-5 rounded-full object-cover"
            />
            Zodiac Workspace
          </div>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-black leading-tight text-slate-900 lg:text-5xl">
              Proje yönetimini rol bazlı ve güvenli şekilde yönetin.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 lg:text-lg">
              Admin, ürün yöneticisi, geliştirici veya tasarımcı olman fark etmez. Giriş yaptığında sana ait projeler,
              görevler ve yetkiler otomatik olarak şekillenir.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900">Rol Tabanlı Menü</p>
              <p className="mt-2 text-sm text-slate-500">Her kullanıcı sadece yetkili olduğu alanları görür.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900">Canlı Veri Kapsamı</p>
              <p className="mt-2 text-sm text-slate-500">Projeler ve görevler oturum açan kullanıcıya göre filtrelenir.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-bold text-slate-900">Güvenli Oturum</p>
              <p className="mt-2 text-sm text-slate-500">Şifreli giriş ve kalıcı session ile akış korunur.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 lg:p-8">
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              Kayıt Ol
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
          </div>

          {mode === 'login' ? (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await onLogin(loginForm);
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">E-posta</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="ornek@zodiac.com"
                    required
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Şifre</span>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Şifrenizi girin"
                    required
                  />
                </div>
              </label>

              <p className="rounded-2xl bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-700">
                Demo kullanıcıları için başlangıç şifresi: <span className="font-bold">123456</span>
              </p>

              {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!registerForm.department) {
                  return;
                }
                await onRegister(registerForm);
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Ad Soyad</span>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ad Soyad"
                    required
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-700">E-posta</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="ornek@zodiac.com"
                      required
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-slate-700">Şifre</span>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-11 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="En az 6 karakter"
                      required
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-slate-700">Departman</span>
                <select
                  value={registerForm.department || ''}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, department: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Departman seçin</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>

              <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                Kayıt olduktan sonra, rolünüz admin tarafından atanacaktır. Lütfen sabırlı olun.
              </p>

              {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !registerForm.department}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                {isLoading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
