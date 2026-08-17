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
// Biến toàn cục update logs all users
let hasLogged = false;

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
    console.log('🔑 Role hiện tại:', role);
    const adminContent = document.getElementById('adminContent');
    const noAccess = document.getElementById('noAccess');
    if (role === 'admin') {
        adminContent.style.display = 'block';
        noAccess.style.display = 'none';
        loadAllUsers();
    } else {
        adminContent.style.display = 'none';
        noAccess.style.display = 'block';
        console.warn('⛔ Không phải admin, role =', role);
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
        console.log('📦 Số user trong Firestore:', snapshot.size);
        userListEl.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            console.log('👤 User:', doc.id, user);
            const div = document.createElement('div');
            div.className = 'user-card';
            div.innerHTML = `
                <h4>${user.name || 'Không tên'}</h4>
                <p>Email: ${user.email || 'Chưa có email'}</p>
                <p>Vai trò: ${user.role || 'user'}</p>
            `;
            userListEl.appendChild(div);
        });
        if (snapshot.empty) {
            userListEl.innerHTML = '<p>Chưa có user nào.</p>';
        }
    } catch (error) {
        console.error('❌ Lỗi tải danh sách user:', error);
        userListEl.innerHTML = '<p style="color:red">Lỗi tải danh sách, hãy kiểm tra console.</p>';
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

// ========== THEO DÕI TRẠNG THÁI ĐĂNG NHẬP (quan trọng) ==========
auth.onAuthStateChanged(user => {
    console.log('Auth state changed. User:', user ? user.email : 'null');
    const path = window.location.pathname;

    if (user) {
      //log update

      if (!hasLogged) {
            hasLogged = true;
            // Ghi log truy cập cho tất cả users
            logUserAction('login');
        }
        // Nếu đang ở trang login, chuyển hướng theo role
        if (path.endsWith('index.html') || path === '/') {
            redirectUserByRole(user.uid);
        }
        // Nếu đang ở trang admin, kiểm tra quyền admin
        else if (path.endsWith('admin.html')) {
            loadAdminPage();
        }
        // Nếu đang ở trang user, kiểm tra quyền user
        else if (path.endsWith('user.html')) {
            loadUserPage();
        }
    } else {
      // Khi user logout, đặt lại hasLogged để lần đăng nhập sau ghi log lại
        hasLogged = false;
        // Nếu chưa đăng nhập mà đang ở trang admin/user, chuyển về login
        if (path.endsWith('admin.html') || path.endsWith('user.html')) {
            window.location.href = 'index.html';
        }
    }
});

// ========== QUẢN LÝ TAB ==========
function setupTabs() {
    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all
            menuItems.forEach(i => i.classList.remove('active'));
            // Hide all tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            // Add active to clicked menu
            item.classList.add('active');
            // Show corresponding tab panel
            const tabId = 'tab-' + item.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            // Nếu chuyển tab logs, load logs
            if (item.getAttribute('data-tab') === 'logs') {
                loadLogs();
            }
            // Nếu chuyển tab rewards, load rewards
            if (item.getAttribute('data-tab') === 'rewards') {
                loadRewardUsers();
                loadRewardHistory();
            }
            // Nếu chuyển tab users, load users
            if (item.getAttribute('data-tab') === 'users') {
                loadAllUsers();
            }
        });
    });
}

// ========== HIỂN THỊ TÊN ADMIN ==========
async function loadAdminInfo() {
    const user = auth.currentUser;
    if (user) {
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                const name = doc.data().name || 'Admin';
                document.getElementById('adminName').textContent = name;
            }
        } catch (error) {
            console.error('Lỗi lấy tên admin:', error);
        }
    }
}

// ========== LOGS ==========
async function logUserAction(action) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await db.collection('logs').add({
            userId: user.uid,
            email: user.email,
            action: action,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      console.log('📝 Đã ghi log:', action);
    } catch (error) {
        console.error('Lỗi ghi log:', error);
    }
}

async function loadLogs() {
    const logListEl = document.getElementById('logList');
    if (!logListEl) return;
    try {
        const snapshot = await db.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        logListEl.innerHTML = '';
        if (snapshot.empty) {
            logListEl.innerHTML = '<p>Chưa có log nào.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const log = doc.data();
            const div = document.createElement('div');
            div.className = 'log-item';
            const time = log.timestamp ? log.timestamp.toDate().toLocaleString('vi-VN') : 'Chưa rõ';
            div.innerHTML = `<strong>${log.email}</strong> - ${log.action} - <em>${time}</em>`;
            logListEl.appendChild(div);
        });
    } catch (error) {
        console.error('Lỗi tải logs:', error);
        logListEl.innerHTML = '<p style="color:red">Lỗi tải logs.</p>';
    }
}

// ========== PHẦN THƯỞNG (COINS) ==========
async function loadRewardUsers() {
    const selectEl = document.getElementById('rewardUserSelect');
    const listEl = document.getElementById('rewardUserList');
    if (!selectEl || !listEl) return;
    try {
        const snapshot = await db.collection('users').get();
        selectEl.innerHTML = '<option value="">-- Chọn user --</option>';
        listEl.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            // Không hiển thị admin trong danh sách tặng? Có thể tuỳ chỉnh
            if (user.role === 'admin') return; // bỏ qua admin
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${user.name || 'Không tên'} (${user.email || ''})`;
            selectEl.appendChild(option);

            const card = document.createElement('div');
            card.className = 'user-card';
            card.innerHTML = `
                <h4>${user.name || 'Không tên'}</h4>
                <p>Email: ${user.email || ''}</p>
                <p>Coins: ${user.coins || 0}</p>
            `;
            listEl.appendChild(card);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách user:', error);
    }
}

async function sendReward() {
    const selectEl = document.getElementById('rewardUserSelect');
    const amountEl = document.getElementById('coinAmount');
    const user = auth.currentUser;
    if (!user || !selectEl || !amountEl) return;

    const toUserId = selectEl.value;
    const amount = Number(amountEl.value);
    if (!toUserId || !amount || amount <= 0) {
        alert('Vui lòng chọn user và nhập số coins hợp lệ.');
        return;
    }

    try {
        // Kiểm tra người tặng có đủ quyền (admin)
        const adminDoc = await db.collection('users').doc(user.uid).get();
        if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
            alert('Bạn không có quyền tặng coins.');
            return;
        }

        // Cập nhật coins cho người nhận
        await db.collection('users').doc(toUserId).update({
            coins: firebase.firestore.FieldValue.increment(amount)
        });

        // Ghi lịch sử tặng
        await db.collection('rewards').add({
            fromUserId: user.uid,
            fromEmail: user.email,
            toUserId: toUserId,
            amount: amount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Tặng coins thành công!');
        amountEl.value = '';
        // Cập nhật lại danh sách và lịch sử
        loadRewardUsers();
        loadRewardHistory();
    } catch (error) {
        console.error('Lỗi tặng coins:', error);
        alert('Lỗi: ' + error.message);
    }
}

async function loadRewardHistory() {
    const historyEl = document.getElementById('rewardHistory');
    if (!historyEl) return;
    try {
        const snapshot = await db.collection('rewards')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        historyEl.innerHTML = '';
        if (snapshot.empty) {
            historyEl.innerHTML = '<p>Chưa có lịch sử tặng.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const reward = doc.data();
            const div = document.createElement('div');
            div.className = 'reward-item';
            const time = reward.timestamp ? reward.timestamp.toDate().toLocaleString('vi-VN') : 'Chưa rõ';
            div.innerHTML = `<strong>${reward.fromEmail}</strong> → <strong>${reward.toUserId}</strong> : ${reward.amount} coins (${time})`;
            historyEl.appendChild(div);
        });
    } catch (error) {
        console.error('Lỗi tải lịch sử tặng:', error);
        historyEl.innerHTML = '<p style="color:red">Lỗi tải lịch sử.</p>';
    }
}

function setupReward() {
    const sendBtn = document.getElementById('sendRewardBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendReward);
    }
}

// ========== SỬA ĐỔI loadAdminPage ==========
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
        // Gọi các hàm khởi tạo dữ liệu cho admin
        loadAdminInfo();
        loadAllUsers();
        loadRewardUsers();
        loadRewardHistory();
        // Ghi log truy cập
      //--  logUserAction('login');
    } else {
        adminContent.style.display = 'none';
        noAccess.style.display = 'block';
    }
}
