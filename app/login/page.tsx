'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#374151] font-sans">
      {/* Left side - Form */}
      <div className="flex w-full flex-col px-8 py-8 md:w-1/2 lg:px-24 relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            {/* Logo */}
            {/* <div className="flex justify-center md:justify-start mb-8">
              <img src="/assets/logo_name.jpg" alt="Lumen Opticals" className="h-32 w-auto object-contain" />
            </div> */}

            <h2 className="text-3xl font-extrabold text-[#374151]">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500">
              Please sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || authError) && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error || authError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#374151]">
                Email Address
              </label>
              <div className="mt-2 relative rounded-md shadow-sm">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@optical.com"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 py-3 pl-4 focus:border-[#f47b20] focus:ring-[#f47b20] sm:text-sm bg-white shadow-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-[#374151]">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-[#f47b20] hover:text-[#d96715] transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="mt-2 relative rounded-md shadow-sm">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 py-3 pl-4 pr-10 focus:border-[#f47b20] focus:ring-[#f47b20] sm:text-sm bg-white shadow-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#f47b20] focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center gap-2 rounded-lg bg-[#f47b20] py-6 text-base font-bold text-white shadow-md hover:bg-[#d96715] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#f47b20] focus:ring-offset-2 transition-all"
            >
              <LogIn className="h-5 w-5" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          {/* <div className="mt-12 rounded-xl bg-white p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#f47b20]"></div>
            <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Demo Credentials
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Admin Email:</span>
                <code className="font-mono text-[#f47b20] bg-orange-50 px-2 py-1 rounded font-medium">admin@optical.com</code>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Password:</span>
                <code className="font-mono text-[#374151] bg-gray-100 px-2 py-1 rounded font-medium">demo123</code>
              </div>
            </div>
          </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">Code Aqua Solutions</span> &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Right side - Image/Graphic */}
      <div className="hidden md:flex md:w-1/2 bg-[#374151] relative overflow-hidden items-center justify-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Giant decorative logo outline in background */}
        <div className="absolute opacity-5 transform rotate-12 scale-[1.8] translate-x-1/4">
          <svg width="600" height="600" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="50" cy="50" r="10" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 p-12 text-center text-white flex flex-col items-center">
          {/* Logo representation matching the actual logo */}
          <div className="mx-auto w-32 h-32 mb-10 rounded-full border-[3px] border-white/80 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-2 rounded-full border-[1.5px] border-white/50"></div>
            <div className="w-10 h-10 rounded-full bg-[#f47b20] shadow-[0_0_15px_rgba(244,123,32,0.5)]"></div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-light tracking-wide mb-6 text-white drop-shadow-md">
            L U M E N
          </h2>
          <div className="flex items-center gap-4 mb-6 text-[#f47b20] opacity-90">
            <div className="h-[1px] w-12 bg-[#f47b20]"></div>
            <span className="tracking-[0.3em] font-light text-xl">O P T I C A L S</span>
            <div className="h-[1px] w-12 bg-[#f47b20]"></div>
          </div>

          <p className="text-lg lg:text-xl text-gray-300 max-w-md mx-auto font-light tracking-wide opacity-80">
            Clarity in every sight
          </p>
        </div>

        {/* Subtle orange accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f47b20] to-transparent opacity-80"></div>
      </div>
    </div>
  );
}
