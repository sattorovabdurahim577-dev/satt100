// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    // In a real app, this would be fetched from a server or localStorage.
    // WARNING: Storing passwords in plaintext is extremely insecure.
    // This is for demonstration purposes only. Use hashing in a real application.
    let users = {
        "005667407": { pass: "12", name: "Admin", isAdmin: true, avatar: "", isVerified: true }
    };
    let currentUser = null;
    let verificationRequests = [];
    let replyData = null;
    let bannerList = [
        "https://via.placeholder.com/1000x200/1c252e/ffffff?text=NexusChat",
        "https://via.placeholder.com/1000x200/005c4b/ffffff?text=Secure",
        "https://via.placeholder.com/1000x200/0081ff/ffffff?text=Fast"
    ];
    let bIdx = 0;
    let sliderInterval;

    // --- DOM ELEMENT SELECTORS ---
    const msgInput = document.getElementById('msg-input');
    const chatMessages = document.getElementById('chat-messages');
    const replyBox = document.getElementById('reply-box');
    const replyText = document.querySelector('.reply-text');

    // --- UI FUNCTIONS ---

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    function toggleAuth(isReg) {
        document.getElementById('reg-fields').style.display = isReg ? 'block' : 'none';
        document.getElementById('login-fields').style.display = isReg ? 'none' : 'block';
    }

    function updateUI() {
        if (!currentUser) return;
        const name = currentUser.name || currentUser.phone;
        document.getElementById('my-name-display').innerText = name;
        const avatarTop = document.getElementById('my-avatar-top');
        avatarTop.innerHTML = currentUser.avatar ? `<img src="${currentUser.avatar}" alt="Avatar">` : name[0];
        document.getElementById('admin-badge').style.display = currentUser.isVerified ? "inline" : "none";
        
        const adminSection = document.getElementById('admin-requests-section');
        if (currentUser.isAdmin) {
            adminSection.style.display = "block";
            updateRequestsList();
        } else {
            adminSection.style.display = "none";
        }
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`tab-`).classList.add('active');
        document.getElementById(`-section`).classList.add('active');
    }

    function openChat(chatId) {
        document.getElementById('chat-target-name').innerText = chatId === 'group_global' ? "Чат с друзьями" : (users[chatId]?.name || chatId);
        chatMessages.innerHTML = ""; // Clear previous messages
        showScreen('chat-screen');
    }

    function openSettings() {
        document.getElementById('settings-modal').style.display = 'flex';
        document.getElementById('new-name-input').value = currentUser.name;
        const avatarPreview = document.getElementById('settings-avatar-preview');
        avatarPreview.innerHTML = currentUser.avatar ? `<img src="${currentUser.avatar}" alt="Avatar">` : (currentUser.name || currentUser.phone)[0];
        updateUI();
    }

    function closeSettings() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    function startSlider() {
        if (sliderInterval) clearInterval(sliderInterval); // Prevent multiple intervals
        sliderInterval = setInterval(() => {
            bIdx = (bIdx + 1) % bannerList.length;
            document.getElementById('main-banner-img').src = bannerList[bIdx];
        }, 4000);
    }

    function setReply(text) {
        replyData = text;
        replyBox.style.display = 'flex';
        replyText.innerText = text;
    }

    function cancelReply() {
        replyData = null;
        replyBox.style.display = 'none';
    }

    // --- LOGIC FUNCTIONS ---

    function registerUser() {
        const phone = document.getElementById('reg-phone').value;
        const pass1 = document.getElementById('reg-pass1').value;
        const pass2 = document.getElementById('reg-pass2').value;

        if (!phone || !pass1) return alert("Заполните поля");
        if (pass1 !== pass2) return alert("Пароли не совпадают");
        if (users[phone]) return alert("Номер занят");

        users[phone] = { pass: pass1, name: "User_" + phone.slice(-4), isAdmin: false, avatar: "", isVerified: false };
        currentUser = { ...users[phone], phone: phone };
        
        updateUI();
        showScreen('main-screen');
        startSlider();
    }

    function loginUser() {
        const phone = document.getElementById('log-phone').value;
        const pass = document.getElementById('log-pass').value;

        if (users[phone] && users[phone].pass === pass) {
            currentUser = { ...users[phone], phone: phone };
            updateUI();
            showScreen('main-screen');
            startSlider();
        } else {
            alert("Ошибка входа");
        }
    }

    function sendMessage() {
        const messageText = msgInput.value.trim();
        if (!messageText) return;

        const name = currentUser.name || currentUser.phone;
        const badge = currentUser.isVerified ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" alt="Verified">` : "";

        // Using createElement is more secure than innerHTML
        const msgWrapper = document.createElement('div');
        msgWrapper.className = "msg-wrapper my";
        
        let replyHTML = '';
        if (replyData) {
            // Sanitize replyData if it can contain user-generated HTML
            replyHTML = `<small class="reply-in-message">↩️ </small>`;
        }

        msgWrapper.innerHTML = `
            <div class="msg-avatar">${currentUser.avatar ? `<img src="${currentUser.avatar}" alt="Avatar">` : name[0]}</div>
            <div class="msg-content">
                <span class="msg-username"></span>
                <div class="msg-body">
                    
                    ${messageText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                </div>
            </div>`;
        
        // Add reply button with an event listener
        const replyButton = document.createElement('small');
        replyButton.className = 'atvet-btn';
        replyButton.innerText = 'Ответить';
        replyButton.onclick = () => setReply(messageText);
        msgWrapper.querySelector('.msg-body').appendChild(replyButton);

        chatMessages.appendChild(msgWrapper);
        msgInput.value = "";
        cancelReply();
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function saveProfileChanges() {
        const newName = document.getElementById('new-name-input').value;
        if (newName) {
            currentUser.name = newName;
            users[currentUser.phone].name = newName;
        }
        updateUI();
        closeSettings();
    }

    function previewProfilePic(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            currentUser.avatar = imageUrl;
            users[currentUser.phone].avatar = imageUrl;
            updateUI();
            document.getElementById('settings-avatar-preview').innerHTML = `<img src="" alt="Avatar">`;
        };
        reader.readAsDataURL(file);
    }
    
    // --- Admin Functions ---
    function requestVerification() {
        if (currentUser.isVerified) return alert("Уже верифицирован");
        if (verificationRequests.some(r => r.phone === currentUser.phone)) return alert("Заявка уже отправлена");
        verificationRequests.push({ phone: currentUser.phone, name: currentUser.name || currentUser.phone });
        alert("Заявка отправлена админу!");
    }

    function updateRequestsList() {
        const list = document.getElementById('requests-list');
        list.innerHTML = "";
        if (verificationRequests.length === 0) {
            list.innerHTML = `<p>Заявок нет</p>`;
            return;
        }
        verificationRequests.forEach((req, index) => {
            const item = document.createElement('div');
            item.className = "req-item";
            item.innerHTML = `<span>${req.name}</span>
                <div>
                    <button class="approve" data-index="">✅</button>
                    <button class="reject" data-index="">❌</button>
                </div>`;
            list.appendChild(item);
        });
    }

    function handleVerificationAction(event) {
        const target = event.target;
        const index = target.dataset.index;
        if (index === undefined) return;

        if (target.classList.contains('approve')) {
            const phoneToVerify = verificationRequests[index].phone;
            users[phoneToVerify].isVerified = true;
            if (currentUser.phone === phoneToVerify) currentUser.isVerified = true;
        }
        
        verificationRequests.splice(index, 1);
        updateRequestsList();
        updateUI();
    }

    // --- EVENT LISTENERS ---
    
    // Auth
    document.getElementById('toggle-to-reg').addEventListener('click', () => toggleAuth(true));
    document.getElementById('toggle-to-login').addEventListener('click', () => toggleAuth(false));
    document.getElementById('login-btn').addEventListener('click', loginUser);
    document.getElementById('register-btn').addEventListener('click', registerUser);

    // Main Screen
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.querySelector('.chat-tabs').addEventListener('click', (e) => {
        if (e.target.matches('.tab-btn')) switchTab(e.target.dataset.tab);
    });
    document.getElementById('public-section').addEventListener('click', (e) => {
        const card = e.target.closest('.chat-card-main');
        if (card) openChat(card.dataset.chatId);
    });

    // Chat Screen
    document.getElementById('back-to-main-btn').addEventListener('click', () => showScreen('main-screen'));
    document.getElementById('send-msg-btn').addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    document.getElementById('cancel-reply-btn').addEventListener('click', cancelReply);

    // Settings Modal
    document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
    document.getElementById('save-profile-btn').addEventListener('click', saveProfileChanges);
    document.getElementById('profile-pic-input').addEventListener('change', previewProfilePic);
    document.getElementById('request-verify-btn').addEventListener('click', requestVerification);
    document.getElementById('requests-list').addEventListener('click', handleVerificationAction);
});
