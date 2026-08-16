// Cấu hình Firebase - thay bằng config của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAtX2xcfYZ5j9Fce5KcBwxDLDczueD90ic",
  authDomain: "loginsite-abe7d.firebaseapp.com",
  projectId: "loginsite-abe7d",
  storageBucket: "loginsite-abe7d.firebasestorage.app",
  messagingSenderId: "81287040719",
  appId: "1:81287040719:web:9649e675af4733003d31ba"
};
// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Xử lý form login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('message');
    
    // Kiểm tra email có đúng đuôi @coreq.com không
    if (!email.endsWith('@coreq.com')) {
        messageEl.textContent = 'Email phải có đuôi @coreq.com';
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        messageEl.style.color = 'green';
        messageEl.textContent = 'test ok';
        // Sau này có thể redirect sang trang dashboard
    } catch (error) {
        console.error('Login failed:', error);
        messageEl.style.color = 'red';
        messageEl.textContent = 'Sai email hoặc mật khẩu';
    }
});

// Lắng nghe trạng thái đăng nhập (nếu cần)
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('User logged in:', user.email);
        // Kiểm tra role trong Firestore và điều hướng tương ứng
    } else {
        console.log('User logged out');
    }
});