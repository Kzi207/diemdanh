import React, { useEffect, useState } from 'react';
import { Activity, AttendanceRecord, Student, ClassGroup } from '../types';
import { getActivities, getAttendance, getClasses, getStudents } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Search, Filter, UserCheck, UserX } from 'lucide-react';
import * as XLSX from 'xlsx';

const Reports: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [statsData, setStatsData] = useState<any[]>([]);
  const [detailList, setDetailList] = useState<{ student: Student, status: string, time?: string }[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (selectedActivityId) {
      calculateActivityStats(selectedActivityId);
    }
  }, [selectedActivityId]);

  const loadActivities = async () => {
    const data = await getActivities();
    setActivities(data.reverse());
    if (data.length > 0) setSelectedActivityId(data[0].id);
  };

  const calculateActivityStats = async (actId: string) => {
    const activity = activities.find(a => a.id === actId);
    if (!activity) return;

    const [students, attendance, classInfo] = await Promise.all([
      getStudents(activity.classId),
      getAttendance(actId),
      getClasses()
    ]);

    // Chart Data
    setStatsData([
      { name: 'Đã điểm danh', value: attendance.length },
      { name: 'Vắng mặt', value: students.length - attendance.length }
    ]);

    // Detail List
    const details = students.map(s => {
      const record = attendance.find(r => r.studentId === s.id);
      return {
        student: s,
        status: record ? 'Có mặt' : 'Vắng',
        time: record ? new Date(record.timestamp).toLocaleTimeString() : '-'
      };
    });
    setDetailList(details);
  };

  const exportExcel = (type: 'all' | 'present' | 'absent') => {
    if (!selectedActivityId) return;
    const activity = activities.find(a => a.id === selectedActivityId);
    
    let dataToExport = detailList;
    let fileNameSuffix = "TatCa";

    if (type === 'present') {
        dataToExport = detailList.filter(d => d.status === 'Có mặt');
        fileNameSuffix = "DaDiemDanh";
    } else if (type === 'absent') {
        dataToExport = detailList.filter(d => d.status === 'Vắng');
        fileNameSuffix = "VangMat";
    }

    if (dataToExport.length === 0) {
        alert("Không có dữ liệu tương ứng để xuất file.");
        return;
    }

    // Prepare data for Excel
    const data = dataToExport.map((d, index) => ({
      'STT': index + 1,
      'Mã SV': d.student.id,
      'Họ đệm': d.student.lastName,
      'Tên': d.student.firstName,
      'Ngày sinh': d.student.dob,
      'Trạng thái': d.status,
      'Giờ điểm danh': d.time,
      'Hoạt động': activity?.name
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DiemDanh");
    XLSX.writeFile(wb, `DiemDanh_${fileNameSuffix}_${activity?.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Thống Kê & Báo Cáo</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
           <select 
             value={selectedActivityId}
             onChange={(e) => setSelectedActivityId(e.target.value)}
             className="border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none flex-1 md:min-w-[250px]"
           >
             {activities.map(a => (
               <option key={a.id} value={a.id}>{a.name} - {new Date(a.dateTime).toLocaleDateString()}</option>
             ))}
           </select>
           
           <div className="flex gap-2 flex-wrap">
               <button 
                 onClick={() => exportExcel('present')}
                 className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất danh sách sinh viên có mặt"
               >
                 <UserCheck size={16} /> Xuất Đã Điểm Danh
               </button>
               <button 
                 onClick={() => exportExcel('absent')}
                 className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất danh sách sinh viên vắng mặt"
               >
                 <UserX size={16} /> Xuất Vắng
               </button>
               <button 
                 onClick={() => exportExcel('all')}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium whitespace-nowrap"
                 title="Xuất tất cả"
               >
                 <Download size={16} /> Tất Cả
               </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4 text-center">Biểu đồ tỷ lệ tham gia</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Tổng sinh viên: {detailList.length}
          </div>
        </div>

        {/* Detailed List Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 flex justify-between">
              <span>Chi tiết điểm danh</span>
              <span className="text-sm font-normal text-gray-500">Lọc: Tất cả</span>
           </div>
           <div className="overflow-x-auto max-h-[500px]">
             <table className="w-full text-sm text-left text-gray-500">
               <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                 <tr>
                   <th className="px-6 py-3">MSSV</th>
                   <th className="px-6 py-3">Họ Tên</th>
                   <th className="px-6 py-3">Trạng thái</th>
                   <th className="px-6 py-3">Thời gian</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {detailList.map((d, i) => (
                   <tr key={i} className="hover:bg-gray-50">
                     <td className="px-6 py-4 font-medium">{d.student.id}</td>
                     <td className="px-6 py-4">{d.student.lastName} {d.student.firstName}</td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.status === 'Có mặt' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {d.status}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-gray-400">{d.time}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;