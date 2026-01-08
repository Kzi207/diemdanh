import React, { useState, useEffect } from 'react';
import { Activity, ClassGroup, Subject } from '../types';
import { getClasses, getActivities, createActivity, getSubjects, createSubject } from '../services/storage';
import { CalendarPlus, FolderOpen, BookOpen, PlusCircle, ArrowRight, QrCode, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const ActivityManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Create States
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityDate, setNewActivityDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [c, s, a] = await Promise.all([getClasses(), getSubjects(), getActivities()]);
        setClasses(c);
        setSubjects(s);
        setActivities(a.reverse());
    } catch (e) {
        console.error("Error loading data", e);
    } finally {
        setLoading(false);
        setIsInitializing(false);
    }
  };

  const handleCreateSubject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if(!newSubjectName.trim() || !selectedClassId) return;
    
    setLoading(true);
    try {
        const newId = Date.now().toString();
        const newSub: Subject = {
          id: newId,
          name: newSubjectName,
          classId: selectedClassId
        };
        await createSubject(newSub);
        setNewSubjectName('');
        // Reload data and auto-select new subject
        await loadData();
        setSelectedSubjectId(newId); 
        alert("Tạo học phần thành công!");
    } catch (e: any) {
        alert("Lỗi tạo học phần: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newActivityName || !selectedSubjectId || !selectedClassId) return;
    
    setLoading(true);
    try {
        const newAct: Activity = {
          id: Date.now().toString(),
          name: newActivityName,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          dateTime: newActivityDate || new Date().toISOString()
        };
        await createActivity(newAct);
        setNewActivityName('');
        setNewActivityDate('');
        await loadData();
        alert("Tạo buổi học thành công!");
    } catch (e: any) {
        alert("Lỗi tạo buổi học: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredActivities = activities.filter(a => a.subjectId === selectedSubjectId);

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Học Phần & Điểm Danh</h1>
          <button onClick={loadData} className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all ${loading ? 'animate-spin bg-blue-50' : ''}`} title="Tải lại dữ liệu">
              <RefreshCw size={20} />
          </button>
      </div>

      {isInitializing ? (
          <div className="flex items-center justify-center flex-1">
              <div className="text-gray-500 flex items-center gap-2">
                  <RefreshCw className="animate-spin"/> Đang tải dữ liệu...
              </div>
          </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* COL 1: CLASSES (3 cols) */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
            <FolderOpen size={18} /> 1. Chọn Lớp
          </div>
          <div className="flex-1 overflow-y-auto">
            {classes.length === 0 && <p className="p-4 text-sm text-gray-400">Chưa có lớp nào. Hãy vào menu "Lớp Học" để tạo trước.</p>}
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); setSelectedSubjectId(''); }}
                className={`w-full text-left p-3 border-b border-gray-100 flex justify-between items-center text-sm ${selectedClassId === c.id ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-l-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span>{c.name}</span>
                {selectedClassId === c.id && <ArrowRight size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* COL 2: SUBJECTS (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
             <BookOpen size={18} /> 2. Học Phần (Môn Học)
          </div>
          
          {selectedClassId ? (
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b bg-white">
                   <form onSubmit={handleCreateSubject} className="flex gap-2">
                      <input 
                         value={newSubjectName} 
                         onChange={e => setNewSubjectName(e.target.value)}
                         placeholder="Tên môn học mới..."
                         className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                         required
                      />
                      <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-1 disabled:opacity-50 transition-colors shrink-0"
                      >
                        {loading ? '...' : <><PlusCircle size={16}/> Thêm</>}
                      </button>
                   </form>
                </div>
                <div className="flex-1 overflow-y-auto">
                   {filteredSubjects.length === 0 && <p className="p-4 text-gray-400 text-sm text-center italic">Chưa có học phần nào.</p>}
                   {filteredSubjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubjectId(s.id)}
                        className={`w-full text-left p-3 border-b border-gray-100 flex justify-between items-center text-sm ${selectedSubjectId === s.id ? 'bg-indigo-50 text-indigo-700 font-medium border-l-4 border-l-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                         <span>{s.name}</span>
                         {selectedSubjectId === s.id && <ArrowRight size={14} />}
                      </button>
                   ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                 <ArrowRight className="mb-2 text-gray-300"/>
                 Chọn một lớp ở cột bên trái để bắt đầu
             </div>
          )}
        </div>

        {/* COL 3: SESSIONS / ACTIVITIES (5 cols) */}
        <div className="md:col-span-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-3 bg-gray-50 border-b font-bold text-gray-700 flex items-center gap-2">
             <CalendarPlus size={18} /> 3. Tạo Buổi Học
          </div>

          {selectedSubjectId ? (
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 border-b bg-white">
                    <form onSubmit={handleCreateActivity} className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Tên hoạt động / Buổi học</label>
                            <input 
                               value={newActivityName} 
                               onChange={e => setNewActivityName(e.target.value)}
                               placeholder="VD: Buổi 1, Thi Giữa Kỳ..."
                               className="border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-full bg-white text-gray-900 shadow-sm"
                               required
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                           <div className="flex-1">
                               <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Clock size={12}/> Thời gian (Ngày & Giờ)</label>
                               <input 
                                  type="datetime-local" 
                                  value={newActivityDate}
                                  onChange={e => setNewActivityDate(e.target.value)}
                                  className="border rounded-lg px-3 py-2 text-sm outline-none w-full bg-white text-gray-900 shadow-sm"
                                  required
                               />
                           </div>
                           <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap disabled:bg-gray-400 transition-colors h-[38px]">
                               {loading ? '...' : 'Tạo mới'}
                           </button>
                        </div>
                    </form>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredActivities.length === 0 && <p className="p-4 text-gray-400 text-sm text-center italic">Chưa có buổi học nào.</p>}
                    {filteredActivities.map(act => (
                        <div key={act.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm flex items-center justify-between bg-white transition-all">
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{act.name}</h4>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Clock size={10}/> {new Date(act.dateTime).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <Link 
                              to={`/attendance/${act.id}`}
                              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-1 text-xs font-bold transition-colors"
                              title="Quét Mã"
                            >
                                <QrCode size={14}/> Điểm Danh
                            </Link>
                        </div>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                 {selectedClassId ? (
                     <>
                        <AlertTriangle className="mb-2 text-orange-300"/>
                        Chọn (hoặc tạo) Học phần ở cột giữa
                     </>
                 ) : (
                     <span className="text-gray-300">...</span>
                 )}
             </div>
          )}
        </div>

      </div>
      )}
    </div>
  );
};

export default ActivityManager;