/**
 * DevScope - Premium GitHub Profile Explorer Script
 * Pure Vanilla JavaScript implementation of API, analytics, and settings.
 */

// Application Constants
const TRENDING_USERNAMES = ['torvalds', 'gaearon', 'tj', 'sindresorhus', 'yyx990803'];
const DEFAULT_USER = 'gaearon'; // Dan Abramov - co-creator of Redux, React core team member

// Application State
let state = {
  currentProfile: null,
  currentRepos: [],
  searchHistory: [],
  savedProfiles: [],
  activeView: 'dashboard',
  theme: 'light',
  githubToken: '',
  repoSort: 'stars' // 'stars' | 'updated'
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');
const greetingText = document.getElementById('greeting-text');
const currentDateText = document.getElementById('current-date');
const headerSearchInput = document.getElementById('header-search-input');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
const sidebarUserName = document.getElementById('sidebar-user-name');

// Dashboard View Elements
const viewDashboard = document.getElementById('view-dashboard');
const heroSearchForm = document.getElementById('hero-search-form');
const heroSearchInput = document.getElementById('hero-search-input');
const historyChips = document.getElementById('history-chips');
const skeletonLoader = document.getElementById('skeleton-loader');
const errorCard = document.getElementById('error-card');
const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const errorRetryBtn = document.getElementById('error-retry-btn');
const profileDashboardGrid = document.getElementById('profile-dashboard-grid');

// Profile detail elements
const pAvatar = document.getElementById('p-avatar');
const pName = document.getElementById('p-name');
const pUsername = document.getElementById('p-username');
const pBio = document.getElementById('p-bio');
const pLocation = document.getElementById('p-location');
const pCompany = document.getElementById('p-company');
const pBlog = document.getElementById('p-blog');
const pBlogContainer = document.getElementById('p-blog-container');
const pTwitter = document.getElementById('p-twitter');
const pTwitterContainer = document.getElementById('p-twitter-container');
const pCreatedAt = document.getElementById('p-created-at');
const pUpdatedAt = document.getElementById('p-updated-at');

// Stats Elements
const statRepos = document.getElementById('stat-repos');
const statFollowers = document.getElementById('stat-followers');
const statFollowing = document.getElementById('stat-following');
const statGists = document.getElementById('stat-gists');

// Action Buttons
const saveProfileBtn = document.getElementById('save-profile-btn');
const copyProfileBtn = document.getElementById('copy-profile-btn');
const externalProfileBtn = document.getElementById('external-profile-btn');

// Insights Elements
const developerBadge = document.getElementById('developer-badge');
const insightTotalRepos = document.getElementById('insight-total-repos');
const insightPopularity = document.getElementById('insight-popularity');
const insightGists = document.getElementById('insight-gists');
const scoreProgressFill = document.getElementById('score-progress-fill');

// Repositories Elements
const reposGrid = document.getElementById('repos-grid');
const filterStarsBtn = document.getElementById('filter-stars');
const filterUpdatedBtn = document.getElementById('filter-updated');

// Trending View Elements
const viewTrending = document.getElementById('view-trending');
const trendingDevsGrid = document.getElementById('trending-devs-grid');

// Saved View Elements
const viewSaved = document.getElementById('view-saved');
const savedProfilesGrid = document.getElementById('saved-profiles-grid');

// Settings View Elements
const viewSettings = document.getElementById('view-settings');
const settingsTokenInput = document.getElementById('settings-token');
const settingsSaveTokenBtn = document.getElementById('settings-save-token-btn');
const settingsClearTokenBtn = document.getElementById('settings-clear-token-btn');
const clearTokenRow = document.getElementById('clear-token-row');
const tokenStatusText = document.getElementById('token-status');
const settingsThemeSelect = document.getElementById('settings-theme');
const settingsClearCacheBtn = document.getElementById('settings-clear-cache-btn');

// Toast Element & Back to Top
const toastContainer = document.getElementById('toast-container');
const backToTopBtn = document.getElementById('back-to-top');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorage();
  setDynamicGreeting();
  setupTheme();
  setupNavigation();
  setupEventListeners();
  renderTrendingPreloads();
  
  // Load Default Featured Profile (If search history exists, load last searched, else default)
  const lastUser = state.searchHistory.length > 0 ? state.searchHistory[0] : DEFAULT_USER;
  fetchGitHubProfile(lastUser);
});

// Load variables from LocalStorage
function loadLocalStorage() {
  const history = localStorage.getItem('devscope_search_history');
  state.searchHistory = history ? JSON.parse(history) : [];
  
  const saved = localStorage.getItem('devscope_saved_profiles');
  state.savedProfiles = saved ? JSON.parse(saved) : [];
  
  state.theme = localStorage.getItem('devscope_theme') || 'light';
  state.githubToken = localStorage.getItem('devscope_token') || '';
  
  // Set UI input values
  if (state.githubToken) {
    settingsTokenInput.value = state.githubToken;
    clearTokenRow.style.display = 'flex';
    tokenStatusText.textContent = 'Token configured. Higher rate limits (5,000 requests/hr) active.';
    tokenStatusText.style.color = 'var(--success)';
  } else {
    settingsTokenInput.value = '';
    clearTokenRow.style.display = 'none';
    tokenStatusText.textContent = 'Token is not configured (unauthenticated limits: 60 requests/hr active).';
    tokenStatusText.style.color = 'var(--text-muted)';
  }
  
  settingsThemeSelect.value = state.theme;
  
  // Render history chips initially
  renderSearchHistoryChips();
}

// Generate dynamic greetings and format dates
function setDynamicGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = 'Good morning, Developer!';
  
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon, Developer!';
  } else if (hour >= 17 && hour < 22) {
    greeting = 'Good evening, Developer!';
  } else if (hour >= 22 || hour < 5) {
    greeting = 'Happy coding, Developer!';
  }
  
  greetingText.textContent = greeting;
  
  // Set Date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateText.textContent = now.toLocaleDateString('en-US', options);
}

// Theme setup & triggers
function setupTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const icon = themeToggleBtn.querySelector('i');
  if (state.theme === 'dark') {
    themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    themeToggleBtn.title = 'Switch to Light Mode';
  } else {
    themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    themeToggleBtn.title = 'Switch to Dark Mode';
  }
  lucide.createIcons();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('devscope_theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  settingsThemeSelect.value = state.theme;
  updateThemeToggleIcon();
  showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
}

// Sidebar Navigation Pane Toggles
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-list .nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
      
      // Close mobile sidebar if open
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('visible');
    });
  });
}

function switchView(viewName) {
  state.activeView = viewName;
  
  // Update nav UI active styles
  document.querySelectorAll('.nav-list .nav-item').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Show / Hide view panes
  const viewPanes = document.querySelectorAll('.view-pane');
  viewPanes.forEach(pane => {
    if (pane.id === `view-${viewName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Load contextual stuff if needed
  if (viewName === 'saved') {
    renderSavedProfiles();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
function setupEventListeners() {
  // Mobile menu button
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    sidebarOverlay.classList.toggle('visible');
  });

  // Mobile overlay click to close sidebar
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('visible');
  });

  // Header quick search focus keybind (Ctrl + K or /)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
      // Prevent browser default behavior if focus
      if (document.activeElement !== headerSearchInput && document.activeElement !== heroSearchInput && document.activeElement !== settingsTokenInput) {
        e.preventDefault();
        headerSearchInput.focus();
        headerSearchInput.select();
      }
    }
  });

  // Search submits
  heroSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = heroSearchInput.value.trim();
    if (query) {
      fetchGitHubProfile(query);
      heroSearchInput.value = '';
    }
  });

  headerSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = headerSearchInput.value.trim();
      if (query) {
        switchView('dashboard');
        fetchGitHubProfile(query);
        headerSearchInput.value = '';
        headerSearchInput.blur();
      }
    }
  });

  // Theme Toggles
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  settingsThemeSelect.addEventListener('change', (e) => {
    state.theme = e.target.value;
    localStorage.setItem('devscope_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeToggleIcon();
    showToast(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
  });

  // Actions
  saveProfileBtn.addEventListener('click', toggleSaveProfile);
  
  copyProfileBtn.addEventListener('click', () => {
    if (state.currentProfile) {
      navigator.clipboard.writeText(state.currentProfile.html_url)
        .then(() => showToast('GitHub URL copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy URL.', 'error'));
    }
  });

  // Sorting repositories
  filterStarsBtn.addEventListener('click', () => {
    if (state.repoSort !== 'stars') {
      state.repoSort = 'stars';
      filterStarsBtn.classList.add('active');
      filterUpdatedBtn.classList.remove('active');
      renderRepositories();
    }
  });

  filterUpdatedBtn.addEventListener('click', () => {
    if (state.repoSort !== 'updated') {
      state.repoSort = 'updated';
      filterUpdatedBtn.classList.add('active');
      filterStarsBtn.classList.remove('active');
      renderRepositories();
    }
  });

  // Settings Save Token
  settingsSaveTokenBtn.addEventListener('click', () => {
    const token = settingsTokenInput.value.trim();
    if (token) {
      state.githubToken = token;
      localStorage.setItem('devscope_token', token);
      clearTokenRow.style.display = 'flex';
      tokenStatusText.textContent = 'Token configured. Higher rate limits (5,000 requests/hr) active.';
      tokenStatusText.style.color = 'var(--success)';
      showToast('GitHub Personal Access Token saved successfully!', 'success');
    } else {
      showToast('Please enter a valid token.', 'error');
    }
  });

  // Settings Remove Token
  settingsClearTokenBtn.addEventListener('click', () => {
    state.githubToken = '';
    localStorage.removeItem('devscope_token');
    settingsTokenInput.value = '';
    clearTokenRow.style.display = 'none';
    tokenStatusText.textContent = 'Token is not configured (unauthenticated limits: 60 requests/hr active).';
    tokenStatusText.style.color = 'var(--text-muted)';
    showToast('GitHub Access Token removed.', 'success');
  });

  // Settings Clear App Cache
  settingsClearCacheBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear search history and all saved bookmarks?')) {
      localStorage.removeItem('devscope_search_history');
      localStorage.removeItem('devscope_saved_profiles');
      state.searchHistory = [];
      state.savedProfiles = [];
      renderSearchHistoryChips();
      renderSavedProfiles();
      showToast('Explorer cache reset successfully.', 'success');
    }
  });

  // Retry loading
  errorRetryBtn.addEventListener('click', () => {
    errorCard.style.display = 'none';
    const lastSearch = state.searchHistory.length > 0 ? state.searchHistory[0] : DEFAULT_USER;
    fetchGitHubProfile(lastSearch);
  });

  // Back to Top functionality
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// GitHub REST API Integration
async function fetchGitHubProfile(username) {
  // Trigger loading screen
  showLoadingState(true);
  
  // Headers Setup
  const headers = {};
  if (state.githubToken) {
    headers['Authorization'] = `token ${state.githubToken}`;
  }
  
  try {
    // 1. Fetch User Data
    const profileResponse = await fetch(`https://api.github.com/users/${username}`, { headers });
    
    if (profileResponse.status === 404) {
      showErrorState('User Not Found', `The profile for username "${username}" could not be located. Verify the name is spelled correctly and try again.`);
      return;
    } else if (profileResponse.status === 403) {
      const errorData = await profileResponse.json();
      if (errorData.message && errorData.message.includes('rate limit exceeded')) {
        showErrorState('Rate Limit Exceeded', 'You have hit the GitHub API unauthenticated limit of 60 requests per hour. Please add a GitHub Personal Access Token (PAT) under settings to increase this limit to 5,000 queries per hour.');
      } else {
        showErrorState('API Access Forbidden', 'GitHub API query forbidden. Please verify your Access Token in settings.');
      }
      return;
    } else if (!profileResponse.ok) {
      showErrorState('API Query Failed', `API error: ${profileResponse.statusText}. Please check your internet connection and retry.`);
      return;
    }
    
    const profileData = await profileResponse.json();
    state.currentProfile = profileData;
    
    // 2. Fetch User Repositories
    // GitHub API returns up to 100 repositories per page. We fetch page 1 (up to 100 repos) to calculate analytics.
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers });
    if (reposResponse.ok) {
      state.currentRepos = await reposResponse.json();
    } else {
      state.currentRepos = [];
      showToast('Could not fetch developer repositories.', 'error');
    }
    
    // Update active profile in bottom sidebar (Guest Explorer -> Current Searched user)
    sidebarUserAvatar.src = profileData.avatar_url;
    sidebarUserName.textContent = profileData.name || profileData.login;
    
    // Save to search history
    addToSearchHistory(username);
    
    // Render
    renderProfileDashboard();
    showLoadingState(false);
    
  } catch (err) {
    console.error(err);
    showErrorState('Network Request Failed', 'A network connection failure occurred. Please verify your connection status and try again.');
  }
}

// Show/Hide Loading States
function showLoadingState(isLoading) {
  if (isLoading) {
    skeletonLoader.style.display = 'block';
    profileDashboardGrid.style.display = 'none';
    errorCard.style.display = 'none';
  } else {
    skeletonLoader.style.display = 'none';
    profileDashboardGrid.style.display = 'grid';
    errorCard.style.display = 'none';
  }
}

// Show Error States
function showErrorState(title, description) {
  skeletonLoader.style.display = 'none';
  profileDashboardGrid.style.display = 'none';
  errorCard.style.display = 'flex';
  
  errorTitle.textContent = title;
  errorDesc.textContent = description;
  
  showToast(title, 'error');
}

// Render Profile Details
function renderProfileDashboard() {
  const p = state.currentProfile;
  if (!p) return;
  
  // Render Left Column card details
  pAvatar.src = p.avatar_url;
  pName.textContent = p.name || p.login;
  pUsername.textContent = `@${p.login}`;
  pBio.textContent = p.bio || 'This developer has not filled out a biography yet.';
  
  pLocation.textContent = p.location || 'Not Specified';
  pCompany.textContent = p.company || 'Independent';
  
  if (p.blog) {
    pBlog.href = p.blog.startsWith('http') ? p.blog : `https://${p.blog}`;
    pBlog.textContent = p.blog.replace(/(^\w+:|^)\/\//, '').substring(0, 24) + (p.blog.length > 24 ? '...' : '');
    pBlogContainer.style.display = 'inline';
    pBlogContainer.parentElement.style.display = 'flex';
  } else {
    pBlogContainer.parentElement.style.display = 'none';
  }
  
  if (p.twitter_username) {
    pTwitter.href = `https://twitter.com/${p.twitter_username}`;
    pTwitter.textContent = `@${p.twitter_username}`;
    pTwitterContainer.style.display = 'inline';
    pTwitterContainer.parentElement.style.display = 'flex';
  } else {
    pTwitterContainer.parentElement.style.display = 'none';
  }
  
  // Format dates
  const joinedDate = new Date(p.created_at);
  const updatedDate = new Date(p.updated_at);
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  pCreatedAt.textContent = joinedDate.toLocaleDateString('en-US', dateOptions);
  pUpdatedAt.textContent = updatedDate.toLocaleDateString('en-US', dateOptions);
  
  // Actions
  externalProfileBtn.href = p.html_url;
  
  // Set Saved Active Bookmark style
  const isSaved = state.savedProfiles.some(item => item.login.toLowerCase() === p.login.toLowerCase());
  if (isSaved) {
    saveProfileBtn.classList.add('active');
    saveProfileBtn.title = 'Remove Bookmark';
  } else {
    saveProfileBtn.classList.remove('active');
    saveProfileBtn.title = 'Bookmark Profile';
  }
  
  // Render Stats counts
  statRepos.textContent = p.public_repos;
  statFollowers.textContent = formatCount(p.followers);
  statFollowing.textContent = formatCount(p.following);
  statGists.textContent = p.public_gists;
  
  // Render Contributions & Developer badges
  calculateDeveloperInsights();
  
  // Render repositories
  renderRepositories();
  
  // Reload icons
  lucide.createIcons();
}

// Repositories Rendering (Top 6 repos)
function renderRepositories() {
  reposGrid.innerHTML = '';
  
  if (state.currentRepos.length === 0) {
    reposGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-secondary);">
        No repositories found for this user.
      </div>
    `;
    return;
  }
  
  // Sort Repositories
  let sorted = [...state.currentRepos];
  if (state.repoSort === 'stars') {
    sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else {
    sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  
  // Limit to top 6 repositories
  const topRepos = sorted.slice(0, 6);
  
  topRepos.forEach(repo => {
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    // Date calculation
    const updated = new Date(repo.updated_at);
    const dateStr = updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Language Color
    const lang = repo.language || 'Plain Text';
    const color = getLanguageColor(lang);
    
    card.innerHTML = `
      <div class="repo-top">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name-link">
          <i data-lucide="folder-git-2"></i>
          <span>${repo.name}</span>
        </a>
        <span class="repo-visibility">${repo.visibility || 'public'}</span>
      </div>
      <p class="repo-desc">${repo.description || 'No description provided.'}</p>
      
      <div class="repo-footer">
        <div class="repo-footer-left">
          <div class="repo-lang">
            <span class="lang-color" style="background-color: ${color}"></span>
            <span>${lang}</span>
          </div>
          <div class="repo-stats">
            <div class="repo-stat-item" title="Stars">
              <i data-lucide="star"></i>
              <span>${formatCount(repo.stargazers_count)}</span>
            </div>
            <div class="repo-stat-item" title="Forks">
              <i data-lucide="git-fork"></i>
              <span>${formatCount(repo.forks_count)}</span>
            </div>
          </div>
        </div>
        <span class="repo-date">Updated ${dateStr}</span>
      </div>
    `;
    reposGrid.appendChild(card);
  });
  
  lucide.createIcons();
}

// Calculate Developer Badge & Popularity
function calculateDeveloperInsights() {
  const p = state.currentProfile;
  const repos = state.currentRepos;
  if (!p) return;
  
  // Sum stargazers count of fetched repositories
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  
  // Popularity Score Formula:
  // (Followers * 4) + (Public Repos * 2) + (Public Gists * 1) + (Total Top Stars * 6)
  const score = (p.followers * 4) + (p.public_repos * 2) + (p.public_gists * 1) + (totalStars * 6);
  
  // Standardize 0 to 100 on log/cap basis
  const cappedScore = Math.min(score, 5000);
  const percentage = Math.round((cappedScore / 5000) * 100);
  
  insightTotalRepos.textContent = p.public_repos;
  insightPopularity.textContent = formatCount(score);
  insightGists.textContent = p.public_gists;
  scoreProgressFill.style.width = `${percentage}%`;
  
  // Determine Developer Level Badge
  let badgeName = 'Beginner Developer';
  let badgeIcon = 'award';
  
  if (p.followers > 10000 || totalStars > 5000) {
    badgeName = 'GitHub Star';
    badgeIcon = 'sparkles';
  } else if (p.public_repos > 60 || totalStars > 1000) {
    badgeName = 'Open Source Contributor';
    badgeIcon = 'git-pull-request';
  } else if (p.followers > 500 && p.public_repos > 25) {
    badgeName = 'Advanced Developer';
    badgeIcon = 'graduation-cap';
  } else if (p.followers > 50 || p.public_repos > 10) {
    badgeName = 'Growing Developer';
    badgeIcon = 'trending-up';
  }
  
  developerBadge.innerHTML = `<i data-lucide="${badgeIcon}"></i> <span>${badgeName}</span>`;
  
  // Left profile badge icon replacement
  const pLevelIcon = document.getElementById('p-level-icon');
  pLevelIcon.innerHTML = `<i data-lucide="${badgeIcon}"></i>`;
}

// Helper to format large numbers
function formatCount(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

// Helper for programming language colors
function getLanguageColor(lang) {
  const colors = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Python': '#3572A5',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'C++': '#f34b7d',
    'C#': '#178600',
    'Java': '#b07219',
    'PHP': '#4F5D95',
    'Shell': '#89e051',
    'Dart': '#00B4AB',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'C': '#555555'
  };
  return colors[lang] || '#8b949e';
}

// Search History Management
function addToSearchHistory(username) {
  const normalized = username.toLowerCase().trim();
  if (!normalized) return;
  
  // Remove duplicate
  state.searchHistory = state.searchHistory.filter(item => item.toLowerCase() !== normalized);
  
  // Insert at front
  state.searchHistory.unshift(normalized);
  
  // Cap history at 5 items
  if (state.searchHistory.length > 5) {
    state.searchHistory.pop();
  }
  
  localStorage.setItem('devscope_search_history', JSON.stringify(state.searchHistory));
  renderSearchHistoryChips();
}

function renderSearchHistoryChips() {
  historyChips.innerHTML = '';
  
  if (state.searchHistory.length === 0) {
    historyChips.innerHTML = '<span class="text-muted" style="font-size: 0.8rem;">No recent searches</span>';
    return;
  }
  
  state.searchHistory.forEach(username => {
    const chip = document.createElement('button');
    chip.className = 'history-chip';
    chip.innerHTML = `<i data-lucide="history"></i> <span>${username}</span>`;
    
    chip.addEventListener('click', () => {
      fetchGitHubProfile(username);
    });
    
    historyChips.appendChild(chip);
  });
  
  lucide.createIcons();
}

// Saved Profiles Bookmark Actions
function toggleSaveProfile() {
  const p = state.currentProfile;
  if (!p) return;
  
  const idx = state.savedProfiles.findIndex(item => item.login.toLowerCase() === p.login.toLowerCase());
  
  if (idx !== -1) {
    // Already saved, remove it
    state.savedProfiles.splice(idx, 1);
    saveProfileBtn.classList.remove('active');
    saveProfileBtn.title = 'Bookmark Profile';
    showToast(`Removed @${p.login} from saved profiles`, 'success');
  } else {
    // Add to saved
    const miniProfile = {
      login: p.login,
      name: p.name || p.login,
      avatar_url: p.avatar_url,
      bio: p.bio || 'No bio specified.',
      public_repos: p.public_repos,
      followers: p.followers,
      following: p.following
    };
    state.savedProfiles.unshift(miniProfile);
    saveProfileBtn.classList.add('active');
    saveProfileBtn.title = 'Remove Bookmark';
    showToast(`Added @${p.login} to saved profiles`, 'success');
  }
  
  localStorage.setItem('devscope_saved_profiles', JSON.stringify(state.savedProfiles));
}

function renderSavedProfiles() {
  savedProfilesGrid.innerHTML = '';
  
  if (state.savedProfiles.length === 0) {
    savedProfilesGrid.innerHTML = `
      <div class="no-saved-profiles">
        <i data-lucide="bookmark-x"></i>
        <h3>No Bookmarked Profiles</h3>
        <p>Explore developers and click the bookmark button on their dashboard cards to list them here.</p>
        <button onclick="switchView('dashboard')" class="settings-btn" style="margin-top: 8px;">Explore Profiles</button>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  state.savedProfiles.forEach(item => {
    const card = document.createElement('div');
    card.className = 'saved-card';
    
    card.innerHTML = `
      <button class="saved-remove-btn" title="Remove bookmark" data-username="${item.login}">
        <i data-lucide="trash-2"></i>
      </button>
      <img src="${item.avatar_url}" alt="${item.name}" class="saved-avatar">
      <h3 class="saved-name">${item.name}</h3>
      <span class="saved-username">@${item.login}</span>
      <p class="saved-bio">${item.bio}</p>
      
      <div class="saved-stats">
        <div class="saved-stat-item" title="Repositories">
          <i data-lucide="folder"></i>
          <span>${item.public_repos}</span>
        </div>
        <div class="saved-stat-item" title="Followers">
          <i data-lucide="users"></i>
          <span>${formatCount(item.followers)}</span>
        </div>
        <div class="saved-stat-item" title="Following">
          <i data-lucide="user-plus"></i>
          <span>${formatCount(item.following)}</span>
        </div>
      </div>
    `;
    
    // Clicking card (except remove button) opens profile in dashboard
    card.addEventListener('click', (e) => {
      if (e.target.closest('.saved-remove-btn')) return;
      switchView('dashboard');
      fetchGitHubProfile(item.login);
    });
    
    // Remove Bookmark Event
    const removeBtn = card.querySelector('.saved-remove-btn');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSavedProfile(item.login);
    });
    
    savedProfilesGrid.appendChild(card);
  });
  
  lucide.createIcons();
}

function removeSavedProfile(username) {
  state.savedProfiles = state.savedProfiles.filter(item => item.login.toLowerCase() !== username.toLowerCase());
  localStorage.setItem('devscope_saved_profiles', JSON.stringify(state.savedProfiles));
  renderSavedProfiles();
  
  // If current profile is the one removed, toggle bookmark icon in dashboard
  if (state.currentProfile && state.currentProfile.login.toLowerCase() === username.toLowerCase()) {
    saveProfileBtn.classList.remove('active');
    saveProfileBtn.title = 'Bookmark Profile';
  }
  
  showToast(`Removed @${username} from saved profiles`, 'success');
}

// Render Trending Developers
function renderTrendingPreloads() {
  trendingDevsGrid.innerHTML = '';
  
  // Curated descriptions for preloads
  const trendingDetails = {
    'torvalds': { name: 'Linus Torvalds', bio: 'Creator of Linux Kernel and Git source control system.', followers: '200k', repos: '7', following: '0' },
    'gaearon': { name: 'Dan Abramov', bio: 'Co-creator of Redux and developer of React Core components.', followers: '90k', repos: '260', following: '12' },
    'tj': { name: 'TJ Holowaychuk', bio: 'Creator of Express, Commander, Koa, and Apex structures.', followers: '48k', repos: '300', following: '40' },
    'sindresorhus': { name: 'Sindre Sorhus', bio: 'Full-time open-sourcerer. Creator of Yeoman, Chalk, AVA.', followers: '55k', repos: '1000', following: '10' },
    'yyx990803': { name: 'Evan You', bio: 'Creator of Vue.js, Vite, and frontend compiler tools.', followers: '98k', repos: '180', following: '90' }
  };
  
  TRENDING_USERNAMES.forEach(username => {
    const details = trendingDetails[username] || { name: username, bio: 'Trending Developer Profile.', followers: '—', repos: '—', following: '—' };
    const card = document.createElement('div');
    card.className = 'trending-card';
    
    card.innerHTML = `
      <img src="https://github.com/${username}.png" alt="${details.name}" class="trending-avatar" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'">
      <h3 class="trending-name">${details.name}</h3>
      <span class="trending-username">@${username}</span>
      <p class="trending-bio">${details.bio}</p>
      
      <div class="trending-footer">
        <div class="trending-stat">
          <span class="trending-stat-val">${details.repos}</span>
          <span class="trending-stat-lbl">Repos</span>
        </div>
        <div class="trending-stat">
          <span class="trending-stat-val">${details.followers}</span>
          <span class="trending-stat-lbl">Followers</span>
        </div>
        <div class="trending-stat">
          <span class="trending-stat-val">${details.following}</span>
          <span class="trending-stat-lbl">Following</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      switchView('dashboard');
      fetchGitHubProfile(username);
    });
    
    trendingDevsGrid.appendChild(card);
  });
  
  lucide.createIcons();
}

// Toast Notifications Helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
    <div class="toast-progress"></div>
  `;
  
  toastContainer.appendChild(toast);
  lucide.createIcons();
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
