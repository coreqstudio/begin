// ========== CẤU HÌNH FIREBASE ==========
// Thay bằng cấu hình thực tế của bạn
const firebaseConfig = {
   apiKey: "AIzaSyAtX2xcfYZ5j9Fce5KcBwxDLDczueD90ic",
  authDomain: "loginsite-abe7d.firebaseapp.com",
  projectId: "loginsite-abe7d",
  storageBucket: "loginsite-abe7d.firebasestorage.app",
  messagingSenderId: "81287040719",
  appId: "1:81287040719:web:9649e675af4733003d31ba"
};

// ========== KHỞI TẠO FIREBASE ==========
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ========== CÁC HÀM CHUNG ==========
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // Ghi log login
        await db.collection('auth_logs').add({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            action: 'login',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

async function logout() {
    const user = auth.currentUser;
    if (user) {
        // Ghi log logout trước khi signOut
        await db.collection('auth_logs').add({
            uid: user.uid,
            email: user.email,
            action: 'logout',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        await auth.signOut();
    }
    window.location.href = 'index.html';
}

// Kiểm tra trạng thái đăng nhập và phân quyền
function checkAuth(requiredRole = null) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Chưa đăng nhập -> về trang login
            window.location.href = 'index.html';
            return;
        }
        // Lấy role từ Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            alert('Tài khoản chưa được cấu hình role. Liên hệ admin.');
            await logout();
            return;
        }
        const userData = userDoc.data();
        user.role = userData.role;
        user.isActive = userData.isActive ?? true;

        if (!user.isActive) {
            alert('Tài khoản đã bị khóa.');
            await logout();
            return;
        }

        if (requiredRole && user.role !== requiredRole) {
            // Nếu yêu cầu role cụ thể (ví dụ admin) mà không đúng -> chuyển hướng tương ứng
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
            return;
        }

        // Nếu không yêu cầu role, giữ nguyên trang
        console.log('Current user:', user.email, 'Role:', user.role);
    });
}
