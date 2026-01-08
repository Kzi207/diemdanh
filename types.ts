export interface Student {
  id: string; // Mã sinh viên
  lastName: string; // Họ đệm
  firstName: string; // Tên
  dob: string; // Ngày sinh
  classId: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  description?: string;
}

// Mới: Học phần (Môn học)
export interface Subject {
  id: string;
  name: string;
  classId: string;
}

// Cập nhật: Buổi học (thuộc về 1 học phần)
export interface Activity {
  id: string;
  name: string; // Tên buổi (VD: Buổi 1, Thi GK)
  dateTime: string;
  subjectId: string; // Liên kết với học phần
  classId: string; // Giữ lại để truy vấn nhanh (redundant but useful)
}

export interface AttendanceRecord {
  id: string;
  activityId: string;
  studentId: string;
  timestamp: string;
}

// Stats types
export interface ActivityStats {
  activityId: string;
  activityName: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  presentRate: number;
}

// User types
export interface User {
  username: string;
  password: string; // Lưu ý: Trong demo lưu plaintext, thực tế nên hash
  name: string;
  role: 'admin' | 'monitor'; // monitor = ban cán sự
}