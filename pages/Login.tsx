import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/storage';
import { Lock, LogIn, User } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const success = await login(username, password);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('Sai tên đăng nhập hoặc mật khẩu!');
        }
    } catch (e) {
        setError('Có lỗi xảy ra khi kết nối server.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-6 flex flex-col items-center">
          <div className="bg-white p-3 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-white">Đăng Nhập</h2>
          <p className="text-blue-100 mt-2">Hệ thống điểm danh</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Tên đăng nhập
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-gray-400" size={18}/>
                </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-gray-900"
                placeholder="VD: admin"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-gray-400" size={18}/>
                </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-gray-900"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
            <p className="text-xs text-gray-400 mt-2 text-right">Quên mật khẩu</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Đang kiểm tra...' : <><LogIn size={20} /> Đăng nhập</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;