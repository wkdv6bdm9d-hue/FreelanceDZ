document.addEventListener('DOMContentLoaded', () => {
    // SPA Views
    const landingView = document.getElementById('landing-view');
    const dashboardView = document.getElementById('dashboard-view-wrapper');
    const recruitView = document.getElementById('recruit-view');
    const findWorkView = document.getElementById('find-work-view');

    // Navigation Headers
    const linkExplore = document.getElementById('link-explore');
    const linkDashboard = document.getElementById('link-dashboard');
    const mlinkExplore = document.getElementById('mlink-explore');
    const mlinkDashboard = document.getElementById('mlink-dashboard');

    // Dashboard Sub-navigation Tabs
    const dbLinkOverview = document.getElementById('db-link-overview');
    const dbLinkClients = document.getElementById('db-link-clients');
    const dbLinkSettings = document.getElementById('db-link-settings');
    const panelOverview = document.getElementById('panel-overview');
    const panelClients = document.getElementById('panel-clients');
    const panelSettings = document.getElementById('panel-settings');

    // Modals
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const clientModal = document.getElementById('client-modal');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const resetPasswordModal = document.getElementById('reset-password-modal');
    const jobModal = document.getElementById('job-modal');
    const invoiceModal = document.getElementById('invoice-modal');

    // Trigger Buttons
    const btnOpenLogin = document.getElementById('btn-login-modal');
    const btnOpenLoginMobile = document.getElementById('btn-login-mobile');
    const btnOpenSignup = document.getElementById('btn-signup-modal');
    const btnOpenSignupMobile = document.getElementById('btn-signup-mobile');
    const btnOpenAddClient = document.getElementById('btn-add-client');
    const btnOpenPostJob = document.getElementById('btn-post-job-trigger');
    const linkForgotPassword = document.getElementById('link-forgot-password');
    const btnNewInvoice = document.getElementById('btn-new-invoice');

    const btnCloseLogin = document.getElementById('btn-close-login');
    const btnCloseSignup = document.getElementById('btn-close-signup');
    const btnCloseClient = document.getElementById('btn-close-client');
    const btnCloseForgot = document.getElementById('btn-close-forgot');
    const btnCloseReset = document.getElementById('btn-close-reset');
    const btnCloseJob = document.getElementById('btn-close-job');
    const btnCloseInvoice = document.getElementById('btn-close-invoice');

    const heroBtnHire = document.getElementById('hero-btn-hire');
    const heroBtnWork = document.getElementById('hero-btn-work');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const clientForm = document.getElementById('client-form');
    const settingsForm = document.getElementById('settings-form');
    const passwordForm = document.getElementById('password-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const jobForm = document.getElementById('job-form');
    const invoiceForm = document.getElementById('invoice-form');

    // Inputs & Container Search Controls
    const clientSearchInput = document.getElementById('client-search');
    const jobSearchInput = document.getElementById('job-search-input');

    // State Variables
    let currentUser = null;
    let currentClientsList = [];

    // Mobile Navbar Toggler
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const menuIcon = menuToggle?.querySelector('i');

    if (menuToggle && mobileNav && menuIcon) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            menuIcon.className = mobileNav.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
    }

    // Modal Helpers
    const showModal = (modal) => modal?.classList.remove('hidden');
    const hideModal = (modal) => {
        modal?.classList.add('hidden');
        const errDiv = modal?.querySelector('.form-error');
        if (errDiv) {
            errDiv.textContent = '';
            errDiv.classList.add('hidden');
        }
        const succDiv = modal?.querySelector('.form-success');
        if (succDiv) succDiv.classList.add('hidden');
    };

    // Modal Events
    btnOpenLogin?.addEventListener('click', () => showModal(loginModal));
    btnOpenLoginMobile?.addEventListener('click', () => {
        mobileNav?.classList.remove('open');
        showModal(loginModal);
    });
    btnOpenSignup?.addEventListener('click', () => showModal(signupModal));
    btnOpenSignupMobile?.addEventListener('click', () => {
        mobileNav?.classList.remove('open');
        showModal(signupModal);
    });

    btnCloseLogin?.addEventListener('click', () => hideModal(loginModal));
    btnCloseSignup?.addEventListener('click', () => hideModal(signupModal));
    btnCloseClient?.addEventListener('click', () => hideModal(clientModal));
    btnCloseForgot?.addEventListener('click', () => hideModal(forgotPasswordModal));
    btnCloseReset?.addEventListener('click', () => hideModal(resetPasswordModal));
    btnCloseJob?.addEventListener('click', () => hideModal(jobModal));
    btnCloseInvoice?.addEventListener('click', () => hideModal(invoiceModal));

    linkForgotPassword?.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(loginModal);
        // Clear dev preview fields
        const devWrapper = document.getElementById('dev-reset-link-wrapper');
        if (devWrapper) devWrapper.classList.add('hidden');
        showModal(forgotPasswordModal);
    });

    // Close on overlay click
    [loginModal, signupModal, clientModal, forgotPasswordModal, resetPasswordModal, jobModal, invoiceModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal);
        });
    });

    // Landing Hero Actions Navigation
    heroBtnHire?.addEventListener('click', () => { window.location.hash = '#recruit'; });
    heroBtnWork?.addEventListener('click', () => { window.location.hash = '#find-work'; });

    // Dashboard navigation subpanels
    function setupDashboardTabs() {
        const hash = window.location.hash;
        [dbLinkOverview, dbLinkClients, dbLinkSettings].forEach(el => el?.classList.remove('active'));
        [panelOverview, panelClients, panelSettings].forEach(el => el?.classList.add('hidden'));

        if (hash === '#dashboard/clients' || hash === '#clients') {
            panelClients?.classList.remove('hidden');
            dbLinkClients?.classList.add('active');
            loadClients();
        } else if (hash === '#dashboard/settings' || hash === '#settings') {
            panelSettings?.classList.remove('hidden');
            dbLinkSettings?.classList.add('active');
            loadSettingsData();
        } else {
            panelOverview?.classList.remove('hidden');
            dbLinkOverview?.classList.add('active');
            loadDashboardData();
        }
    }

    // SPA Router
    async function router() {
        let hash = window.location.hash || '#explore';

        // Check if hash is reset password token link e.g. #reset-password?token=XXX
        if (hash.startsWith('#reset-password')) {
            const params = new URLSearchParams(hash.split('?')[1]);
            const token = params.get('token');
            if (token) {
                const tokenInput = document.getElementById('reset-token-input');
                if (tokenInput) tokenInput.value = token;
                showModal(resetPasswordModal);
            }
            window.location.hash = '#explore';
            return;
        }

        // Hide all major pages
        [landingView, dashboardView, recruitView, findWorkView].forEach(view => {
            view?.classList.add('hidden');
        });

        // Reset Header Active Links
        [linkExplore, linkDashboard, mlinkExplore, mlinkDashboard].forEach(el => el?.classList.remove('active'));

        if (hash.startsWith('#dashboard') || hash === '#clients' || hash === '#settings' || hash === '#overview') {
            if (!currentUser) {
                await checkAuthStatus();
            }
            if (!currentUser) {
                window.location.hash = '#explore';
                showModal(loginModal);
                return;
            }
            dashboardView?.classList.remove('hidden');
            linkDashboard?.classList.add('active');
            mlinkDashboard?.classList.add('active');
            setupDashboardTabs();
        } else if (hash === '#recruit') {
            recruitView?.classList.remove('hidden');
            linkExplore?.classList.add('active');
            mlinkExplore?.classList.add('active');
            loadFreelancers();
        } else if (hash === '#find-work') {
            findWorkView?.classList.remove('hidden');
            linkExplore?.classList.add('active');
            mlinkExplore?.classList.add('active');
            loadJobs();
        } else {
            // Default #explore (Landing Page)
            landingView?.classList.remove('hidden');
            linkExplore?.classList.add('active');
            mlinkExplore?.classList.add('active');
            document.title = "FreelanceDZ - Plateforme des Freelances Algériens";
            loadLandingFeed();
        }
    }

    window.addEventListener('hashchange', router);

    // Sidebar tab clicks
    dbLinkOverview?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#dashboard';
    });
    dbLinkClients?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#dashboard/clients';
    });
    dbLinkSettings?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = '#dashboard/settings';
    });

    // Authentication verification helper
    async function checkAuthStatus() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                updateUserUI();
            } else {
                currentUser = null;
                updateUserUI();
            }
        } catch (e) {
            console.error('Auth verification error:', e);
        }
    }

    function updateUserUI() {
        if (currentUser) {
            btnOpenLogin?.classList.add('hidden');
            btnOpenSignup?.classList.add('hidden');
            linkDashboard?.classList.remove('hidden');
            mlinkDashboard?.classList.remove('hidden');

            const nameEl = document.getElementById('db-user-name');
            const avatarEl = document.getElementById('db-user-avatar');
            if (nameEl) nameEl.textContent = currentUser.username;
            if (avatarEl && currentUser.username) {
                avatarEl.textContent = currentUser.username.charAt(0).toUpperCase();
            }
        } else {
            btnOpenLogin?.classList.remove('hidden');
            btnOpenSignup?.classList.remove('hidden');
            linkDashboard?.classList.add('hidden');
            mlinkDashboard?.classList.add('hidden');
        }
    }

    // Register Form
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const role = document.getElementById('signup-role').value;
        const errorEl = document.getElementById('signup-error');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });
            const data = await res.json();
            if (res.ok) {
                currentUser = data.user;
                updateUserUI();
                hideModal(signupModal);
                window.location.hash = '#dashboard';
            } else {
                errorEl.textContent = data.error || "Erreur inscription";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl.classList.remove('hidden');
        }
    });

    // Login Form
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                currentUser = data.user;
                updateUserUI();
                hideModal(loginModal);
                window.location.hash = '#dashboard';
            } else {
                errorEl.textContent = data.error || "Email ou mot de passe incorrect";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl.classList.remove('hidden');
        }
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/logout', { method: 'POST' });
            currentUser = null;
            updateUserUI();
            window.location.hash = '#explore';
        } catch (err) {
            console.error('Logout error:', err);
        }
    });

    // Forgot Password Submit
    forgotPasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const errorEl = document.getElementById('forgot-error');
        const devWrapper = document.getElementById('dev-reset-link-wrapper');
        const devLink = document.getElementById('dev-reset-link');

        errorEl?.classList.add('hidden');
        devWrapper?.classList.add('hidden');

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.dev_link) {
                    devLink.href = data.dev_link;
                    devLink.textContent = data.dev_link;
                    devWrapper.classList.remove('hidden');
                }
            } else {
                errorEl.textContent = data.error || "Erreur de token";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de communication";
            errorEl?.classList.remove('hidden');
        }
    });

    // Reset Password Submit
    resetPasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('reset-token-input').value;
        const password = document.getElementById('reset-new-password').value;
        const errorEl = document.getElementById('reset-error');

        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Mot de passe mis à jour avec succès! Connectez-vous avec vos nouveaux identifiants.");
                hideModal(resetPasswordModal);
                showModal(loginModal);
            } else {
                errorEl.textContent = data.error || "Token incorrect ou expiré";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl.classList.remove('hidden');
        }
    });

    // Invoice Creation
    async function openInvoiceModal() {
        invoiceForm?.reset();
        document.getElementById('invoice-error')?.classList.add('hidden');

        // Default issue date = today
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('invoice-date');
        if (dateInput) dateInput.value = today;

        // Suggest invoice number: INV-YYYY-last4digits of timestamp
        const year = new Date().getFullYear();
        const ts = String(Date.now()).slice(-4);
        const numInput = document.getElementById('invoice-number');
        if (numInput) numInput.value = `INV-${year}-${ts}`;

        // Populate client datalist from saved clients
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const clients = await res.json();
                const datalist = document.getElementById('clients-datalist');
                if (datalist) {
                    datalist.innerHTML = clients.map(c => `<option value="${c.name}">`).join('');
                }
            }
        } catch (_) {}

        showModal(invoiceModal);
    }

    btnNewInvoice?.addEventListener('click', () => openInvoiceModal());

    invoiceForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('invoice-error');
        errorEl?.classList.add('hidden');

        const payload = {
            invoice_number: document.getElementById('invoice-number').value.trim(),
            client_name:    document.getElementById('invoice-client').value.trim(),
            description:    document.getElementById('invoice-description').value.trim(),
            amount:         document.getElementById('invoice-amount').value,
            payment_method: document.getElementById('invoice-payment').value,
            date:           document.getElementById('invoice-date').value,
            due_date:       document.getElementById('invoice-due-date').value,
            status:         document.getElementById('invoice-status').value,
        };

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                hideModal(invoiceModal);
                loadDashboardData(); // Refresh stats + invoice table with real data
            } else {
                errorEl.textContent = data.error || 'Erreur lors de la création';
                errorEl?.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = 'Erreur de connexion au serveur';
            errorEl?.classList.remove('hidden');
        }
    });

    // Load Dashboard Financials & dynamic rendering
    async function loadDashboardData() {
        try {
            const res = await fetch('/api/dashboard/data');
            if (res.ok) {
                const data = await res.json();
                
                document.getElementById('stat-revenue').textContent = data.stats.revenue;
                document.getElementById('stat-expenses').textContent = data.stats.expenses;
                document.getElementById('stat-profit').textContent = data.stats.profit;
                document.getElementById('stat-unpaid').textContent = data.stats.unpaid;

                renderChart(data.chart);

                const tbody = document.getElementById('db-invoices-body');
                if (tbody) {
                    tbody.innerHTML = '';
                    if (data.invoices.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="6" class="loading-state">Aucune facture enregistrée. Cliquez sur <strong>Nouvelle Facture</strong> pour commencer.</td></tr>`;
                    } else {
                        data.invoices.forEach(inv => {
                            const tr = document.createElement('tr');
                            const statusClass = inv.status === 'Payée' ? 'status-paid' : 'status-pending';
                            tr.innerHTML = `
                                <td><code style="font-size:0.78rem; color:var(--primary); background:rgba(245,158,11,0.08); padding:2px 6px; border-radius:4px;">${inv.invoice_number}</code></td>
                                <td>${inv.client_name}</td>
                                <td>${inv.date}</td>
                                <td class="table-amount">${inv.amount.toLocaleString()} DA</td>
                                <td><span class="badge-method">${inv.payment_method}</span></td>
                                <td><span class="badge-status ${statusClass}">${inv.status}</span></td>
                            `;
                            tbody.appendChild(tr);
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    function renderChart(chartData) {
        const container = document.getElementById('db-chart-container');
        if (!container) return;

        container.innerHTML = '';
        const values = Object.values(chartData);
        const maxVal = Math.max(...values, 0);

        if (maxVal === 0) {
            container.innerHTML = `<div class="loading-state" style="padding-top: 80px;">Pas encore de factures encaissées pour afficher le graphique.</div>`;
            return;
        }

        Object.entries(chartData).forEach(([month, val]) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-bar-wrapper';
            const percentHeight = maxVal > 0 ? (val / maxVal) * 80 + 10 : 0;
            const valLabel = val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val;

            wrapper.innerHTML = `
                <div class="chart-bar" style="height: ${percentHeight}%;">
                    <span>${val > 0 ? valLabel : ''}</span>
                </div>
                <div class="chart-label">${month}</div>
            `;
            container.appendChild(wrapper);
        });
    }

    // Load Settings Panel Details
    function loadSettingsData() {
        const emailInput = document.getElementById('settings-email');
        const usernameInput = document.getElementById('settings-username');
        const successEl = document.getElementById('settings-success');
        const errorEl = document.getElementById('settings-error');
        const pwdSuccessEl = document.getElementById('password-success');
        const pwdErrorEl = document.getElementById('password-error');

        if (emailInput && usernameInput && currentUser) {
            emailInput.value = currentUser.email;
            usernameInput.value = currentUser.username;
        }
        successEl?.classList.add('hidden');
        errorEl?.classList.add('hidden');
        pwdSuccessEl?.classList.add('hidden');
        pwdErrorEl?.classList.add('hidden');
    }

    settingsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('settings-username').value;
        const email = document.getElementById('settings-email').value;
        const errorEl = document.getElementById('settings-error');
        const successEl = document.getElementById('settings-success');

        errorEl?.classList.add('hidden');
        successEl?.classList.add('hidden');

        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email })
            });
            const data = await res.json();
            if (res.ok) {
                currentUser = data.user;
                updateUserUI();
                successEl?.classList.remove('hidden');
            } else {
                errorEl.textContent = data.error || "Erreur de mise à jour";
                errorEl?.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl?.classList.remove('hidden');
        }
    });

    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const current_password = document.getElementById('current-password').value;
        const new_password = document.getElementById('new-password').value;
        const errorEl = document.getElementById('password-error');
        const successEl = document.getElementById('password-success');

        errorEl?.classList.add('hidden');
        successEl?.classList.add('hidden');

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password, new_password })
            });
            const data = await res.json();
            if (res.ok) {
                passwordForm.reset();
                successEl?.classList.remove('hidden');
            } else {
                errorEl.textContent = data.error || "Erreur lors du changement de mot de passe";
                errorEl?.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl?.classList.remove('hidden');
        }
    });

    // Client search and list
    async function loadClients(query = '') {
        const tbody = document.getElementById('db-clients-body');
        if (!tbody) return;

        tbody.innerHTML = `<tr><td colspan="4" class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</td></tr>`;

        try {
            const url = query ? `/api/clients?q=${encodeURIComponent(query)}` : '/api/clients';
            const res = await fetch(url);
            if (res.ok) {
                currentClientsList = await res.json();
                tbody.innerHTML = '';
                if (currentClientsList.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="loading-state">Aucun client pour le moment.</td></tr>`;
                } else {
                    currentClientsList.forEach(c => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${c.name}</strong></td>
                            <td>${c.email || '-'}</td>
                            <td>${c.phone || '-'}</td>
                            <td style="text-align: right;">
                                <button class="btn-action-edit" data-id="${c.id}"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button class="btn-action-delete" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });

                    tbody.querySelectorAll('.btn-action-edit').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            const client = currentClientsList.find(c => c.id == id);
                            if (client) openClientModal(client);
                        });
                    });

                    tbody.querySelectorAll('.btn-action-delete').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-id');
                            if (confirm('Voulez-vous vraiment supprimer ce client ?')) {
                                deleteClient(id);
                            }
                        });
                    });
                }
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="4" class="loading-state">Erreur de chargement des clients.</td></tr>`;
        }
    }

    let searchTimeout = null;
    clientSearchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadClients(clientSearchInput.value);
        }, 300);
    });

    function openClientModal(client = null) {
        const titleEl = document.getElementById('client-modal-title');
        const submitEl = document.getElementById('btn-client-submit');
        const idInput = document.getElementById('client-id');
        const nameInput = document.getElementById('client-name');
        const emailInput = document.getElementById('client-email');
        const phoneInput = document.getElementById('client-phone');

        if (client) {
            titleEl.textContent = "Modifier le Client";
            submitEl.textContent = "Mettre à jour";
            idInput.value = client.id;
            nameInput.value = client.name;
            emailInput.value = client.email || '';
            phoneInput.value = client.phone || '';
        } else {
            titleEl.textContent = "Nouveau Client";
            submitEl.textContent = "Enregistrer";
            clientForm.reset();
            idInput.value = '';
        }
        showModal(clientModal);
    }

    btnOpenAddClient?.addEventListener('click', () => openClientModal());

    clientForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('client-id').value;
        const name = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;
        const phone = document.getElementById('client-phone').value;
        const errorEl = document.getElementById('client-error');

        const url = id ? `/api/clients/${id}` : '/api/clients';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });
            const data = await res.json();
            if (res.ok) {
                hideModal(clientModal);
                loadClients(clientSearchInput?.value || '');
            } else {
                errorEl.textContent = data.error || "Une erreur est survenue";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de communication avec le serveur";
            errorEl.classList.remove('hidden');
        }
    });

    async function deleteClient(id) {
        try {
            const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadClients(clientSearchInput?.value || '');
            } else {
                alert('Erreur lors de la suppression du client.');
            }
        } catch (err) {
            console.error('Erreur:', err);
        }
    }

    // Recruit View - Load registered Freelancers
    async function loadFreelancers() {
        const container = document.getElementById('freelancers-container');
        if (!container) return;

        container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Recherche des freelances algériens...</div>`;

        try {
            const res = await fetch('/api/freelancers');
            if (res.ok) {
                const freelancers = await res.json();
                container.innerHTML = '';
                if (freelancers.length === 0) {
                    container.innerHTML = `<div class="loading-state">Aucun freelance enregistré pour le moment. Soyez le premier à vous inscrire !</div>`;
                } else {
                    freelancers.forEach(f => {
                        const card = document.createElement('div');
                        card.className = 'stat-card';
                        card.style.textAlign = 'left';
                        card.style.cursor = 'default';
                        card.innerHTML = `
                            <div class="db-user-profile" style="border-bottom:none; padding-bottom:0;">
                                <div class="avatar">${f.username.charAt(0).toUpperCase()}</div>
                                <div class="user-info">
                                    <h4 style="font-size:1.1rem; color:var(--primary);">${f.username}</h4>
                                    <span style="font-size:0.9rem; color:var(--text-muted);"><i class="fa-solid fa-envelope"></i> ${f.email}</span>
                                </div>
                            </div>
                        `;
                        container.appendChild(card);
                    });
                }
            }
        } catch (err) {
            container.innerHTML = `<div class="loading-state">Erreur de chargement des profils.</div>`;
        }
    }

    // Find Work View - Load posted jobs
    async function loadJobs(query = '') {
        const container = document.getElementById('jobs-list-container');
        if (!container) return;

        container.innerHTML = `<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Recherche des missions en cours...</div>`;

        try {
            const url = query ? `/api/jobs?q=${encodeURIComponent(query)}` : '/api/jobs';
            const res = await fetch(url);
            if (res.ok) {
                const jobs = await res.json();
                container.innerHTML = '';
                if (jobs.length === 0) {
                    container.innerHTML = `<div class="loading-state">Aucune mission publiée correspondant aux critères.</div>`;
                } else {
                    jobs.forEach(j => {
                        const card = document.createElement('div');
                        card.className = 'stat-card';
                        card.style.textAlign = 'left';
                        card.style.cursor = 'default';
                        card.style.display = 'flex';
                        card.style.flexDirection = 'column';
                        card.style.gap = '10px';
                        card.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h4 style="font-size:1.2rem; color:var(--primary);">${j.title}</h4>
                                <span class="badge-pay">${j.budget.toLocaleString()} DA</span>
                            </div>
                            <p style="color:var(--text-muted); font-size:0.95rem; margin-top:8px;">${j.description}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:0.8rem; color:var(--text-muted);">
                                <span><i class="fa-solid fa-building"></i> ${j.employer_name}</span>
                                <span><i class="fa-solid fa-calendar-days"></i> ${j.created_at}</span>
                            </div>
                        `;
                        container.appendChild(card);
                    });
                }
            }
        } catch (err) {
            container.innerHTML = `<div class="loading-state">Erreur de chargement des missions.</div>`;
        }
    }

    // Debounced Job search input listeners
    let jobSearchTimeout = null;
    jobSearchInput?.addEventListener('input', () => {
        clearTimeout(jobSearchTimeout);
        jobSearchTimeout = setTimeout(() => {
            loadJobs(jobSearchInput.value);
        }, 300);
    });

    // Open Job Publish form
    btnOpenPostJob?.addEventListener('click', async () => {
        if (!currentUser) {
            await checkAuthStatus();
        }
        if (!currentUser) {
            showModal(loginModal);
        } else {
            jobForm.reset();
            showModal(jobModal);
        }
    });

    // Job Publish Form Submit
    jobForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('job-title').value;
        const description = document.getElementById('job-description').value;
        const budget = document.getElementById('job-budget').value;
        const category = document.getElementById('job-category').value;
        const errorEl = document.getElementById('job-error');

        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, budget, category })
            });
            const data = await res.json();
            if (res.ok) {
                hideModal(jobModal);
                loadJobs(jobSearchInput?.value || '');
            } else {
                errorEl.textContent = data.error || "Erreur de publication";
                errorEl.classList.remove('hidden');
            }
        } catch (err) {
            errorEl.textContent = "Erreur de connexion";
            errorEl.classList.remove('hidden');
        }
    });

    // Landing Page Explore Feed (Loads recent job missions)
    async function loadLandingFeed() {
        const container = document.getElementById('jobs-container');
        if (!container) return;

        try {
            const res = await fetch('/api/jobs');
            if (res.ok) {
                const jobs = await res.json();
                container.innerHTML = '';
                if (jobs.length === 0) {
                    container.innerHTML = `<div class="loading-state">Aucun projet posté récemment en Algérie.</div>`;
                } else {
                    // Limit to 3 recent jobs on landing page
                    jobs.slice(0, 3).forEach(j => {
                        const card = document.createElement('div');
                        card.className = 'stat-card';
                        card.style.textAlign = 'left';
                        card.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h4 style="font-size:1.15rem; color:var(--primary);">${j.title}</h4>
                                <span class="badge-pay" style="background-color:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2); padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600; color:var(--primary);">${j.budget.toLocaleString()} DA</span>
                            </div>
                            <p style="color:var(--text-muted); font-size:0.9rem; margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${j.description}</p>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; font-size:0.75rem; color:var(--text-muted);">
                                <span>Par ${j.employer_name}</span>
                                <span>${j.created_at}</span>
                            </div>
                        `;
                        container.appendChild(card);
                    });
                }
            }
        } catch (e) {
            container.innerHTML = `<div class="loading-state">Erreur de chargement.</div>`;
        }
    }

    // Startup Init
    checkAuthStatus().then(() => {
        router();
    });
});
