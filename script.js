// ========== CẤU HÌNH FIREBASE ==========
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
const db = firebase.firestore();

// Biến chống lặp redirect
let redirecting = false;

// ========== HÀM LẤY ROLE TỪ FIRESTORE ==========
async function getUserRole(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            const role = doc.data().role;
            console.log('✅ Role lấy được:', role);
            return role;
        }
        console.warn('⚠️ Document không tồn tại trong Firestore');
        return null;
    } catch (error) {
        console.error('❌ Lỗi khi đọc Firestore:', error);
        return null;
    }
}

// ========== CHUYỂN HƯỚNG THEO ROLE (dùng từ form login) ==========
async function redirectUserByRole(uid) {
    if (redirecting) return;
    redirecting = true;
    try {
        const role = await getUserRole(uid);
        if (role === 'admin') {
            console.log('➡️ Chuyển đến admin.html');
            window.location.href = 'admin.html';
        } else if (role === 'user') {
            console.log('➡️ Chuyển đến user.html');
            window.location.href = 'user.html';
        } else {
            // Không signOut, chỉ hiển thị thông báo
            alert('Tài khoản chưa được phân quyền. Vui lòng liên hệ admin.');
            // Giữ nguyên ở trang login
        }
    } finally {
        redirecting = false;
    }
}

// ========== TRANG ADMIN ==========
async function loadAdminPage() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    const adminContent = document.getElementById('adminContent');
    const noAccess = document.getElementById('noAccess');
    if (role === 'admin') {
        adminContent.style.display = 'block';
        noAccess.style.display = 'none';
        loadAllUsers();
    } else {
        adminContent.style.display = 'none';
        noAccess.style.display = 'block';
    }
}

// ========== TRANG USER ==========
async function loadUserPage() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    const userContent = document.getElementById('userContent');
    const noAccess = document.getElementById('noAccess');
    if (role === 'user') {
        userContent.style.display = 'block';
        noAccess.style.display = 'none';
        loadCurrentUserName();
    } else {
        userContent.style.display = 'none';
        noAccess.style.display = 'block';
    }
}

// ========== QUẢN LÝ NGƯỜI DÙNG (ADMIN) ==========
async function loadAllUsers() {
    const userListEl = document.getElementById('userList');
    if (!userListEl) return;
    try {
        const snapshot = await db.collection('users').get();
        userListEl.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const div = document.createElement('div');
            div.className = 'user-card';
            div.innerHTML = `
                <h4>${user.name || 'Không tên'}</h4>
                <p>Email: ${user.email || ''}</p>
                <p>Vai trò: ${user.role || 'user'}</p>
            `;
            userListEl.appendChild(div);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách user:', error);
    }
}

async function addUser(name, email, password, role) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        await db.collection('users').doc(uid).set({
            name: name,
            email: email,
            role: role
        });
        alert('Tạo user thành công!');
        loadAllUsers();
    } catch (error) {
        console.error('Lỗi tạo user:', error);
        alert('Lỗi: ' + error.message);
    }
}

function setupAddUser() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('newName').value.trim();
            const email = document.getElementById('newEmail').value.trim();
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;
            if (!email.endsWith('@coreq.com')) {
                alert('Email phải có đuôi @coreq.com');
                return;
            }
            addUser(name, email, password, role);
        });
    }
}

// ========== ĐĂNG XUẤT ==========
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// ========== LẤY TÊN USER HIỆN TẠI ==========
async function loadCurrentUserName() {
    const user = auth.currentUser;
    if (user) {
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const name = doc.data().name || user.email;
                document.getElementById('userName').textContent = name;
            }
        } catch (error) {
            console.error('Lỗi lấy tên:', error);
        }
    }
}

// ========== THEO DÕI TRẠNG THÁI (không tự chuyển hướng) ==========
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('✅ Đã đăng nhập:', user.email);
    } else {
        console.log('ℹ️ Chưa đăng nhập hoặc đã đăng xuất');
        // Tự chuyển về login nếu đang ở trang admin/user
        const path = window.location.pathname;
        if (path.endsWith('admin.html') || path.endsWith('user.html')) {
            window.location.href = 'index.html';
        }
    }
});
