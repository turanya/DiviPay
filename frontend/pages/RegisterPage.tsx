import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { authAPI } from '../lib/api';

const RegisterPage: React.FC<{ onLogin: () => void; onNavigateToLanding: () => void; onNavigateToLogin: () => void; }> = ({ onLogin, onNavigateToLanding, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // React Router instead of Next.js router
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({ name, email, password });
      console.log('Registration successful:', response);
      
      onLogin();
      
      // Navigate to dashboard using React Router
      // navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
         <button onClick={onNavigateToLanding} className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors">
            &larr; Back to Home
         </button>
      <Card className="w-full max-w-sm p-8 animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Join DiviPay!</h1>
            <p className="text-white/60 mt-2">Create your account and start splitting expenses.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-2">Password</label>
                <input
                id="password"
                type="password"
                placeholder="Create a secure password"
                className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/70 mb-2">Confirm Password</label>
                <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="w-full bg-white/10 border-white/20 border text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#20C997]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
            
            <Button type="submit" className="mt-4 w-full py-3" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
        </form>
        <div className="text-center mt-6">
            <p className="text-sm text-white/50">
                Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }} className="font-semibold text-[#20C997] hover:underline">Log in</a>
            </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
