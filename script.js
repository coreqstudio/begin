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

// ========== CÁC HÀM CHUNG ==========

// Lấy role của user từ Firestore
// Thêm biến chống lặp redirect
let redirecting = false;

// Hàm lấy role (nên throw nếu lỗi thay vì trả null)
async function getUserRole(uid) {
    try {
        const doc = await db.collection('users').doc(uid).get();
        if (doc.exists) {
            return doc.data().role;
        }
        throw new Error('Tài khoản chưa được phân quyền trong Firestore');
    } catch (error) {
        console.error('Lỗi lấy role:', error);
        return null;
    }
}

// Chuyển hướng theo role (chỉ dùng từ trang login)
async function redirectUserByRole(uid) {
    const role = await getUserRole(uid);
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else if (role === 'user') {
        window.location.href = 'user.html';
    } else {
        await auth.signOut();
        alert('Tài khoản chưa được phân quyền. Vui lòng liên hệ admin.');
        window.location.href = 'index.html';
    }
}

// Hàm kiểm tra quyền admin nhưng không redirect, chỉ ẩn/hiện nội dung
async function loadAdminPage() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    if (role !== 'admin') {
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('noAccess').style.display = 'block';
    } else {
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('noAccess').style.display = 'none';
        loadAllUsers(); // Load danh sách user nếu là admin
    }
}

// Tương tự cho user
async function loadUserPage() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    if (role !== 'user') {
        document.getElementById('userContent').style.display = 'none';
        document.getElementById('noAccess').style.display = 'block';
    } else {
        document.getElementById('userContent').style.display = 'block';
        document.getElementById('noAccess').style.display = 'none';
        loadCurrentUserName();
    }
}

// Sửa onAuthStateChanged để chỉ redirect từ trang login
auth.onAuthStateChanged(async user => {
    if (user) {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path === '/') {
            if (!redirecting) {
                redirecting = true;
                await redirectUserByRole(user.uid);
                redirecting = false;
            }
        }
    } else {
        // Nếu chưa đăng nhập và đang ở admin/user thì về login
        const path = window.location.pathname;
        if (path.endsWith('admin.html') || path.endsWith('user.html')) {
            window.location.href = 'index.html';
        }
    }
});

// Kiểm tra quyền admin, nếu không phải admin chuyển về trang user
async function checkAdminAccess() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    if (role !== 'admin') {
        window.location.href = 'user.html';
    }
}

// Kiểm tra quyền user, nếu không phải user chuyển về trang admin
async function checkUserAccess() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    const role = await getUserRole(user.uid);
    if (role !== 'user') {
        window.location.href = 'admin.html';
    }
}

// Thiết lập nút đăng xuất (nếu có)
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

// ========== CÁC HÀM CHO TRANG ADMIN ==========

// Load danh sách user từ Firestore
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
        console.error('Lỗi tải user:', error);
    }
}

// Thêm user mới (chỉ admin mới gọi được)
async function addUser(name, email, password, role) {
    try {
        // Tạo user bằng Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;

        // Lưu thông tin vào Firestore
        await db.collection('users').doc(uid).set({
            name: name,
            email: email,
            role: role
        });

        alert('Tạo user thành công!');
        loadAllUsers(); // Cập nhật danh sách
    } catch (error) {
        console.error('Lỗi tạo user:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Thiết lập form thêm user
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

// ========== CÁC HÀM CHO TRANG USER ==========

// Lấy tên người dùng hiện tại
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

// ========== XỬ LÝ TRẠNG THÁI ĐĂNG NHẬP CHUNG ==========
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('Đã đăng nhập:', user.email);
        // Nếu đang ở trang login, chuyển theo role
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            redirectUserByRole(user.uid);
        }
    } else {
        console.log('Chưa đăng nhập');
        // Nếu đang ở trang admin/user, chuyển về login
        if (window.location.pathname.endsWith('admin.html') || window.location.pathname.endsWith('user.html')) {
            window.location.href = 'index.html';
        }
    }
});
