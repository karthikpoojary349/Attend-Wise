document.addEventListener('DOMContentLoaded', () => {

    console.log("AttendWise App Initializing...");

    // --- STATE MANAGEMENT ---
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    let settings = JSON.parse(localStorage.getItem('settings')) || { defaultPercent: 75, theme: 'light' };
    let currentEditSubjectId = null;

    // --- ELEMENT REFERENCES ---
    const body = document.body;
    const openMenuBtn = document.getElementById('open-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const sideMenu = document.getElementById('slide-out-menu');
    const overlay = document.getElementById('page-overlay');
    const navButtons = document.querySelectorAll('.nav-button');
    const menuViews = document.querySelectorAll('.menu-view');
    const subjectForm = document.getElementById('add-subject-form');
    const formTitle = document.getElementById('form-title');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const cardsContainer = document.getElementById('subject-cards-container');
    const defaultPercentInput = document.getElementById('default-attendance-input');
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const clearDataBtn = document.getElementById('clear-data-btn');

    // --- INITIALIZATION ---
    function initializeApp() {
        loadSettings();
        renderSubjectCards();
        setupEventListeners();
    }

    function loadSettings() {
        if (settings.theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        defaultPercentInput.value = settings.defaultPercent;
        document.getElementById('min-attendance').value = settings.defaultPercent;
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        openMenuBtn.addEventListener('click', openSideMenu);
        closeMenuBtn.addEventListener('click', closeSideMenu);
        overlay.addEventListener('click', closeSideMenu);
        subjectForm.addEventListener('submit', handleFormSubmit);
        clearDataBtn.addEventListener('click', clearAllData);
        themeToggle.addEventListener('change', toggleTheme);
        defaultPercentInput.addEventListener('change', saveDefaultPercent);
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                switchMenuView(view);
            });
        });
        console.log("All event listeners attached.");
    }

    // --- MENU AND VIEW FUNCTIONS ---
    function openSideMenu() {
        console.log("Opening menu...");
        sideMenu.classList.add('open');
        overlay.classList.add('active');
    }

    function closeSideMenu() {
        console.log("Closing menu...");
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
        if (currentEditSubjectId) {
            switchToState('add');
        }
    }

    function switchMenuView(viewId) {
        menuViews.forEach(view => view.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        navButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.view === viewId);
        });
    }
    
    function switchToState(state, subjectId = null) {
        if (state === 'edit') {
            currentEditSubjectId = subjectId;
            const subject = subjects.find(s => s.id === subjectId);
            formTitle.textContent = 'Edit Subject';
            formSubmitBtn.textContent = 'Save Changes';
            document.getElementById('subject-name').value = subject.name;
            document.getElementById('total-classes').value = subject.totalClasses;
            document.getElementById('min-attendance').value = subject.minAttendance;
            switchMenuView('add-edit-view');
            openSideMenu();
        } else { // 'add' state
            currentEditSubjectId = null;
            formTitle.textContent = 'Add New Subject';
            formSubmitBtn.textContent = 'Add Subject';
            subjectForm.reset();
            document.getElementById('min-attendance').value = settings.defaultPercent;
        }
    }
    
    // --- CORE LOGIC: ADD/EDIT/DELETE/MARK ATTENDANCE ---
    function handleFormSubmit(event) {
        event.preventDefault();
        const subjectData = {
            name: document.getElementById('subject-name').value.trim(),
            totalClasses: parseInt(document.getElementById('total-classes').value),
            minAttendance: parseInt(document.getElementById('min-attendance').value),
        };
        if (currentEditSubjectId) {
            const subject = subjects.find(s => s.id === currentEditSubjectId);
            Object.assign(subject, { ...subject, ...subjectData });
        } else {
            const newSubject = { id: Date.now(), ...subjectData, attendanceRecords: {} };
            subjects.push(newSubject);
        }
        saveAndRerender();
        closeSideMenu();
    }
    
    function handleAttendance(subjectId, status) {
        const subject = subjects.find(s => s.id === subjectId);
        const today = new Date().toISOString().slice(0, 10);
        if (subject.attendanceRecords[today]) {
            alert("You have already marked today's attendance for this subject.");
            return;
        }
        subject.attendanceRecords[today] = status;
        saveAndRerender();
    }

    // --- RENDERING ---
    function renderSubjectCards() {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = '';
        if (subjects.length === 0) {
            cardsContainer.innerHTML = `<p class="empty-state">Your dashboard is empty!<br>Click the '☰' menu to add your first subject.</p>`;
            return;
        }
        subjects.forEach(subject => {
            const cardTemplate = document.getElementById('subject-card-template');
            const cardClone = cardTemplate.content.cloneNode(true);
            const cardElement = cardClone.querySelector('.subject-card');
            cardElement.querySelector('.subject-title').textContent = subject.name;
            cardElement.querySelector('.edit-btn').addEventListener('click', () => switchToState('edit', subject.id));
            cardElement.querySelector('.delete-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete ${subject.name}?`)) {
                    subjects = subjects.filter(s => s.id !== subject.id);
                    saveAndRerender();
                }
            });
            cardElement.querySelector('.present-btn').addEventListener('click', () => handleAttendance(subject.id, 'present'));
            cardElement.querySelector('.absent-btn').addEventListener('click', () => handleAttendance(subject.id, 'absent'));
            cardElement.querySelector('.no-class-btn').addEventListener('click', () => handleAttendance(subject.id, 'no-class'));
            updateCardUI(cardElement, subject);
            cardsContainer.appendChild(cardClone);
        });
    }

    function updateCardUI(cardElement, subject) {
        let attendedCount = 0;
        let absentCount = 0;
        for (const date in subject.attendanceRecords) {
            if (subject.attendanceRecords[date] === 'present') attendedCount++;
            else if (subject.attendanceRecords[date] === 'absent') absentCount++;
        }
        const classesHeld = attendedCount + absentCount;
        const currentPercentage = classesHeld === 0 ? 100 : (attendedCount / classesHeld) * 100;
        cardElement.querySelector('.attended-count').textContent = attendedCount;
        cardElement.querySelector('.absent-count').textContent = absentCount;
        cardElement.querySelector('.percentage-count').textContent = `${currentPercentage.toFixed(1)}%`;
        const progressBar = cardElement.querySelector('.progress-bar');
        progressBar.style.width = `${currentPercentage}%`;
        const bunkStatusEl = cardElement.querySelector('.bunk-status');
        if (currentPercentage < subject.minAttendance) {
            bunkStatusEl.textContent = "DANGER: You're below the required attendance!";
            bunkStatusEl.className = "bunk-status danger";
            progressBar.className = "progress-bar danger";
        } else {
            bunkStatusEl.textContent = "SAFE: You are on track.";
            bunkStatusEl.className = "bunk-status safe";
            progressBar.className = "progress-bar safe";
        }
        const today = new Date().toISOString().slice(0, 10);
        if (subject.attendanceRecords[today]) {
            cardElement.querySelectorAll('.attendance-btn').forEach(btn => btn.disabled = true);
        }
    }

    // --- SETTINGS AND DATA FUNCTIONS ---
    function toggleTheme() {
        settings.theme = themeToggle.checked ? 'dark' : 'light';
        body.classList.toggle('dark-mode', themeToggle.checked);
        saveSettings();
    }
    function saveDefaultPercent() {
        const percent = parseInt(defaultPercentInput.value);
        if(percent >= 0 && percent <= 100) {
            settings.defaultPercent = percent;
            saveSettings();
            if(!currentEditSubjectId) document.getElementById('min-attendance').value = settings.defaultPercent;
        }
    }
    function clearAllData() {
        if (confirm("Are you sure you want to delete ALL subjects?\nThis action cannot be undone.")) {
            subjects = [];
            saveAndRerender();
        }
    }
    function saveAndRerender() {
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderSubjectCards();
    }
    function saveSettings() {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    // --- START THE APP ---
    initializeApp();
});
