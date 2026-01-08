import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Search, GraduationCap } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Hero */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
               <GraduationCap size={48} className="text-blue-200" />
               <h1 className="text-3xl font-extrabold tracking-tight">Khánh Duy</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Hệ thống Điểm danh Thông minh</h2>
            <p className="text-blue-100 text-lg opacity-90">
              Quản lý lớp học, học phần và điểm danh sinh viên nhanh chóng, chính xác bằng mã QR.
            </p>
          </div>
          <div className="mt-8 text-sm text-blue-200">
            © 2026 Khánh Duy. All rights reserved.
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center gap-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Chào mừng bạn!</h3>
            <p className="text-gray-500">Vui lòng chọn phương thức truy cập</p>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="group relative flex items-center justify-center gap-4 p-5 rounded-xl border-2 border-blue-600 bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 hover:border-blue-700 transition-all shadow-md"
          >
            <LogIn className="group-hover:scale-110 transition-transform" />
            <span>Đăng nhập</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Hoặc</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button 
            onClick={() => navigate('/public')}
            className="group relative flex items-center justify-center gap-4 p-5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-lg hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
          >
            <Search className="group-hover:scale-110 transition-transform" />
            <span>Tra cứu Danh sách & Điểm danh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;