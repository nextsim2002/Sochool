import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  School, 
  CreditCard,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  CalendarDays,
  MessageSquare,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthViewProps {
  onClose?: () => void;
  initialMode?: 'login' | 'register';
  isStandalone?: boolean;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onClose,
  initialMode = 'login',
  isStandalone = false
}) => {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [institution, setInstitution] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('กรุณากรอกชื่อ - นามสกุล');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!agreedTerms) {
      setError('กรุณากดยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        role,
        studentId: studentId.trim(),
        institution: institution.trim(),
        password
      });
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'การลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const formContent = (
    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-8 flex flex-col gap-6 relative">
      {!isStandalone && onClose && (
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sochool</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'login' ? 'เข้าสู่ระบบเครือข่ายวิชาการและการเรียนรู้' : 'สมัครสมาชิกเพื่อเริ่มเข้าชั้นเรียนและกลุ่มวิชา'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
          <span>{error}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          เข้าสู่ระบบ (Log In)
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          สร้างบัญชีใหม่ (Register)
        </button>
      </div>

      {/* LOGIN MODE */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">อีเมลผู้ใช้งาน (University Email)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-email"
                type="email"
                required
                placeholder="name@campus.university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">รหัสผ่าน (Password)</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* REGISTER MODE */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
          {/* Select Role cards */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">เลือกบทบาทของคุณในระบบ</label>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                id="role-select-student"
                onClick={() => setRole('student')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <GraduationCap className={`w-5 h-5 ${role === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900">นิสิต / นักศึกษา</span>
                <span className="text-[10px] text-slate-500">ส่งการบ้าน & ร่วมกลุ่มวิชา</span>
              </div>

              <div
                id="role-select-instructor"
                onClick={() => setRole('instructor')}
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                  role === 'instructor'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <BookOpen className={`w-5 h-5 ${role === 'instructor' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-900">อาจารย์ผู้สอน</span>
                <span className="text-[10px] text-slate-500">สร้างวิชา & ตรวจการบ้าน</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={role === 'student' ? 'นายธนกฤต วิทยานุกูล' : 'ดร. สุภาภรณ์ เจริญสุข'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {role === 'student' ? 'รหัสนักศึกษา' : 'รหัสบุคลากร'}
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ST-2024-8841"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">สถาบัน / ภาควิชา</label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Faculty of Computer Science"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">อีเมลมหาวิทยาลัย</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="user@campus.sochool.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">รหัสผ่าน</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="terms-checkbox" className="text-[11px] text-slate-600 cursor-pointer">
              ฉันยอมรับ <span className="text-indigo-600 underline">เงื่อนไขการให้บริการ</span> และ <span className="text-indigo-600 underline">นโยบายความเป็นส่วนตัว</span>
            </label>
          </div>

          <button
            id="btn-submit-register"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer"
          >
            <span>{loading ? 'กำลังสร้างบัญชี...' : 'ยืนยันการสมัครสมาชิก'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        {/* Background Ambient Decorators */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Campus & Platform Presentation */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-white pr-0 lg:pr-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Sochool Academic Hub</h1>
                <p className="text-xs text-indigo-300 font-medium">Digital Campus & Collaborative Learning Platform</p>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                พื้นที่การเรียนรู้และการสื่อสาร <br className="hidden sm:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-300">
                  สำหรับนิสิตและอาจารย์
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                เชื่อมต่อทุกกิจกรรมในรั้วมหาวิทยาลัยไว้ในที่เดียว ทั้งฟีดข่าวสารกลุ่มรายวิชาสไตล์ Facebook Groups, จัดการตารางสอนและอาจารย์ร่วมสอน (Co-Instructors), สั่งและส่งการบ้านแบบเรียลไทม์ผ่าน Firebase
              </p>
            </div>

            {/* Feature Highlights Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Community Feeds</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">โพสต์ประกาศ พูดคุย และแลกเปลี่ยนความรู้ในแคมปัส</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Courses & Co-Teaching</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">กลุ่มรายวิชา จัดการผู้สอนหลักและอาจารย์ร่วมสอน</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Weekly Schedule</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">ตารางเรียนรายสัปดาห์ พร้อมระบบแจ้งงดคลาสทันใจ</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Study Groups & Chat</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">ส่งข้อความและสร้างกลุ่มค้นคว้าแบบเรียลไทม์</p>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ระบบจัดเก็บข้อมูลบน Google Cloud Firebase Firestore ปลอดภัยและซิงค์ทันที</span>
            </div>
          </div>

          {/* Right Column: Form Container */}
          <div className="lg:col-span-5 flex justify-center">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="my-8 animate-in fade-in zoom-in-95 w-full max-w-md">
        {formContent}
      </div>
    </div>
  );
};
