import { useMemo, useState } from 'react';
import { AppRole, LoginPayload, RegisterPayload } from '../types';
import { Lock, Mail, User, UserPlus } from 'lucide-react';
import { DEPARTMENTS } from '../lib/departments';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onLogin: (payload: LoginPayload) => Promise<void>;
  onRegister: (payload: RegisterPayload) => Promise<void>;
  error?: string | null;
  isLoading?: boolean;
}

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

  // Animasyon varyasyonları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: 'easeOut' } 
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8">
      {/* Premium Arka Plan Efektleri (Mesh Gradients) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-indigo-500/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-[5%] top-[20%] h-[40%] w-[40%] rounded-full bg-purple-500/10 blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 20, 0],
            y: [0, -40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] left-[20%] h-[30%] w-[30%] rounded-full bg-blue-500/5 blur-[100px]"
        />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]"
      >
        {/* Sol Panel: Bilgi Alanı */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col space-y-8 rounded-[40px] border border-white/60 bg-white/40 p-8 shadow-2xl shadow-indigo-100/20 backdrop-blur-2xl lg:p-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex w-fit items-center gap-3 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10"
          >
            <motion.img
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              src="/logo.jpg"
              alt="Zodiac logo"
              className="h-6 w-6 rounded-full object-cover"
            />
            Zodiac Workspace
          </motion.div>

          <div className="space-y-5">
            <motion.h1 
              variants={itemVariants}
              className="max-w-xl text-4xl font-black leading-[1.1] text-slate-900 lg:text-5xl"
            >
              Proje yönetiminde <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">yeni nesil</span> rol deneyimi.
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="max-w-2xl text-base leading-relaxed text-slate-600 lg:text-lg"
            >
              Karmaşayı geride bırakın. Giriş yaptığınız an, sistem sizin rolünüzü tanır ve size özel çalışma alanını hazırlar.
            </motion.p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Akıllı Filtreleme', desc: 'Sadece sizinle ilgili verileri görün.' },
              { title: 'Anlık Bildirimler', desc: 'Görev güncellemelerinden kopmayın.' },
              { title: 'Güvenli Altyapı', desc: 'Verileriniz endüstri standardında korunur.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.8)" }}
                className="rounded-3xl border border-white/80 bg-white/50 p-5 shadow-sm transition-colors backdrop-blur-sm"
              >
                <p className="text-sm font-bold text-slate-900">{feature.title}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Sağ Panel: Form Alanı */}
        <motion.div 
          variants={itemVariants}
          className="relative min-h-[550px] overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50 lg:p-10"
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* OTURUM AÇMA EFEKTİ (LOADING STATE) */
              <motion.div
                key="loading-pulse"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex h-full min-h-[450px] flex-col items-center justify-center text-center"
              >
                <div className="relative mb-10">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-24 w-24 rounded-full border-4 border-slate-100 border-t-indigo-600"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="h-12 w-12 rounded-full bg-indigo-600/20" />
                  </motion.div>
                </div>
                <motion.h3 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mb-3 text-2xl font-black text-slate-900"
                >
                  Workspace Hazırlanıyor
                </motion.h3>
                <p className="max-w-[250px] text-sm leading-relaxed text-slate-500">
                  Rolünüz, projeleriniz ve çalışma alanınız güvenle yükleniyor...
                </p>
              </motion.div>
            ) : (
              /* FORM CONTENT */
              <motion.div
                key="auth-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <div className="mb-8 flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5 transition-all">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      mode === 'login' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      mode === 'register' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Kayıt Ol
                  </button>
                </div>

                <div className="mb-8">
                  <motion.h2 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="text-3xl font-black text-slate-900"
                  >
                    {title}
                  </motion.h2>
                  <motion.p 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 text-sm leading-relaxed text-slate-500"
                  >
                    {subtitle}
                  </motion.p>
                </div>

                <AnimatePresence mode="wait">
                  {mode === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-5"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        await onLogin(loginForm);
                      }}
                    >
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">E-posta Adresi</span>
                        <div className="group relative">
                          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                          <input
                            type="email"
                            value={loginForm.email}
                            onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-12 py-3.5 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                            placeholder="ornek@zodiac.com"
                            required
                          />
                        </div>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Güvenli Şifre</span>
                        <div className="group relative">
                          <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                          <input
                            type="password"
                            value={loginForm.password}
                            onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-12 py-3.5 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                      </label>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3.5 text-xs font-medium text-indigo-700"
                      >
                        Demo kullanıcı şifresi: <span className="font-extrabold underline decoration-indigo-300 underline-offset-2">123456</span>
                      </motion.div>

                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-600"
                        >
                          {error}
                        </motion.p>
                      )}

                      <button
                        type="submit"
                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98]"
                      >
                        <span className="relative z-10">Giriş Yap</span>
                        <Lock className="relative z-10 h-4 w-4 transition-transform group-hover:rotate-12" />
                      </button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-4"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        if (!registerForm.department) return;
                        await onRegister(registerForm);
                      }}
                    >
                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tam Adınız</span>
                        <div className="group relative">
                          <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                          <input
                            type="text"
                            value={registerForm.name}
                            onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-12 py-3.5 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            placeholder="Ad Soyad"
                            required
                          />
                        </div>
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">E-posta</span>
                          <div className="group relative">
                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                            <input
                              type="email"
                              value={registerForm.email}
                              onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-12 py-3.5 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                              placeholder="ornek@zodiac.com"
                              required
                            />
                          </div>
                        </label>
                        <label className="block space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Şifre</span>
                          <div className="group relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
                            <input
                              type="password"
                              value={registerForm.password}
                              onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-12 py-3.5 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400"
                              placeholder="Min. 6 kr."
                              required
                            />
                          </div>
                        </label>
                      </div>

                      <label className="block space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Departman Seçimi</span>
                        <select
                          value={registerForm.department || ''}
                          onChange={(event) => setRegisterForm((current) => ({ ...current, department: event.target.value }))}
                          className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-bold text-slate-900 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                          required
                        >
                          <option value="">Lütfen departmanınızı seçin</option>
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </label>

                      <div className="rounded-2xl bg-blue-50/80 px-4 py-3 text-[11px] font-bold text-blue-700">
                        Kayıt sonrası rolünüz yönetici tarafından tanımlanacaktır.
                      </div>

                      {error && (
                        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3.5 text-sm font-medium text-rose-600">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!registerForm.department}
                        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                      >
                        <span className="relative z-10">Hesap Oluştur</span>
                        <UserPlus className="relative z-10 h-4 w-4 transition-transform group-hover:scale-110" />
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
