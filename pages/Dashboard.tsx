import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, BarChart3, QrCode, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { getClasses, getActivities, getStudents, getApiUrl, checkSystemStatus } from '../services/storage';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ classes: 0, students: 0, activities: 0 });
  const [hasServer, setHasServer] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // 1. Check API URL Config
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        setHasServer(false);
        setLoading(false);
        return;
    }

    setLoading(true);
    setConnectionError(false);

    // 2. Check System Status FIRST
    // This avoids triggering 3 parallel fetch errors if server is down
    const status = await checkSystemStatus();
    if (status.status === 'error') {
        setConnectionError(true);
        setLoading(false);
        return;
    }
    
    setHasServer(true);

    // 3. Load Data
    try {
        const [c, s, a] = await Promise.all([
            getClasses(),
            getStudents(),
            getActivities()
        ]);
        
        setStats({
          classes: c.length,
          students: s.length,
          activities: a.length
        });
    } catch (e) {
        console.error("Failed to load stats", e);
        setConnectionError(true);
    } finally {
        setLoading(false);
    }
  };

  if (!hasServer) {
      return (
          <div className="p-6">
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl shadow-sm mb-6">
                  <div className="flex items-start gap-4">
                      <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                          <AlertTriangle size={32}/>
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-orange-800 mb-2">Chưa cấu hình Server</h2>
                          <p className="text-orange-700 mb-4">
                              Hệ thống chưa tìm thấy cấu hình URL Server.
                          </p>
                          <Link to="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                              <Settings size={18}/> Đi tới Cài đặt
                          </Link>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (connectionError) {
      return (
          <div className="p-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mb-6">
                  <div className="flex items-start gap-4">
                      <div className="bg-red-100 p-3 rounded-full text-red-600">
                          <AlertTriangle size={32}/>
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-red-800 mb-2">Mất kết nối Server</h2>
                          <p className="text-red-700 mb-4">
                              Không thể kết nối tới Server. Vui lòng kiểm tra:
                          </p>
                          <ul className="list-disc list-inside text-sm text-red-800 mb-4 space-y-1">
                              <li>File <code>server.js</code> đã được chạy chưa? (<code>node server.js</code>)</li>
                              <li>Địa chỉ IP Server có đúng không? ({getApiUrl()})</li>
                          </ul>
                          <div className="flex gap-3">
                              <button onClick={loadStats} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                                  <RefreshCw size={18}/> Thử lại
                              </button>
                              <Link to="/settings" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium">
                                  <Settings size={18}/> Cấu hình lại
                              </Link>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
                 <p className="mb-2 text-gray-400">// Hướng dẫn chạy server (Terminal):</p>
                 <p className="text-green-400">node server.js</p>
              </div>
          </div>
      );
  }

  const cards = [
    { 
      title: 'Lớp Học', 
      value: stats.classes, 
      icon: Users, 
      color: 'bg-blue-500', 
      link: '/classes',
      desc: 'Quản lý lớp và sinh viên'
    },
    { 
      title: 'Hoạt Động', 
      value: stats.activities, 
      icon: Calendar, 
      color: 'bg-green-500', 
      link: '/activities',
      desc: 'Tạo môn học & điểm danh'
    },
    { 
      title: 'Tổng Sinh Viên', 
      value: stats.students, 
      icon: QrCode, 
      color: 'bg-purple-500', 
      link: '/classes',
      desc: 'Dữ liệu sinh viên toàn hệ thống'
    },
    { 
      title: 'Báo Cáo', 
      value: 'Thống kê', 
      icon: BarChart3, 
      color: 'bg-orange-500', 
      link: '/reports',
      desc: 'Xuất file CSV và xem biểu đồ'
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
         <h1 className="text-3xl font-bold text-gray-800">Tổng quan</h1>
         {loading && <div className="text-blue-600 flex items-center gap-2"><RefreshCw className="animate-spin" size={20}/> Đang tải...</div>}
      </div>
      <p className="text-gray-500 mb-8 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        Hệ thống đang chạy Online (Server Mode)
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Link 
            key={index} 
            to={card.link}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 block group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                <card.icon size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-800">{card.value}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">{card.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Hướng dẫn nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 1: Tạo Lớp & Nhập Liệu</span>
            Vào menu "Lớp Học", tạo lớp mới, sau đó upload file Excel chứa danh sách sinh viên. Dữ liệu sẽ được lưu vào db.json.
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 2: Xuất QR Code</span>
            Trong chi tiết lớp học, nhấn "Xuất PDF Mã QR" để tải file PDF chứa mã QR cho toàn bộ sinh viên trong lớp để in ấn.
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="font-bold text-blue-600 block mb-2">Bước 3: Tạo Hoạt Động & Điểm Danh</span>
            Vào "Hoạt Động" để tạo buổi học mới. Sau đó dùng chức năng "Điểm Danh QR" để quét mã sinh viên.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;