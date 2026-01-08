import React, { useState, useEffect } from 'react';
import { getClasses, getSubjects, getActivities } from '../services/storage';
import { ClassGroup, Subject, Activity } from '../types';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowRight } from 'lucide-react';

const QuickScan: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    Promise.all([getClasses(), getSubjects(), getActivities()]).then(([c, s, a]) => {
        setClasses(c);
        setSubjects(s);
        setActivities(a.reverse()); // Show newest first
    });
  }, []);

  const filteredSubjects = subjects.filter(s => s.classId === selectedClass);
  const filteredActivities = activities.filter(a => a.subjectId === selectedSubject);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><QrCode/> Quét Nhanh</h1>
      
      <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. Chọn Lớp</label>
            <select 
                className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500 bg-white text-gray-900"
                value={selectedClass}
                onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}
            >
                <option value="">-- Chọn lớp cần điểm danh --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {selectedClass && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2. Chọn Học Phần</label>
                <select 
                    className="w-full border p-3 rounded-lg outline-none focus:ring-2 ring-blue-500 bg-white text-gray-900"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                >
                    <option value="">-- Chọn môn học --</option>
                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        )}

        {selectedSubject && (
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">3. Chọn Buổi Học để bắt đầu</label>
                {filteredActivities.length === 0 && <p className="text-gray-400 italic">Chưa có buổi học nào.</p>}
                {filteredActivities.map(act => (
                    <button
                        key={act.id}
                        onClick={() => navigate(`/attendance/${act.id}`)}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                    >
                        <div className="text-left">
                            <span className="font-bold text-gray-800 block">{act.name}</span>
                            <span className="text-xs text-gray-500">{new Date(act.dateTime).toLocaleString('vi-VN')}</span>
                        </div>
                        <ArrowRight className="text-gray-300 group-hover:text-blue-600"/>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default QuickScan;