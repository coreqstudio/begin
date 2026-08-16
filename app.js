// ========== CẤU HÌNH FIREBASE ==========
// Thay bằng cấu hình thực tế của bạn
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
    
    // Kiểm tra email đuôi @coreq.com
    if (!email.endsWith('@coreq.com')) {
        messageEl.textContent = 'Email phải có đuôi @coreq.com';
        messageEl.style.color = 'red';
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        messageEl.textContent = 'test ok';
        messageEl.style.color = 'green';
    } catch (error) {
        console.error('Login failed:', error);
        messageEl.textContent = 'Sai email hoặc mật khẩu';
        messageEl.style.color = 'red';
    }
});
