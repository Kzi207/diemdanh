import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { markAttendance, getActivities, getStudents } from '../services/storage';
import { Activity, Student } from '../types';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

const AttendanceScanner: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'duplicate';
    message: string;
    student?: Student;
  }>({ status: 'idle', message: 'Đang chờ quét mã...' });

  const lastScanTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      if (!activityId) return;
      const acts = await getActivities();
      const current = acts.find(a => a.id === activityId);
      if (current) setActivity(current);
    };
    init();
    startCamera();

    return () => {
      stopCamera();
    };
  }, [activityId]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera error", err);
      let msg = 'Không thể truy cập camera.';
      if (!window.isSecureContext) {
          msg = 'Lỗi bảo mật: Trình duyệt chặn Camera trên kết nối HTTP (IP LAN). Hãy dùng "Tải ảnh lên" hoặc chạy trên Localhost.';
      } else {
          msg = 'Vui lòng cấp quyền truy cập Camera trên trình duyệt.';
      }
      setCameraError(msg);
      setScanResult({ status: 'error', message: msg });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleScan(code.data);
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code && code.data) {
                handleScan(code.data);
            } else {
                setScanResult({
                    status: 'error',
                    message: 'Không tìm thấy mã QR trong ảnh.'
                });
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async (codeData: string) => {
    const now = Date.now();
    // 3s delay to prevent spam
    if (now - lastScanTimeRef.current < 1000) return;

    lastScanTimeRef.current = now;
    
    // Play beep sound (optional UX)
    // const audio = new Audio('/beep.mp3'); audio.play().catch(() => {});

    if (!activityId) return;

    const result = await markAttendance(activityId, codeData);

    if (result.status === 'success') {
      setScanResult({
        status: 'success',
        message: 'Điểm danh thành công!',
        student: result.student
      });
    } else if (result.status === 'already_present') {
      setScanResult({
        status: 'duplicate',
        message: 'Sinh viên này đã điểm danh rồi!',
        student: result.student
      });
    } else {
      setScanResult({
        status: 'error',
        message: `Mã không hợp lệ: ${codeData}`
      });
    }
  };

  // Determine background color based on status
  const getStatusColor = () => {
    switch(scanResult.status) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'duplicate': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-white border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-800 text-white flex items-center gap-4 shadow-md z-10">
        <button onClick={() => navigate('/activities')} className="p-2 hover:bg-gray-700 rounded-full">
          <ArrowLeft />
        </button>
        <div>
          <h1 className="font-bold text-lg">Điểm Danh</h1>
          <p className="text-sm text-gray-400">{activity?.name}</p>
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        {!cameraError ? (
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
            <div className="text-center p-6 max-w-sm">
                <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500 mb-4">
                    <AlertCircle className="mx-auto mb-2" size={32}/>
                    <p className="text-sm">{cameraError}</p>
                </div>
            </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanner Overlay */}
        {!cameraError && (
            <div className="relative z-10 w-[420px] h-[420px] border-2 border-blue-500 rounded-xlshadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">

                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 -mb-1 -mr-1"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/70 text-sm animate-pulse">Đặt mã QR vào khung</p>
                </div>
            </div>
        )}

        {/* Upload Button Overlay */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all font-medium"
            >
                <ImageIcon size={20} /> Tải ảnh QR lên
            </button>
        </div>
      </div>

      {/* Result Panel */}
      <div className="p-6 bg-white rounded-t-3xl -mt-6 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] min-h-[200px]">
        <div className={`p-4 rounded-xl border-l-4 mb-4 flex items-start gap-3 transition-colors duration-300 ${getStatusColor()}`}>
          {scanResult.status === 'success' && <CheckCircle className="shrink-0 text-green-600" />}
          {scanResult.status === 'duplicate' && <AlertCircle className="shrink-0 text-yellow-600" />}
          {scanResult.status === 'error' && <XCircle className="shrink-0 text-red-600" />}
          {scanResult.status === 'idle' && <Camera className="shrink-0 text-gray-400" />}
          
          <div>
            <h3 className="font-bold text-lg">
                {scanResult.status === 'idle' ? 'Sẵn sàng' : 
                 scanResult.status === 'success' ? 'Thành công' : 
                 scanResult.status === 'duplicate' ? 'Cảnh báo' : 'Lỗi'}
            </h3>
            <p className="text-sm mt-1">{scanResult.message}</p>
          </div>
        </div>

        {scanResult.student && (
          <div className="mt-4 p-4 border border-gray-100 rounded-lg shadow-sm bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Họ tên:</div>
                <div className="font-bold">{scanResult.student.lastName} {scanResult.student.firstName}</div>
                
                <div className="text-gray-500">MSSV:</div>
                <div className="font-bold">{scanResult.student.id}</div>
                
                <div className="text-gray-500">Ngày sinh:</div>
                <div>{scanResult.student.dob}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceScanner;