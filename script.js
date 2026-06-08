/* ==========================================================================
   TaskFlow Pro — Core JavaScript Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let state = {
        tasks: [],
        filter: 'all',          // 'all' | 'active' | 'completed' | 'high-priority'
        searchQuery: '',
        theme: 'light',
        activeView: 'dashboard', // 'dashboard' | 'my-tasks' | 'completed' | 'settings'
        userName: 'Productive Guest',
        taskIdToDelete: null
    };

    // --- DOM Elements ---
    const htmlEl = document.documentElement;
    
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const btnHamburger = document.getElementById('btnHamburger');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');
    const navItems = document.querySelectorAll('.nav-item');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    
    // Header
    const headerUserName = document.getElementById('headerUserName');
    const currentDateLabel = document.getElementById('currentDate');
    const searchInput = document.getElementById('searchInput');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const headerProfileAvatar = document.getElementById('headerProfileAvatar');
    
    // Views
    const dashboardViewport = document.getElementById('dashboardViewport');
    const statsGrid = document.getElementById('statsGrid');
    const taskInputSection = document.getElementById('taskInputSection');
    const taskExplorerSection = document.getElementById('taskExplorerSection');
    const settingsView = document.getElementById('settingsView');
    
    // Stats Dashboard
    const totalTasksCount = document.getElementById('totalTasksCount');
    const pendingTasksCount = document.getElementById('pendingTasksCount');
    const completedTasksCount = document.getElementById('completedTasksCount');
    const productivityScore = document.getElementById('productivityScore');
    const statPercentTotal = document.getElementById('statPercentTotal');
    const statPercentPending = document.getElementById('statPercentPending');
    const statPercentCompleted = document.getElementById('statPercentCompleted');
    const statPercentProductivity = document.getElementById('statPercentProductivity');
    
    // Inputs & Forms
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const prioritySelect = document.getElementById('prioritySelect');
    
    // List & Empty state
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const btnEmptyStateAction = document.getElementById('btnEmptyStateAction');
    
    // Modals
    const confirmModal = document.getElementById('confirmModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    
    // Settings
    const settingsNameInput = document.getElementById('settingsNameInput');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnResetDatabase = document.getElementById('btnResetDatabase');

    // Toasts
    const toastContainer = document.getElementById('toastContainer');

    // --- Helper Sanitizer & Formatter Utilities ---

    function sanitizeHTML(string) {
        return string.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function formatRelativeDate(dateString) {
        if (!dateString) return 'No due date';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays === -1) return 'Due yesterday';
        if (diffDays < -1) return `Overdue by ${Math.abs(diffDays)}d`;
        
        return 'Due ' + targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function isDateOverdue(dateString, isCompleted) {
        if (!dateString || isCompleted) return false;
        const today = new Date();
        today.setHours(0,0,0,0);
        const targetDate = new Date(dateString);
        targetDate.setHours(0,0,0,0);
        return targetDate < today;
    }

    // --- Dynamic Greeting Header Renderer ---

    function updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        
        if (hour >= 12 && hour < 17) {
            greeting = 'Good afternoon';
        } else if (hour >= 17 || hour < 4) {
            greeting = 'Good evening';
        }
        
        headerUserName.textContent = `${greeting}, ${state.userName}`;
    }

    function updateHeaderDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateLabel.textContent = new Date().toLocaleDateString(undefined, options);
    }

    // --- Custom Toast Notifier ---

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconMarkup = '';
        if (type === 'success') {
            iconMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'info') {
            iconMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        } else if (type === 'warning') {
            iconMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>`;
        }
        
        toast.innerHTML = `
            <div class="toast-icon">${iconMarkup}</div>
            <div class="toast-msg">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove toast on slide anim completion
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 3200);
    }

    // --- State & Storage Sync ---

    function saveToLocalStorage() {
        localStorage.setItem('taskflow_tasks_pro', JSON.stringify(state.tasks));
    }

    function loadFromLocalStorage() {
        // Load Tasks
        const localTasks = localStorage.getItem('taskflow_tasks_pro');
        state.tasks = localTasks ? JSON.parse(localTasks) : [];
        
        // Load Theme
        const localTheme = localStorage.getItem('taskflow_theme_pro');
        state.theme = localTheme ? localTheme : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(state.theme);
        
        // Load profile Name
        const localName = localStorage.getItem('taskflow_username_pro');
        if (localName) {
            state.userName = localName;
        }
        updateUserVisuals();
    }

    function updateUserVisuals() {
        // Update name outputs
        sidebarUserName.textContent = state.userName;
        settingsNameInput.value = state.userName;
        updateGreeting();
        
        // Initials avatar generator
        const initials = state.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        sidebarAvatar.textContent = initials || 'TP';
        headerProfileAvatar.textContent = initials || 'TP';
    }

    // --- Theme Control ---

    function applyTheme(theme) {
        if (theme === 'dark') {
            htmlEl.setAttribute('data-theme', 'dark');
            sunIcon.classList.add('hide');
            moonIcon.classList.remove('hide');
        } else {
            htmlEl.setAttribute('data-theme', 'light');
            sunIcon.classList.remove('hide');
            moonIcon.classList.add('hide');
        }
        localStorage.setItem('taskflow_theme_pro', theme);
    }

    function toggleTheme() {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(state.theme);
        showToast(`Theme changed to ${state.theme} mode`, 'info');
    }

    // --- Router views manager ---

    function navigateToView(view) {
        state.activeView = view;
        
        // Update active nav state class
        navItems.forEach(item => {
            if (item.getAttribute('data-view') === view) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Close responsive mobile sidebar when navigation executes
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');

        // Toggle Views visibility
        if (view === 'settings') {
            dashboardViewport.classList.add('hide');
            settingsView.classList.remove('hide');
        } else {
            dashboardViewport.classList.remove('hide');
            settingsView.classList.add('hide');
            
            // Adjust layouts inside dashboard viewport based on router tab
            if (view === 'dashboard') {
                statsGrid.classList.remove('hide');
                taskInputSection.classList.remove('hide');
                taskExplorerSection.classList.remove('hide');
                
                // Reset tab filter on dashboard
                state.filter = 'all';
                updateActiveFilterButton('all');
            } else if (view === 'my-tasks') {
                statsGrid.classList.add('hide');
                taskInputSection.classList.remove('hide');
                taskExplorerSection.classList.remove('hide');
                
                // Show active tasks only by default
                state.filter = 'active';
                updateActiveFilterButton('active');
            } else if (view === 'completed') {
                statsGrid.classList.add('hide');
                taskInputSection.classList.add('hide');
                taskExplorerSection.classList.remove('hide');
                
                // Force to show completed items
                state.filter = 'completed';
                updateActiveFilterButton('completed');
            }
            
            renderTaskList();
            updateDashboardCounters();
        }
    }

    function updateActiveFilterButton(filterVal) {
        const filterButtons = document.querySelectorAll('.filter-tab');
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filterVal) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // --- Dashboard Metrics & Productive score counters ---

    function updateDashboardCounters() {
        const total = state.tasks.length;
        const completed = state.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

        totalTasksCount.textContent = total;
        pendingTasksCount.textContent = pending;
        completedTasksCount.textContent = completed;
        productivityScore.textContent = `${productivity}%`;

        // Update progress bar width (UI only — no logic change)
        const productivityBar = document.getElementById('productivityBar');
        if (productivityBar) productivityBar.style.width = `${productivity}%`;

        // Update card info tags
        statPercentTotal.textContent = total === 1 ? '1 task cataloged' : `${total} tasks cataloged`;
        statPercentPending.textContent = pending === 1 ? '1 active objective' : `${pending} active objectives`;
        statPercentCompleted.textContent = completed === 1 ? '1 goal archived' : `${completed} goals archived`;
        statPercentProductivity.textContent = productivity === 100 && total > 0 ? 'All objectives completed!' : `${productivity}% completion rate`;
        
        // Add fancy neon glows if productivity card hits 100%
        const cardProductivity = document.getElementById('cardProductivity');
        if (productivity === 100 && total > 0) {
            cardProductivity.classList.add('productivity-glow');
        } else {
            cardProductivity.classList.remove('productivity-glow');
        }
    }

    // --- Core Task Lifecycle Management ---

    /**
     * Create and append new task to local array.
     */
    function handleAddTask(title, priority, dateVal) {
        const cleanTitle = title.trim();
        if (!cleanTitle) return;

        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            title: cleanTitle,
            completed: false,
            priority: priority,
            dueDate: dateVal || null,
            createdAt: new Date().toISOString()
        };

        state.tasks.unshift(newTask);
        saveToLocalStorage();
        updateDashboardCounters();
        renderTaskList();
        showToast('Objective created successfully', 'success');
        
        // Clear input form
        taskInput.value = '';
        dueDateInput.value = '';
        taskInput.focus();
    }

    /**
     * Complete Task state toggle.
     */
    function toggleTaskComplete(id) {
        state.tasks = state.tasks.map(task => {
            if (task.id === id) {
                const status = !task.completed;
                showToast(status ? 'Objective marked completed' : 'Objective returned to queue', 'success');
                return { ...task, completed: status };
            }
            return task;
        });

        saveToLocalStorage();
        updateDashboardCounters();
        renderTaskList();
    }

    /**
     * Inline text modification.
     */
    function enterEditMode(id, cardElement) {
        const task = state.tasks.find(t => t.id === id);
        if (!task || task.completed) return;

        const titleSpan = cardElement.querySelector('.task-title');
        const originalText = task.title;

        if (cardElement.querySelector('.inline-edit-input')) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = originalText;
        input.maxLength = 100;

        titleSpan.replaceWith(input);
        input.focus();
        input.select();

        const saveAndExit = () => {
            const val = input.value.trim();
            if (val && val !== originalText) {
                state.tasks = state.tasks.map(t => {
                    if (t.id === id) return { ...t, title: val };
                    return t;
                });
                saveToLocalStorage();
                renderTaskList();
                showToast('Objective updated', 'success');
            } else {
                renderTaskList(); // Restore state view
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveAndExit();
            } else if (e.key === 'Escape') {
                renderTaskList();
            }
        });

        input.addEventListener('blur', () => {
            saveAndExit();
        });
    }

    /**
     * Open confirmation modal.
     */
    function triggerDeleteModal(id) {
        state.taskIdToDelete = id;
        confirmModal.classList.remove('hide');
    }

    function closeDeleteModal() {
        state.taskIdToDelete = null;
        confirmModal.classList.add('hide');
    }

    function confirmDeleteTask() {
        const id = state.taskIdToDelete;
        if (!id) return;

        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) {
            card.classList.add('slide-out');
            
            // Wait for slide animation (350ms) to complete
            card.addEventListener('animationend', () => {
                state.tasks = state.tasks.filter(t => t.id !== id);
                saveToLocalStorage();
                updateDashboardCounters();
                renderTaskList();
                showToast('Objective removed successfully', 'warning');
                closeDeleteModal();
            });
        } else {
            // Fail-safe fallbacks
            state.tasks = state.tasks.filter(t => t.id !== id);
            saveToLocalStorage();
            updateDashboardCounters();
            renderTaskList();
            closeDeleteModal();
        }
    }

    // --- Task List Renderer Engine ---

    function renderTaskList() {
        taskList.innerHTML = '';
        
        // Tab-Filter logic
        let filtered = state.tasks.filter(task => {
            if (state.filter === 'active') return !task.completed;
            if (state.filter === 'completed') return task.completed;
            if (state.filter === 'high-priority') return task.priority === 'high';
            return true;
        });

        // Search Query filter logic
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(query)
            );
        }

        // Empty state visibility switcher
        if (filtered.length === 0) {
            emptyState.classList.remove('hide');
            taskList.classList.add('hide');
            
            // Custom messages depending on current filters
            if (state.searchQuery) {
                emptyState.querySelector('.empty-title').textContent = 'No matching objectives';
                emptyState.querySelector('.empty-desc').textContent = 'No search results match your criteria. Try redefining search terms.';
                btnEmptyStateAction.classList.add('hide');
            } else if (state.filter === 'completed') {
                emptyState.querySelector('.empty-title').textContent = 'No completed milestones';
                emptyState.querySelector('.empty-desc').textContent = 'Check off active goals from your task logs to fill this completed log.';
                btnEmptyStateAction.classList.add('hide');
            } else if (state.filter === 'high-priority') {
                emptyState.querySelector('.empty-title').textContent = 'No critical high-priority items';
                emptyState.querySelector('.empty-desc').textContent = 'Keep it up! Your schedule contains no immediate critical objectives.';
                btnEmptyStateAction.classList.add('hide');
            } else {
                emptyState.querySelector('.empty-title').textContent = 'All tasks completed!';
                emptyState.querySelector('.empty-desc').textContent = 'Enjoy your day, or launch a new initiative by adding custom goals.';
                btnEmptyStateAction.classList.remove('hide');
            }
        } else {
            emptyState.classList.add('hide');
            taskList.classList.remove('hide');
        }

        // Output task card items
        filtered.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${task.completed ? 'completed' : ''}`;
            card.setAttribute('data-id', task.id);
            
            // Checkbox
            const checkboxHTML = `
                <div class="task-checkbox-col">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} data-action="toggle">
                        <span class="checkmark">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                    </label>
                </div>
            `;
            
            // Edit pencil button
            const editBtnHTML = task.completed ? '' : `
                <button class="btn-icon-action" data-action="edit" title="Edit task details">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                </button>
            `;
            
            // Overdue state check
            const overdue = isDateOverdue(task.dueDate, task.completed);
            
            card.innerHTML = `
                ${checkboxHTML}
                <div class="task-content-col">
                    <span class="task-title">${sanitizeHTML(task.title)}</span>
                    <div class="task-meta-row">
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                        ${task.dueDate ? `
                            <span class="date-badge ${overdue ? 'overdue' : ''}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                ${formatRelativeDate(task.dueDate)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions-col">
                    ${editBtnHTML}
                    <button class="btn-icon-action btn-delete" data-action="delete" title="Remove objective">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `;
            
            // Events attachment
            card.querySelector('[data-action="toggle"]').addEventListener('change', () => {
                toggleTaskComplete(task.id);
            });
            
            if (!task.completed) {
                card.querySelector('[data-action="edit"]').addEventListener('click', () => {
                    enterEditMode(task.id, card);
                });
            }
            
            card.querySelector('[data-action="delete"]').addEventListener('click', () => {
                triggerDeleteModal(task.id);
            });

            taskList.appendChild(card);
        });
    }

    // --- Bind Interactivity Event Listeners ---

    // 1. Submit form listener
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddTask(taskInput.value, prioritySelect.value, dueDateInput.value);
    });

    // 2. Sidebar navigations clicks
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-view');
            navigateToView(target);
        });
    });

    // 3. Mobile Hamburger drawer toggle hooks
    btnHamburger.addEventListener('click', () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    });

    btnCloseSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    // 4. Explorer Task Filter Tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            state.filter = tab.getAttribute('data-filter');
            renderTaskList();
        });
    });

    // 5. Header Search bar input keystrokes
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderTaskList();
    });

    // 6. Header Theme toggler
    themeToggleBtn.addEventListener('click', toggleTheme);

    // 7. Modals Confirmation deletion flows
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', confirmDeleteTask);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeDeleteModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !confirmModal.classList.contains('hide')) {
            closeDeleteModal();
        }
    });

    // 8. Settings configuration forms
    btnSaveProfile.addEventListener('click', () => {
        const val = settingsNameInput.value.trim();
        if (val) {
            state.userName = val;
            localStorage.setItem('taskflow_username_pro', val);
            updateUserVisuals();
            showToast('Username updated successfully', 'success');
        }
    });

    // Destructive full reset database
    btnResetDatabase.addEventListener('click', () => {
        if (confirm('Are you absolutely sure you want to restore factory default settings? All tasks and customization logs will be cleared.')) {
            localStorage.clear();
            state.tasks = [];
            state.theme = 'light';
            state.userName = 'Productive Guest';
            state.activeView = 'dashboard';
            
            applyTheme('light');
            updateUserVisuals();
            navigateToView('dashboard');
            
            showToast('Database wiped completely', 'warning');
        }
    });

    // Empty state CTA focuses the title input box
    btnEmptyStateAction.addEventListener('click', () => {
        taskInput.focus();
    });

    // --- Initialize Application state ---
    loadFromLocalStorage();
    updateHeaderDate();
    navigateToView('dashboard');
});
