import { Student, ClassGroup, Activity, AttendanceRecord, User, Subject } from '../types';

// CONFIG KEYS
const KEYS = {
  API_URL: 'kzi_api_url',
  API_KEY: 'kzi_api_key',
  SESSION: 'kzi_session'
};

// --- CONFIGURATION ---

export const getApiUrl = () => {
  // Ưu tiên config đã lưu trong Cài đặt
  const saved = localStorage.getItem(KEYS.API_URL);
  if (saved) return saved;

  // Nếu chưa có, tự động đoán URL
  const hostname = window.location.hostname;
  
  // Nếu hostname rỗng (chạy file://) hoặc là localhost, dùng localhost
  const host = hostname && hostname !== '' ? hostname : 'localhost';
  
  return `https://database.kzii.site`;
};

export const saveApiConfig = (url: string, key: string) => {
  // Loại bỏ dấu / ở cuối nếu có
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  localStorage.setItem(KEYS.API_URL, cleanUrl);
  localStorage.setItem(KEYS.API_KEY, key);
};

export const resetApiConfig = () => {
  localStorage.removeItem(KEYS.API_URL);
  localStorage.removeItem(KEYS.API_KEY);
};

// --- REST CLIENT ---

const fetchAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
  const baseUrl = getApiUrl();
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${baseUrl}/${endpoint}`, options);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return await res.json();
  } catch (e) {
    // Không log console.error ở đây để tránh spam console khi mất kết nối (Dashboard đã xử lý)
    throw e;
  }
};

// --- EXPORTS ---

// 1. SYSTEM
export const checkSystemStatus = async (): Promise<{ status: string, message: string }> => {
  try {
    const res = await fetchAPI('status');
    return { status: 'ok', message: `Đã kết nối: ${res.mode}` };
  } catch (e) {
    return { status: 'error', message: 'Không tìm thấy Server (Chạy node server.js)' };
  }
};

// 2. USERS & AUTH
export const getUsers = async (): Promise<User[]> => fetchAPI('users');

export const createUser = async (user: User): Promise<void> => {
  await fetchAPI('users', 'POST', user);
};

export const deleteUser = async (username: string): Promise<void> => {
  await fetchAPI('users', 'DELETE', { username });
};

export const login = async (username: string, password: string): Promise<boolean> => {
  if (username === 'admin' && password === 'admin123') {
    const adminUser: User = { username: 'admin', password: '', name: 'Super Admin', role: 'admin' };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(adminUser));
    return true;
  }
  try {
      const users = await getUsers();
      const user = users.find(u => u.username === username);
      if (user && user.password === password) {
          localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
          return true;
      }
  } catch (e) {
      console.error("Login Error", e);
  }
  return false;
};

export const isLoggedIn = () => !!localStorage.getItem(KEYS.SESSION);
export const logout = () => localStorage.removeItem(KEYS.SESSION);
export const getCurrentUser = () => JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null');


// 3. CLASSES
export const getClasses = async (): Promise<ClassGroup[]> => fetchAPI('classes');

export const createClass = async (cls: ClassGroup): Promise<void> => {
  await fetchAPI('classes', 'POST', cls);
};

export const updateClass = async (id: string, name: string): Promise<void> => {
    await fetchAPI('classes', 'PUT', { id, name });
};

export const deleteClass = async (id: string): Promise<void> => {
    await fetchAPI('classes', 'DELETE', { id });
};

// 4. SUBJECTS
export const getSubjects = async (): Promise<Subject[]> => fetchAPI('subjects');

export const createSubject = async (sub: Subject): Promise<void> => {
    await fetchAPI('subjects', 'POST', sub);
};

// 5. ACTIVITIES
export const getActivities = async (): Promise<Activity[]> => fetchAPI('activities');

export const createActivity = async (act: Activity): Promise<void> => {
    await fetchAPI('activities', 'POST', act);
};

// 6. STUDENTS
export const getStudents = async (classId?: string): Promise<Student[]> => {
    const query = classId ? `?classId=${classId}` : '';
    return fetchAPI(`students${query}`);
};

export const importStudents = async (students: Student[]): Promise<void> => {
    await fetchAPI('students', 'POST', students);
};

// 7. ATTENDANCE
export const getAttendance = async (activityId?: string): Promise<AttendanceRecord[]> => {
    const query = activityId ? `?activityId=${activityId}` : '';
    return fetchAPI(`attendance${query}`);
};

export const markAttendance = async (activityId: string, studentId: string): Promise<{ status: string, student?: Student }> => {
    try {
        // Lấy danh sách SV để kiểm tra thông tin
        const allStudents = await getStudents(); 
        const student = allStudents.find(s => s.id === studentId);

        if (!student) return { status: 'student_not_found' };

        // Lấy lịch sử điểm danh của buổi này để check trùng
        const attendance = await getAttendance(activityId);
        const exists = attendance.some(a => a.studentId === studentId);

        if (exists) {
            return { status: 'already_present', student };
        }

        // Gửi request
        const record: AttendanceRecord = {
            id: Date.now().toString(),
            activityId,
            studentId,
            timestamp: new Date().toISOString()
        };
        
        await fetchAPI('attendance', 'POST', record);
        return { status: 'success', student };

    } catch (e) {
        console.error(e);
        return { status: 'error' };
    }
};

// --- DUMMY EXPORTS ---
export const getStorageMode = () => 'server';
export const setStorageMode = () => {};
export const getSupabaseUrl = () => "";
export const saveSupabaseConfig = () => {};
export const resetSupabaseClient = () => {};
export const exportDatabase = async () => "{}";
export const importDatabase = () => false;