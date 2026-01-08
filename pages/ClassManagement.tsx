import React, { useState, useEffect, useRef } from 'react';
import { ClassGroup, Student } from '../types';
import { getClasses, createClass, getStudents, importStudents, deleteClass, updateClass } from '../services/storage';
import { Plus, Upload, Download, FileSpreadsheet, Eye, Trash2, Edit2, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  // Edit/Delete State
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchData = async () => {
    try {
        const data = await getClasses();
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
           // Do not auto select if filtering or doing other things, mostly optional logic
           // setSelectedClassId(data[0].id);
        }
    } catch (e) { console.error(e); }
  };

  const loadClassStudents = async (classId: string) => {
    try {
        const data = await getStudents(classId);
        setStudents(data);
    } catch (e) { console.error(e); }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    const newClass: ClassGroup = {
      id: newClassName.trim(), // Use name as ID for simplicity in this app version
      name: newClassName.trim(),
    };
    await createClass(newClass);
    setNewClassName('');
    setShowCreateModal(false);
    fetchData();
  };

  const handleUpdateClass = async (id: string) => {
     if (!editName.trim()) return;
     await updateClass(id, editName);
     setEditingClassId(null);
     fetchData();
  };

  const handleDeleteClass = async (id: string, name: string) => {
     if (window.confirm(`Bạn có chắc muốn xóa lớp "${name}"? Thao tác này sẽ xóa lớp khỏi danh sách (Dữ liệu SV vẫn còn trong DB).`)) {
        await deleteClass(id);
        if (selectedClassId === id) setSelectedClassId(null);
        fetchData();
     }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClassId) {
      alert("Vui lòng chọn lớp trước khi nhập sinh viên!");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const newStudents: Student[] = [];
        
        // Format: [STT, Mã SV, Họ Đệm, Tên, Ngày Sinh]
        for (let i = 1; i < data.length; i++) {
          const row: any = data[i];
          if (row && row[1] !== undefined) {
             const idStr = String(row[1]).trim();
             if (idStr) {
                newStudents.push({
                    id: idStr,
                    lastName: row[2] ? String(row[2]).trim() : '',
                    firstName: row[3] ? String(row[3]).trim() : '',
                    dob: row[4] ? String(row[4]).trim() : '',
                    classId: selectedClassId
                });
             }
          }
        }

        if (newStudents.length > 0) {
          await importStudents(newStudents);
          await loadClassStudents(selectedClassId);
          alert(`Đã lưu thành công ${newStudents.length} sinh viên!`);
        } else {
            alert("Không tìm thấy dữ liệu. Kiểm tra cột Mã SV.");
        }
      } catch (error) {
        alert("Lỗi: " + (error as Error).message);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const createStudentCardImage = async (student: Student): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 250);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 596, 246);

    try {
        const qrDataUrl = await QRCode.toDataURL(student.id, { width: 200, margin: 1 });
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve) => { qrImg.onload = resolve; });
        ctx.drawImage(qrImg, 20, 25, 200, 200);
    } catch (e) {}

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${student.lastName} ${student.firstName}`, 240, 80);
    ctx.font = '24px Arial';
    ctx.fillText(`MSSV: ${student.id}`, 240, 130);
    ctx.font = '22px Arial';
    ctx.fillStyle = '#555555';
    ctx.fillText(`Ngày sinh: ${student.dob}`, 240, 170);
    return canvas.toDataURL('image/png');
  };

  const generateQRPDF = async () => {
    if (students.length === 0) {
      alert("Lớp chưa có sinh viên."); return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    const imgWidth = 170;
    const imgHeight = 70;
    
    doc.setFont("helvetica", "bold");
    doc.text(`QR Code - ${classes.find(c => c.id === selectedClassId)?.name}`, pageWidth / 2, 10, { align: 'center' });

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (yPos + imgHeight > 280) {
        doc.addPage();
        yPos = 20;
      }
      const imgData = await createStudentCardImage(s);
      doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 10;
    }
    doc.save(`QR_Lop_${selectedClassId}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản Lý Lớp Học</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Tạo Lớp Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
            Danh sách lớp
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {classes.map(cls => (
              <div 
                key={cls.id} 
                className={`group flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedClassId === cls.id ? 'bg-blue-50' : ''}`}
              >
                 {editingClassId === cls.id ? (
                    <div className="flex flex-1 items-center gap-2">
                        <input 
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border p-1 rounded text-sm bg-white text-gray-900"
                        />
                        <button onClick={() => handleUpdateClass(cls.id)} className="text-green-600"><Check size={16}/></button>
                        <button onClick={() => setEditingClassId(null)} className="text-gray-500"><X size={16}/></button>
                    </div>
                 ) : (
                    <>
                        <button 
                            onClick={() => setSelectedClassId(cls.id)} 
                            className={`flex-1 text-left ${selectedClassId === cls.id ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
                        >
                            {cls.name}
                        </button>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setEditingClassId(cls.id); setEditName(cls.name); }} 
                                className="text-gray-400 hover:text-blue-500"
                            >
                                <Edit2 size={14}/>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }} 
                                className="text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    </>
                 )}
              </div>
            ))}
            {classes.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">Chưa có lớp nào</div>}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {selectedClassId ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Sinh viên lớp: {classes.find(c => c.id === selectedClassId)?.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors disabled:bg-gray-400"
                  >
                    {isUploading ? 'Đang lưu...' : <><FileSpreadsheet size={16} /> Nhập Excel</>}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                  
                  <button 
                    onClick={generateQRPDF}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Download size={16} /> Xuất PDF QR
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">MSSV</th>
                      <th className="px-6 py-3">Họ và tên</th>
                      <th className="px-6 py-3">Ngày sinh</th>
                      <th className="px-6 py-3 text-center">QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.id}</td>
                        <td className="px-6 py-4">{student.lastName} {student.firstName}</td>
                        <td className="px-6 py-4">{student.dob}</td>
                        <td className="px-6 py-4 text-center">
                          <Eye className="w-5 h-5 mx-auto text-gray-400 cursor-pointer hover:text-blue-500" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              Chọn một lớp để quản lý
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Tạo Lớp Mới</h3>
            <input 
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Tên lớp (VD: K15-CNTT)"
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
              <button onClick={handleCreateClass} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;