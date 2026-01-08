import React, { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, saveApiConfig, getApiUrl, checkSystemStatus, resetApiConfig } from '../services/storage';
import { Save, Server, UserPlus, Trash2, Users, CheckCircle, XCircle, RefreshCw, Globe, AlertTriangle, Terminal, RotateCcw } from 'lucide-react';
import { User } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connection' | 'users'>('connection');
  
  const [apiUrl, setApiUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error' | 'warning'>('checking');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // User Mgmt State
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'monitor' as const });
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setApiUrl(getApiUrl());
    checkConnection();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && serverStatus === 'ok') fetchUsers();
  }, [activeTab, serverStatus]);

  const checkConnection = async () => {
      setServerStatus('checking');
      const res = await checkSystemStatus();
      setServerStatus(res.status as any);
      setStatusMsg(res.message);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiConfig(apiUrl, '');
    setIsSaved(true);
    checkConnection();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetConfig = () => {
      resetApiConfig();
      setApiUrl(getApiUrl()); // Reload default
      checkConnection();
      alert("Đã reset về mặc định!");
  };

  const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
          const data = await getUsers();
          setUsers(data);
      } catch (error) {
          console.error(error);
      } finally {
          setLoadingUsers(false);
      }
  };

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await createUser(newUser);
          setNewUser({ username: '', password: '', name: '', role: 'monitor' });
          fetchUsers();
          alert("Thêm tài khoản thành công!");
      } catch (e) {
          alert("Lỗi: " + (e as Error).message);
      }
  };

  const handleDeleteUser = async (username: string) => {
      if(!window.confirm(`Bạn chắc chắn muốn xóa user: ${username}?`)) return;
      try {
          await deleteUser(username);
          fetchUsers();
      } catch (e) {
          alert("Lỗi xóa user");
      }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt Hệ thống</h1>

      <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'connection' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Globe size={18} /> Kết nối Database
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Users size={18} /> Quản lý Tài khoản
          </button>
      </div>

      {activeTab === 'connection' && (
        <div className="space-y-6 max-w-3xl animate-fadeIn">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Cấu hình Server (Node.js)</h2>
                     <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 font-bold ${
                         serverStatus === 'ok' ? 'bg-green-100 text-green-700' : 
                         serverStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                     }`}>
                         {serverStatus === 'ok' ? <CheckCircle size={14}/> : 
                          serverStatus === 'error' ? <XCircle size={14}/> : <RefreshCw size={14} className="animate-spin"/>}
                         {statusMsg || 'Đang kiểm tra...'}
                     </div>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Server API URL
                        </label>
                        <input 
                            type="url" 
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                            placeholder="http://localhost:4000"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Mặc định là: <code>https://database.kzii.site</code></p>
                        
                        <div className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                            <p>Điền URL của server API</p>
                            <p>Lỗi vui lòng liên hệ fb: https://www.facebook.com/kzi207</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isSaved ? 'Đã lưu!' : <><Save size={18} /> Lưu & Kết nối</>}
                        </button>
                        <button 
                            type="button"
                            onClick={handleResetConfig}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            title="Reset về mặc định"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Create User Form */}
            <div className="md:col-span-1">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserPlus size={20}/> Thêm Tài khoản</h3>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                            <input 
                                type="text" required
                                value={newUser.username}
                                onChange={e => setNewUser({...newUser, username: e.target.value})}
                                className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <input 
                                type="text" required
                                value={newUser.password}
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                                className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                            <input 
                                type="text" required
                                value={newUser.name}
                                onChange={e => setNewUser({...newUser, name: e.target.value})}
                                className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                            <select 
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                                className="w-full border p-2 rounded-lg outline-none focus:border-blue-500 bg-white text-gray-900"
                            >
                                <option value="monitor">Ban cán sự</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>
                        <button type="submit" disabled={serverStatus !== 'ok'} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400">
                            Thêm Người Dùng
                        </button>
                    </form>
                 </div>
            </div>

            {/* User List */}
            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={20}/> Danh sách Người dùng</h3>
                    
                    {serverStatus !== 'ok' ? (
                        <div className="p-4 bg-orange-50 text-orange-700 rounded-lg text-sm">Vui lòng kết nối Server để quản lý tài khoản.</div>
                    ) : loadingUsers ? <p className="text-gray-500">Đang tải...</p> : (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-700 font-semibold">
                                    <tr>
                                        <th className="p-3">Username</th>
                                        <th className="p-3">Họ Tên</th>
                                        <th className="p-3">Vai trò</th>
                                        <th className="p-3 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.username} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{u.username}</td>
                                            <td className="p-3">{u.name}</td>
                                            <td className="p-3">{u.role}</td>
                                            <td className="p-3 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(u.username)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Trống</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;