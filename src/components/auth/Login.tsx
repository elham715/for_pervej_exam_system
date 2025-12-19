import { useState } from 'react';
import { signIn, signUp, resetPassword } from '../../lib/auth';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'reset';

const Login = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { refreshUserData } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      console.log('🔐 Login attempt started...(Login.tsx)');
      const result = await signIn(email, password);
      console.log('✅ Login successful!(Login.tsx)', result);
      await refreshUserData();
      console.log('✅ User data refreshed!(Login.tsx)');
      // User will be automatically redirected by auth state change
    } catch (error: any) {
      console.error('❌ Login failed:(Login.tsx)', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      console.log('📝 Sign up attempt started...(Login.tsx)');
      const result = await signUp(email, password, {
        name,
        phone: phone || undefined,
        college_name: collegeName || undefined,
        address: address || undefined,
        role: 'STUDENT',
      });
      console.log('✅ Sign up successful!(Login.tsx)', result);
      await refreshUserData();
      console.log('✅ User data refreshed!(Login.tsx)');
      setSuccess('Account created successfully!');
      // User will be automatically redirected by auth state change
    } catch (error: any) {
      console.error('❌ Sign up failed:(Login.tsx)', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setCollegeName('');
    setAddress('');
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'login' && 'Login'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'reset' && 'Reset Password'}
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Forgot Password?
              </button>
            </div>
            <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">Don't have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-blue-500 hover:text-blue-700 text-sm font-bold"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="password"
                placeholder="Your password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="college">
                College Name
              </label>
              <input
                id="college"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Your college name"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
            <div className="text-center">
              <span className="text-gray-600 text-sm">Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-500 hover:text-blue-700 text-sm font-bold"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
