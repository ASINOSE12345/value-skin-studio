// VALUE SKIN STUDIO - ADMIN CRM PANEL
// =====================================================

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';
const API_V1 = `${API_BASE}/v1`;

let authToken = localStorage.getItem('adminToken');
let currentUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
let calendar = null;
let servicesCache = [];

// Función para obtener el token (necesaria para funciones de WhatsApp)
function getToken() {
    return authToken || localStorage.getItem('adminToken');
}

// =====================================================
// UTILIDADES
// =====================================================

const getHeaders = (auth = true) => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
};

const fetchAPI = async (url, options = {}) => {
    try {
        const response = await fetch(url, {
            ...options,
            headers: { ...getHeaders(options.auth !== false), ...options.headers }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error en la solicitud');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
};

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(amount || 0);
};

// =====================================================
// AUTENTICACION
// =====================================================

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');

    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Iniciando...';
    }
    if (errorDiv) errorDiv.style.display = 'none';

    try {
        const data = await fetchAPI(`${API_V1}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            auth: false
        });

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            showDashboard();
            showToast('Sesion iniciada correctamente', 'success');
        }
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = error.message || 'Error al iniciar sesion';
            errorDiv.style.display = 'block';
        }
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Iniciar Sesion';
        }
    }
});

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    showToast('Sesion cerrada', 'info');
}

async function checkAuth() {
    if (!authToken) return;
    try {
        const data = await fetchAPI(`${API_V1}/auth/verify`);
        if (data.success) {
            showDashboard();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

function showDashboard() {
    const nameEl = document.getElementById('userName');
    if (nameEl) {
        nameEl.textContent = currentUser?.firstName || currentUser?.username || 'Admin';
    }
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadServicesCache();
    loadDashboardStats();
    loadTodayAppointments();
}

// =====================================================
// NAVEGACION - Arreglado para el HTML actual
// =====================================================

document.querySelectorAll('.sidebar nav a[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        showSection(section);
    });
});

function showSection(section) {
    // Actualizar navegacion activa
    document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar nav a[data-section="${section}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Mostrar seccion correspondiente
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sectionEl = document.getElementById(`section-${section}`);
    if (sectionEl) sectionEl.classList.add('active');

    // Cargar datos de la seccion
    loadSectionData(section);
}

function loadSectionData(section) {
    switch (section) {
        case 'dashboard': loadDashboardStats(); loadTodayAppointments(); break;
        case 'calendar': initCalendar(); break;
        case 'appointments': loadAppointments(); break;
        case 'clients': loadClients(); break;
        case 'contacts': loadContacts(); break;
        case 'invoices': loadInvoices(); break;
        case 'services': loadServices(); break;
        case 'promotions': loadPromotions(); break;
        case 'banners': loadBanners(); break;
        case 'settings': loadSettings(); loadWhatsAppStatus(); break;
        case 'users': loadUsers(); break;
    }
}

// =====================================================
// DASHBOARD - IDs corregidos
// =====================================================

async function loadDashboardStats() {
    try {
        const data = await fetchAPI(`${API_V1}/admin/stats`);
        if (data.success) {
            const s = data.data;
            // IDs corregidos para coincidir con el HTML
            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setEl('statAppointmentsToday', s.appointments?.today || 0);
            setEl('statAppointmentsPending', s.appointments?.pending || s.appointments?.upcoming || 0);
            setEl('statClients', s.clients?.total || 0);
            setEl('statContactsPending', s.contacts?.pending || 0);
            setEl('statRevenue', formatCurrency(s.invoices?.monthTotal || s.revenue?.month || 0));
            setEl('statServices', s.services?.active || s.services?.total || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTodayAppointments() {
    const container = document.getElementById('todayAppointments');
    if (!container) return;

    try {
        const data = await fetchAPI(`${API_V1}/admin/appointments/today`);
        if (data.success && data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(apt => `
                <div class="activity-item">
                    <div class="activity-icon appointment">📅</div>
                    <div class="activity-content">
                        <h4>${apt.client_name || apt.name || 'Sin nombre'}</h4>
                        <p>${apt.service || 'Servicio'} - ${apt.time || apt.appointment_time || ''}</p>
                    </div>
                    <span class="badge ${apt.status || 'pending'}">${apt.status || 'pending'}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><p>No hay citas para hoy</p></div>';
        }
    } catch (error) {
        console.error('Error loading today appointments:', error);
        container.innerHTML = '<div class="empty-state"><p>Error al cargar</p></div>';
    }
}

// =====================================================
// CALENDARIO
// =====================================================

async function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    if (calendar) {
        calendar.destroy();
        calendar = null;
    }

    try {
        const aptData = await fetchAPI(`${API_V1}/admin/appointments`);
        const events = (aptData.data || []).map(apt => ({
            id: apt.id,
            title: `${apt.client_name || apt.name || 'Cliente'} - ${apt.service || 'Servicio'}`,
            start: `${apt.date || apt.appointment_date}T${apt.time || apt.appointment_time || '09:00'}`,
            backgroundColor: getStatusColor(apt.status),
            borderColor: getStatusColor(apt.status),
            extendedProps: apt
        }));

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events,
            eventClick: (info) => viewAppointmentDetails(info.event.extendedProps),
            dateClick: (info) => openNewAppointmentModal(info.dateStr),
            editable: false,
            selectable: true
        });
        calendar.render();
    } catch (error) {
        console.error('Error initializing calendar:', error);
        calendarEl.innerHTML = '<p style="padding: 20px;">Error al cargar el calendario</p>';
    }
}

function getStatusColor(status) {
    const colors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        completed: '#10b981',
        cancelled: '#ef4444',
        no_show: '#6b7280'
    };
    return colors[status] || '#9ca3af';
}

// =====================================================
// CITAS
// =====================================================

async function loadAppointments() {
    const tbody = document.getElementById('appointmentsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/appointments`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(apt => `
                <tr>
                    <td>
                        <strong>${apt.client_name || apt.name || 'Sin nombre'}</strong>
                        <br><small>${apt.client_phone || apt.phone || ''}</small>
                    </td>
                    <td>${apt.service || '-'}</td>
                    <td>${formatDate(apt.date || apt.appointment_date)}</td>
                    <td>${apt.time || apt.appointment_time || '-'}</td>
                    <td><span class="badge ${apt.status || 'pending'}">${apt.status || 'pending'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view" onclick="viewAppointmentById('${apt.id}')">Ver</button>
                            <button class="action-btn edit" onclick="editAppointment('${apt.id}')">Editar</button>
                            ${apt.status === 'pending' ? `<button class="action-btn whatsapp" onclick="confirmAppointment('${apt.id}')">Confirmar</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No hay citas</td></tr>';
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar</td></tr>';
    }
}

async function viewAppointmentById(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/appointments/${id}`);
        if (data.success) {
            viewAppointmentDetails(data.data);
        }
    } catch (error) {
        showToast('Error al cargar cita', 'error');
    }
}

function viewAppointmentDetails(apt) {
    const content = `
        <div style="padding: 10px;">
            <p><strong>Cliente:</strong> ${apt.client_name || apt.name || 'Sin nombre'}</p>
            <p><strong>Telefono:</strong> ${apt.client_phone || apt.phone || '-'}</p>
            <p><strong>Email:</strong> ${apt.client_email || apt.email || '-'}</p>
            <p><strong>Servicio:</strong> ${apt.service || '-'}</p>
            <p><strong>Fecha:</strong> ${formatDate(apt.date || apt.appointment_date)}</p>
            <p><strong>Hora:</strong> ${apt.time || apt.appointment_time || '-'}</p>
            <p><strong>Estado:</strong> <span class="badge ${apt.status}">${apt.status}</span></p>
            ${apt.notes ? `<p><strong>Notas:</strong> ${apt.notes}</p>` : ''}
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                ${(apt.client_phone || apt.phone) ? `<button class="btn btn-success" onclick="sendWhatsApp('${apt.client_phone || apt.phone}', 'Hola ${apt.client_name || apt.name}, te recordamos tu cita en Value Skin Studio.')">WhatsApp</button>` : ''}
                <button class="btn btn-primary" onclick="editAppointment('${apt.id}'); closeModal();">Editar</button>
            </div>
        </div>
    `;
    openModal('Detalle de Cita', content);
}

function openNewAppointmentModal(date = '') {
    const today = date || new Date().toISOString().split('T')[0];
    const servicesOptions = servicesCache.map(s => `<option value="${s.name}">${s.name} - ${formatCurrency(s.price)}</option>`).join('');

    const content = `
        <form id="newAppointmentForm" style="padding: 10px;">
            <div class="form-group">
                <label>Nombre del Cliente *</label>
                <input type="text" id="aptClientName" required placeholder="Nombre completo">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Telefono *</label>
                    <input type="tel" id="aptClientPhone" required placeholder="55 1234 5678">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="aptClientEmail" placeholder="email@ejemplo.com">
                </div>
            </div>
            <div class="form-group">
                <label>Servicio *</label>
                <select id="aptService" required>
                    <option value="">Seleccionar servicio...</option>
                    ${servicesOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha *</label>
                    <input type="date" id="aptDate" value="${today}" required>
                </div>
                <div class="form-group">
                    <label>Hora *</label>
                    <input type="time" id="aptTime" required>
                </div>
            </div>
            <div class="form-group">
                <label>Duracion</label>
                <select id="aptDuration">
                    <option value="30">30 minutos</option>
                    <option value="60" selected>1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                </select>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="aptNotes" rows="2"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Cita</button>
            </div>
        </form>
    `;
    openModal('Nueva Cita', content);

    setTimeout(() => {
        document.getElementById('newAppointmentForm')?.addEventListener('submit', createAppointment);
    }, 100);
}

async function createAppointment(e) {
    e.preventDefault();
    const data = {
        clientName: document.getElementById('aptClientName')?.value,
        clientPhone: document.getElementById('aptClientPhone')?.value,
        clientEmail: document.getElementById('aptClientEmail')?.value,
        service: document.getElementById('aptService')?.value,
        date: document.getElementById('aptDate')?.value,
        time: document.getElementById('aptTime')?.value,
        duration: parseInt(document.getElementById('aptDuration')?.value || 60),
        notes: document.getElementById('aptNotes')?.value
    };

    try {
        const result = await fetchAPI(`${API_V1}/admin/appointments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (result.success) {
            showToast('Cita creada correctamente', 'success');
            closeModal();
            loadAppointments();
            if (calendar) initCalendar();
        }
    } catch (error) {
        showToast(error.message || 'Error al crear cita', 'error');
    }
}

async function confirmAppointment(id) {
    try {
        await fetchAPI(`${API_V1}/admin/appointments/${id}/confirm`, { method: 'PATCH' });
        showToast('Cita confirmada', 'success');
        loadAppointments();
    } catch (error) {
        showToast('Error al confirmar', 'error');
    }
}

async function editAppointment(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/appointments/${id}`);
        if (!data.success) return;
        const apt = data.data;
        const servicesOptions = servicesCache.map(s =>
            `<option value="${s.name}" ${s.name === apt.service ? 'selected' : ''}>${s.name}</option>`
        ).join('');

        const content = `
            <form id="editAppointmentForm" style="padding: 10px;">
                <input type="hidden" id="editAptId" value="${apt.id}">
                <div class="form-group">
                    <label>Cliente</label>
                    <input type="text" id="editAptClientName" value="${apt.client_name || apt.name || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Telefono</label>
                        <input type="tel" id="editAptClientPhone" value="${apt.client_phone || apt.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="editAptClientEmail" value="${apt.client_email || apt.email || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>Servicio</label>
                    <select id="editAptService">${servicesOptions}</select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="editAptDate" value="${apt.date || apt.appointment_date || ''}">
                    </div>
                    <div class="form-group">
                        <label>Hora</label>
                        <input type="time" id="editAptTime" value="${apt.time || apt.appointment_time || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="editAptStatus">
                            <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                            <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmada</option>
                            <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Completada</option>
                            <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Duracion</label>
                        <select id="editAptDuration">
                            <option value="30" ${apt.duration === 30 ? 'selected' : ''}>30 min</option>
                            <option value="60" ${apt.duration === 60 || !apt.duration ? 'selected' : ''}>1 hora</option>
                            <option value="90" ${apt.duration === 90 ? 'selected' : ''}>1.5 horas</option>
                            <option value="120" ${apt.duration === 120 ? 'selected' : ''}>2 horas</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notas</label>
                    <textarea id="editAptNotes" rows="2">${apt.notes || ''}</textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;
        openModal('Editar Cita', content);
        setTimeout(() => {
            document.getElementById('editAppointmentForm')?.addEventListener('submit', updateAppointment);
        }, 100);
    } catch (error) {
        showToast('Error al cargar cita', 'error');
    }
}

async function updateAppointment(e) {
    e.preventDefault();
    const id = document.getElementById('editAptId')?.value;
    const data = {
        client_name: document.getElementById('editAptClientName')?.value,
        client_phone: document.getElementById('editAptClientPhone')?.value,
        client_email: document.getElementById('editAptClientEmail')?.value,
        service: document.getElementById('editAptService')?.value,
        date: document.getElementById('editAptDate')?.value,
        time: document.getElementById('editAptTime')?.value,
        status: document.getElementById('editAptStatus')?.value,
        duration: parseInt(document.getElementById('editAptDuration')?.value || 60),
        notes: document.getElementById('editAptNotes')?.value
    };

    try {
        await fetchAPI(`${API_V1}/admin/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        showToast('Cita actualizada', 'success');
        closeModal();
        loadAppointments();
        if (calendar) initCalendar();
    } catch (error) {
        showToast(error.message || 'Error al actualizar', 'error');
    }
}

// =====================================================
// CLIENTES
// =====================================================

async function loadClients() {
    const tbody = document.getElementById('clientsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/clients`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(c => `
                <tr>
                    <td>
                        <strong>${c.first_name || ''} ${c.last_name || ''}</strong>
                        ${c.is_vip ? '<span class="badge vip">VIP</span>' : ''}
                    </td>
                    <td>
                        ${c.email || '-'}<br>
                        <small>${c.phone || ''}</small>
                    </td>
                    <td>${c.visit_count || 0}</td>
                    <td>${formatCurrency(c.total_spent || 0)}</td>
                    <td><span class="badge ${c.active !== false ? 'active' : 'inactive'}">${c.active !== false ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view" onclick="viewClient('${c.id}')">Ver</button>
                            <button class="action-btn edit" onclick="editClient('${c.id}')">Editar</button>
                            <button class="action-btn whatsapp" onclick="openNewAppointmentForClient('${c.id}', '${(c.first_name || '') + ' ' + (c.last_name || '')}', '${c.phone || ''}', '${c.email || ''}')">+ Cita</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No hay clientes</td></tr>';
        }
    } catch (error) {
        console.error('Error loading clients:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar</td></tr>';
    }
}

async function viewClient(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/clients/${id}`);
        if (!data.success) return;
        const c = data.data;

        const content = `
            <div style="padding: 10px;">
                <h3>${c.first_name || ''} ${c.last_name || ''} ${c.is_vip ? '<span class="badge vip">VIP</span>' : ''}</h3>
                <p><strong>Email:</strong> ${c.email || '-'}</p>
                <p><strong>Telefono:</strong> ${c.phone || '-'}</p>
                <p><strong>Cumpleanos:</strong> ${c.birthdate ? formatDate(c.birthdate) : '-'}</p>
                <p><strong>Visitas:</strong> ${c.visit_count || 0}</p>
                <p><strong>Total Gastado:</strong> ${formatCurrency(c.total_spent || 0)}</p>
                ${c.notes ? `<p><strong>Notas:</strong> ${c.notes}</p>` : ''}
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    ${c.phone ? `<button class="btn btn-success" onclick="sendWhatsApp('${c.phone}', 'Hola ${c.first_name}!')">WhatsApp</button>` : ''}
                    <button class="btn btn-primary" onclick="openNewAppointmentForClient('${c.id}', '${(c.first_name || '') + ' ' + (c.last_name || '')}', '${c.phone || ''}', '${c.email || ''}'); closeModal();">+ Cita</button>
                </div>
            </div>
        `;
        openModal('Detalle de Cliente', content);
    } catch (error) {
        showToast('Error al cargar cliente', 'error');
    }
}

function openNewClientModal() {
    const content = `
        <form id="newClientForm" style="padding: 10px;">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" id="clientFirstName" required>
                </div>
                <div class="form-group">
                    <label>Apellido</label>
                    <input type="text" id="clientLastName">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="clientEmail">
                </div>
                <div class="form-group">
                    <label>Telefono *</label>
                    <input type="tel" id="clientPhone" required>
                </div>
            </div>
            <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" id="clientBirthdate">
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="clientNotes" rows="2"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Cliente</button>
            </div>
        </form>
    `;
    openModal('Nuevo Cliente', content);
    setTimeout(() => {
        document.getElementById('newClientForm')?.addEventListener('submit', createClient);
    }, 100);
}

async function createClient(e) {
    e.preventDefault();
    const data = {
        firstName: document.getElementById('clientFirstName')?.value,
        lastName: document.getElementById('clientLastName')?.value,
        email: document.getElementById('clientEmail')?.value,
        phone: document.getElementById('clientPhone')?.value,
        birthDate: document.getElementById('clientBirthdate')?.value,
        notes: document.getElementById('clientNotes')?.value
    };

    try {
        await fetchAPI(`${API_V1}/admin/clients`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Cliente creado', 'success');
        closeModal();
        loadClients();
    } catch (error) {
        showToast(error.message || 'Error al crear cliente', 'error');
    }
}

function openNewAppointmentForClient(clientId, name, phone, email) {
    const today = new Date().toISOString().split('T')[0];
    const servicesOptions = servicesCache.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

    const content = `
        <form id="newAppointmentForm" style="padding: 10px;">
            <input type="hidden" id="aptClientId" value="${clientId}">
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="aptClientName" value="${name}" readonly style="background:#f5f5f5">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Telefono</label>
                    <input type="tel" id="aptClientPhone" value="${phone}" readonly style="background:#f5f5f5">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="aptClientEmail" value="${email}" readonly style="background:#f5f5f5">
                </div>
            </div>
            <div class="form-group">
                <label>Servicio *</label>
                <select id="aptService" required>
                    <option value="">Seleccionar...</option>
                    ${servicesOptions}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha *</label>
                    <input type="date" id="aptDate" value="${today}" required>
                </div>
                <div class="form-group">
                    <label>Hora *</label>
                    <input type="time" id="aptTime" required>
                </div>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="aptNotes" rows="2"></textarea>
            </div>
            <input type="hidden" id="aptDuration" value="60">
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Cita</button>
            </div>
        </form>
    `;
    openModal('Nueva Cita para ' + name, content);
    setTimeout(() => {
        document.getElementById('newAppointmentForm')?.addEventListener('submit', createAppointment);
    }, 100);
}

// =====================================================
// CONTACTOS
// =====================================================

async function loadContacts() {
    const tbody = document.getElementById('contactsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/contacts`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(c => `
                <tr>
                    <td><strong>${c.name || '-'}</strong></td>
                    <td>
                        ${c.email || '-'}<br>
                        <small>${c.phone || ''}</small>
                    </td>
                    <td>${c.subject || '-'}</td>
                    <td>${c.message ? (c.message.substring(0, 30) + '...') : '-'}</td>
                    <td><span class="badge ${c.status || 'pending'}">${c.status || 'pending'}</span></td>
                    <td>${formatDate(c.created_at)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view" onclick="viewContact('${c.id}')">Ver</button>
                            <button class="action-btn edit" onclick="markContactAs('${c.id}', 'contacted')">Contactado</button>
                            <button class="action-btn delete" onclick="deleteContact('${c.id}')">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No hay contactos</td></tr>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
    }
}

async function viewContact(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/contacts/${id}`);
        if (!data.success) return;
        const c = data.data;

        const content = `
            <div style="padding: 10px;">
                <p><strong>Nombre:</strong> ${c.name}</p>
                <p><strong>Email:</strong> ${c.email}</p>
                <p><strong>Telefono:</strong> ${c.phone || '-'}</p>
                <p><strong>Asunto:</strong> ${c.subject || '-'}</p>
                <p><strong>Mensaje:</strong></p>
                <div style="background:#f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">${c.message || 'Sin mensaje'}</div>
                <p><strong>Estado:</strong> <span class="badge ${c.status || 'pending'}">${c.status || 'pending'}</span></p>
                <p><strong>Fecha:</strong> ${formatDate(c.created_at)}</p>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    ${c.phone ? `<button class="btn btn-success" onclick="sendWhatsApp('${c.phone}', 'Hola ${c.name}, gracias por contactarnos!')">WhatsApp</button>` : ''}
                    <button class="btn btn-primary" onclick="convertContactToClient('${c.id}', '${c.name}', '${c.email}', '${c.phone || ''}'); closeModal();">Convertir a Cliente</button>
                </div>
            </div>
        `;
        openModal('Detalle de Contacto', content);
    } catch (error) {
        showToast('Error al cargar contacto', 'error');
    }
}

async function markContactAs(id, status) {
    try {
        await fetchAPI(`${API_V1}/admin/contacts/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast('Estado actualizado', 'success');
        loadContacts();
    } catch (error) {
        showToast('Error al actualizar', 'error');
    }
}

async function deleteContact(id) {
    if (!confirm('¿Eliminar este contacto?')) return;
    try {
        await fetchAPI(`${API_V1}/admin/contacts/${id}`, { method: 'DELETE' });
        showToast('Contacto eliminado', 'success');
        loadContacts();
    } catch (error) {
        showToast('Error al eliminar', 'error');
    }
}

function convertContactToClient(contactId, name, email, phone) {
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const content = `
        <form id="convertClientForm" style="padding: 10px;">
            <input type="hidden" id="convertContactId" value="${contactId}">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" id="convertFirstName" value="${firstName}" required>
                </div>
                <div class="form-group">
                    <label>Apellido</label>
                    <input type="text" id="convertLastName" value="${lastName}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="convertEmail" value="${email}">
                </div>
                <div class="form-group">
                    <label>Telefono</label>
                    <input type="tel" id="convertPhone" value="${phone}">
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Cliente</button>
            </div>
        </form>
    `;
    openModal('Convertir a Cliente', content);
    setTimeout(() => {
        document.getElementById('convertClientForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await fetchAPI(`${API_V1}/admin/clients`, {
                    method: 'POST',
                    body: JSON.stringify({
                        first_name: document.getElementById('convertFirstName')?.value,
                        last_name: document.getElementById('convertLastName')?.value,
                        email: document.getElementById('convertEmail')?.value,
                        phone: document.getElementById('convertPhone')?.value,
                        notes: 'Convertido desde contacto'
                    })
                });
                await markContactAs(document.getElementById('convertContactId')?.value, 'resolved');
                showToast('Cliente creado', 'success');
                closeModal();
                loadClients();
            } catch (error) {
                showToast(error.message || 'Error', 'error');
            }
        });
    }, 100);
}

function openNewContactModal() {
    const content = `
        <form id="newContactForm" style="padding: 10px;">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="contactName" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="contactEmail" required>
                </div>
                <div class="form-group">
                    <label>Telefono</label>
                    <input type="tel" id="contactPhone">
                </div>
            </div>
            <div class="form-group">
                <label>Asunto</label>
                <input type="text" id="contactSubject">
            </div>
            <div class="form-group">
                <label>Mensaje</label>
                <textarea id="contactMessage" rows="4"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear</button>
            </div>
        </form>
    `;
    openModal('Nuevo Contacto', content);
    setTimeout(() => {
        document.getElementById('newContactForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await fetchAPI(`${API_BASE}/contact`, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: document.getElementById('contactName')?.value,
                        email: document.getElementById('contactEmail')?.value,
                        phone: document.getElementById('contactPhone')?.value,
                        subject: document.getElementById('contactSubject')?.value,
                        message: document.getElementById('contactMessage')?.value
                    }),
                    auth: false
                });
                showToast('Contacto creado', 'success');
                closeModal();
                loadContacts();
            } catch (error) {
                showToast(error.message || 'Error', 'error');
            }
        });
    }, 100);
}

// =====================================================
// FACTURACION
// =====================================================

async function loadInvoices() {
    const tbody = document.getElementById('invoicesBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/invoices`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(inv => `
                <tr>
                    <td><strong>${inv.invoice_number || '-'}</strong></td>
                    <td>${inv.client_name || '-'}</td>
                    <td>${formatDate(inv.created_at)}</td>
                    <td>${formatCurrency(inv.total || 0)}</td>
                    <td><span class="badge ${inv.status || 'draft'}">${inv.status || 'draft'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view" onclick="viewInvoice('${inv.id}')">Ver</button>
                            ${inv.status === 'pending' || inv.status === 'draft' ? `<button class="action-btn whatsapp" onclick="markInvoicePaid('${inv.id}')">Pagado</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No hay facturas</td></tr>';
        }
    } catch (error) {
        console.error('Error loading invoices:', error);
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar</td></tr>';
    }
}

async function viewInvoice(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/invoices/${id}`);
        if (!data.success) return;
        const inv = data.data;
        const items = inv.items || [];

        const content = `
            <div class="invoice-preview">
                <div class="invoice-header">
                    <h2>FACTURA ${inv.invoice_number || ''}</h2>
                    <p>Fecha: ${formatDate(inv.created_at)}</p>
                    <p>Estado: <span class="badge ${inv.status || 'draft'}">${inv.status || 'draft'}</span></p>
                </div>
                <p><strong>Cliente:</strong> ${inv.client_name || 'N/A'}</p>
                <table style="width:100%; margin: 20px 0;">
                    <thead><tr><th>Descripcion</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        ${items.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${formatCurrency(i.unit_price)}</td><td>${formatCurrency(i.subtotal || i.quantity * i.unit_price)}</td></tr>`).join('')}
                    </tbody>
                </table>
                <div class="invoice-total">
                    <p>Subtotal: ${formatCurrency(inv.subtotal || 0)}</p>
                    <p>IVA: ${formatCurrency(inv.tax || 0)}</p>
                    <p><strong>Total: ${formatCurrency(inv.total || 0)}</strong></p>
                </div>
            </div>
        `;
        openModal('Factura ' + (inv.invoice_number || ''), content);
    } catch (error) {
        showToast('Error al cargar factura', 'error');
    }
}

async function markInvoicePaid(id) {
    try {
        await fetchAPI(`${API_V1}/admin/invoices/${id}/paid`, { method: 'PATCH' });
        showToast('Factura marcada como pagada', 'success');
        loadInvoices();
    } catch (error) {
        showToast('Error', 'error');
    }
}

function openNewInvoiceModal() {
    const servicesOptions = servicesCache.map(s => `<option value="${s.id}" data-price="${s.price}" data-name="${s.name}">${s.name} - ${formatCurrency(s.price)}</option>`).join('');

    const content = `
        <form id="newInvoiceForm" style="padding: 10px;">
            <div class="form-group">
                <label>Cliente</label>
                <input type="text" id="invoiceClientName" placeholder="Nombre del cliente">
            </div>
            <div class="form-group">
                <label>Agregar Servicio</label>
                <select id="invoiceServiceSelect">
                    <option value="">Seleccionar...</option>
                    ${servicesOptions}
                </select>
            </div>
            <div id="invoiceItems" style="margin: 20px 0;"></div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addInvoiceItem()">+ Item Manual</button>
            <div style="margin-top: 20px; text-align: right;">
                <p>Subtotal: <span id="invSubtotal">$0.00</span></p>
                <p>IVA (16%): <span id="invTax">$0.00</span></p>
                <p><strong>Total: <span id="invTotal">$0.00</span></strong></p>
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="invoiceNotes" rows="2"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary">Crear Factura</button>
            </div>
        </form>
    `;
    openModal('Nueva Factura', content);

    setTimeout(() => {
        document.getElementById('invoiceServiceSelect')?.addEventListener('change', (e) => {
            const opt = e.target.selectedOptions[0];
            if (opt && opt.value) {
                addInvoiceItemWithData(opt.dataset.name, 1, parseFloat(opt.dataset.price));
                e.target.value = '';
            }
        });
        document.getElementById('newInvoiceForm')?.addEventListener('submit', createInvoice);
    }, 100);
}

function addInvoiceItem() {
    addInvoiceItemWithData('', 1, 0);
}

function addInvoiceItemWithData(desc, qty, price) {
    const container = document.getElementById('invoiceItems');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'invoice-item';
    div.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: center;';
    div.innerHTML = `
        <input type="text" class="item-desc" value="${desc}" placeholder="Descripcion">
        <input type="number" class="item-qty" value="${qty}" min="1" onchange="calcInvoiceTotal()">
        <input type="number" class="item-price" value="${price}" step="0.01" onchange="calcInvoiceTotal()">
        <span class="item-subtotal">${formatCurrency(qty * price)}</span>
        <button type="button" onclick="this.parentElement.remove(); calcInvoiceTotal();" style="background:#fee2e2; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">&times;</button>
    `;
    container.appendChild(div);
    calcInvoiceTotal();
}

function calcInvoiceTotal() {
    const items = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    items.forEach(item => {
        const qty = parseFloat(item.querySelector('.item-qty')?.value) || 0;
        const price = parseFloat(item.querySelector('.item-price')?.value) || 0;
        const sub = qty * price;
        const subtotalEl = item.querySelector('.item-subtotal');
        if (subtotalEl) subtotalEl.textContent = formatCurrency(sub);
        subtotal += sub;
    });
    const tax = subtotal * 0.16;
    const subtotalEl = document.getElementById('invSubtotal');
    const taxEl = document.getElementById('invTax');
    const totalEl = document.getElementById('invTotal');
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(subtotal + tax);
}

async function createInvoice(e) {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('.invoice-item').forEach(item => {
        const desc = item.querySelector('.item-desc')?.value;
        if (desc) {
            items.push({
                description: desc,
                quantity: parseInt(item.querySelector('.item-qty')?.value) || 1,
                unit_price: parseFloat(item.querySelector('.item-price')?.value) || 0
            });
        }
    });

    if (items.length === 0) {
        showToast('Agrega al menos un item', 'error');
        return;
    }

    try {
        await fetchAPI(`${API_V1}/admin/invoices`, {
            method: 'POST',
            body: JSON.stringify({
                client_name: document.getElementById('invoiceClientName')?.value,
                items: items,
                notes: document.getElementById('invoiceNotes')?.value
            })
        });
        showToast('Factura creada', 'success');
        closeModal();
        loadInvoices();
    } catch (error) {
        showToast(error.message || 'Error', 'error');
    }
}

// =====================================================
// SERVICIOS, BANNERS, PROMOCIONES
// =====================================================

async function loadServicesCache() {
    try {
        const data = await fetchAPI(`${API_V1}/services`);
        if (data.success) {
            servicesCache = data.data || [];
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

async function loadServices() {
    const tbody = document.getElementById('servicesBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/services`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(s => `
                <tr>
                    <td><strong>${s.name || '-'}</strong></td>
                    <td>${s.category || '-'}</td>
                    <td>${s.price > 0 ? formatCurrency(s.price) : 'Consultar'}</td>
                    <td>${s.duration || 60} min</td>
                    <td><span class="badge ${s.active ? 'active' : 'inactive'}">${s.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="showToast('Editar servicio: ${s.id}', 'info')">Editar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No hay servicios</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar</td></tr>';
    }
}

async function loadPromotions() {
    const tbody = document.getElementById('promotionsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/promotions`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td><strong>${p.name || p.title || '-'}</strong></td>
                    <td>${p.type || '-'}</td>
                    <td>${p.discount_type === 'percentage' ? (p.discount_value + '%') : formatCurrency(p.discount_value)}</td>
                    <td><code>${p.code || '-'}</code></td>
                    <td>${p.end_date ? formatDate(p.end_date) : 'Sin limite'}</td>
                    <td><span class="badge ${p.active ? 'active' : 'inactive'}">${p.active ? 'Activa' : 'Inactiva'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="showToast('Editar promocion', 'info')">Editar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No hay promociones</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
    }
}

async function loadBanners() {
    const tbody = document.getElementById('bannersBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/banners`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(b => `
                <tr>
                    <td>${b.image_url ? `<img src="${b.image_url}" style="width:80px; height:40px; object-fit:cover; border-radius:4px;">` : '-'}</td>
                    <td><strong>${b.title || b.name || '-'}</strong></td>
                    <td>${b.section || '-'}</td>
                    <td><span class="badge ${b.active ? 'active' : 'inactive'}">${b.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="editBanner('${b.id}')">Editar</button>
                            <button class="action-btn delete" onclick="deleteBanner('${b.id}')">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No hay banners</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
    }
}

function openNewBannerModal() {
    const content = `
        <form id="newBannerForm" style="padding: 10px;" enctype="multipart/form-data">
            <div class="form-group">
                <label>Nombre *</label>
                <input type="text" id="bannerName" required placeholder="Nombre del banner">
            </div>
            <div class="form-group">
                <label>Seccion *</label>
                <select id="bannerSection" required>
                    <option value="">Seleccionar...</option>
                    <option value="hero">Hero (Principal)</option>
                    <option value="cta">CTA</option>
                    <option value="features">Features</option>
                    <option value="promo">Promocion</option>
                </select>
            </div>
            <div class="form-group">
                <label>Titulo</label>
                <input type="text" id="bannerTitle" placeholder="Titulo visible">
            </div>
            <div class="form-group">
                <label>Subtitulo</label>
                <input type="text" id="bannerSubtitle" placeholder="Subtitulo">
            </div>
            <div class="form-group">
                <label>Imagen del Banner</label>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <button type="button" class="btn btn-sm btn-secondary" onclick="toggleImageInput('file')" id="btnImageFile">Subir Archivo</button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="toggleImageInput('url')" id="btnImageUrl">Usar URL</button>
                </div>
                <div id="imageFileInput">
                    <input type="file" id="bannerImageFile" accept="image/jpeg,image/png,image/webp" style="width:100%; padding:10px; border:2px dashed #ddd; border-radius:8px;">
                    <small style="color:#666; display:block; margin-top:5px;">Formatos: JPG, PNG, WebP. Max: 10MB</small>
                </div>
                <div id="imageUrlInput" style="display:none;">
                    <input type="url" id="bannerImageUrl" placeholder="https://ejemplo.com/imagen.jpg">
                </div>
                <div id="imagePreview" style="margin-top:10px;"></div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Texto del Boton</label>
                    <input type="text" id="bannerCtaText" placeholder="Ej: Reservar Ahora">
                </div>
                <div class="form-group">
                    <label>Link del Boton</label>
                    <input type="text" id="bannerCtaLink" placeholder="#contacto">
                </div>
            </div>
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="bannerActive" checked> Activo
                </label>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btnCreateBanner">Crear Banner</button>
            </div>
        </form>
    `;
    openModal('Nuevo Banner', content);

    setTimeout(() => {
        document.getElementById('newBannerForm')?.addEventListener('submit', createBanner);
        document.getElementById('bannerImageFile')?.addEventListener('change', previewBannerImage);
        toggleImageInput('file');
    }, 100);
}

function toggleImageInput(type) {
    const fileInput = document.getElementById('imageFileInput');
    const urlInput = document.getElementById('imageUrlInput');
    const btnFile = document.getElementById('btnImageFile');
    const btnUrl = document.getElementById('btnImageUrl');

    if (type === 'file') {
        fileInput.style.display = 'block';
        urlInput.style.display = 'none';
        btnFile.classList.add('btn-primary');
        btnFile.classList.remove('btn-secondary');
        btnUrl.classList.remove('btn-primary');
        btnUrl.classList.add('btn-secondary');
    } else {
        fileInput.style.display = 'none';
        urlInput.style.display = 'block';
        btnUrl.classList.add('btn-primary');
        btnUrl.classList.remove('btn-secondary');
        btnFile.classList.remove('btn-primary');
        btnFile.classList.add('btn-secondary');
    }
}

function previewBannerImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%; max-height:150px; border-radius:8px; margin-top:10px;">`;
        };
        reader.readAsDataURL(file);
    }
}

async function createBanner(e) {
    e.preventDefault();

    const fileInput = document.getElementById('bannerImageFile');
    const urlInput = document.getElementById('bannerImageUrl');
    const hasFile = fileInput?.files?.length > 0;
    const hasUrl = urlInput?.value?.trim();

    const btn = document.getElementById('btnCreateBanner');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creando...';
    }

    try {
        let imageUrl = '';

        // Si hay archivo, primero subirlo
        if (hasFile) {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            const uploadResponse = await fetch(`${API_V1}/admin/banners/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
                throw new Error(uploadResult.message || 'Error al subir imagen');
            }
            imageUrl = uploadResult.data.url;
        } else if (hasUrl) {
            imageUrl = urlInput.value.trim();
        }

        // Crear el banner con la URL de la imagen
        const bannerData = {
            name: document.getElementById('bannerName')?.value,
            section: document.getElementById('bannerSection')?.value,
            title: document.getElementById('bannerTitle')?.value,
            subtitle: document.getElementById('bannerSubtitle')?.value,
            imageUrl: imageUrl,
            ctaText: document.getElementById('bannerCtaText')?.value,
            ctaLink: document.getElementById('bannerCtaLink')?.value,
            active: document.getElementById('bannerActive')?.checked
        };

        const result = await fetchAPI(`${API_V1}/admin/banners`, {
            method: 'POST',
            body: JSON.stringify(bannerData)
        });

        if (result.success) {
            showToast('Banner creado correctamente', 'success');
            closeModal();
            loadBanners();
        }
    } catch (error) {
        showToast(error.message || 'Error al crear banner', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Crear Banner';
        }
    }
}

async function editBanner(id) {
    try {
        const data = await fetchAPI(`${API_V1}/admin/banners/${id}`);
        if (!data.success) return;
        const b = data.data;

        const content = `
            <form id="editBannerForm" style="padding: 10px;" enctype="multipart/form-data">
                <input type="hidden" id="editBannerId" value="${b.id}">
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" id="editBannerName" value="${b.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Seccion *</label>
                    <select id="editBannerSection" required>
                        <option value="hero" ${b.section === 'hero' ? 'selected' : ''}>Hero (Principal)</option>
                        <option value="cta" ${b.section === 'cta' ? 'selected' : ''}>CTA</option>
                        <option value="features" ${b.section === 'features' ? 'selected' : ''}>Features</option>
                        <option value="promo" ${b.section === 'promo' ? 'selected' : ''}>Promocion</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Titulo</label>
                    <input type="text" id="editBannerTitle" value="${b.title || ''}">
                </div>
                <div class="form-group">
                    <label>Subtitulo</label>
                    <input type="text" id="editBannerSubtitle" value="${b.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label>Imagen del Banner</label>
                    ${b.image_url ? `
                        <div style="margin-bottom:10px;">
                            <img src="${b.image_url}" style="width:100%; max-height:120px; object-fit:cover; border-radius:8px;">
                            <small style="color:#666; display:block; margin-top:5px;">Imagen actual</small>
                        </div>
                    ` : ''}
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="toggleEditImageInput('file')" id="btnEditImageFile">Subir Nueva</button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="toggleEditImageInput('url')" id="btnEditImageUrl">Usar URL</button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="toggleEditImageInput('keep')" id="btnEditImageKeep">Mantener Actual</button>
                    </div>
                    <div id="editImageFileInput" style="display:none;">
                        <input type="file" id="editBannerImageFile" accept="image/jpeg,image/png,image/webp" style="width:100%; padding:10px; border:2px dashed #ddd; border-radius:8px;">
                        <small style="color:#666; display:block; margin-top:5px;">Formatos: JPG, PNG, WebP. Max: 10MB</small>
                    </div>
                    <div id="editImageUrlInput" style="display:none;">
                        <input type="url" id="editBannerImageUrl" value="${b.image_url || ''}" placeholder="https://ejemplo.com/imagen.jpg">
                    </div>
                    <input type="hidden" id="editImageMode" value="keep">
                    <div id="editImagePreview" style="margin-top:10px;"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Texto del Boton</label>
                        <input type="text" id="editBannerCtaText" value="${b.cta_text || ''}">
                    </div>
                    <div class="form-group">
                        <label>Link del Boton</label>
                        <input type="text" id="editBannerCtaLink" value="${b.cta_link || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editBannerActive" ${b.active ? 'checked' : ''}> Activo
                    </label>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary" id="btnUpdateBanner">Guardar Cambios</button>
                </div>
            </form>
        `;
        openModal('Editar Banner', content);

        setTimeout(() => {
            document.getElementById('editBannerForm')?.addEventListener('submit', updateBanner);
            document.getElementById('editBannerImageFile')?.addEventListener('change', previewEditBannerImage);
            toggleEditImageInput('keep');
        }, 100);
    } catch (error) {
        showToast('Error al cargar banner', 'error');
    }
}

function toggleEditImageInput(type) {
    const fileInput = document.getElementById('editImageFileInput');
    const urlInput = document.getElementById('editImageUrlInput');
    const modeInput = document.getElementById('editImageMode');
    const btnFile = document.getElementById('btnEditImageFile');
    const btnUrl = document.getElementById('btnEditImageUrl');
    const btnKeep = document.getElementById('btnEditImageKeep');

    // Reset all buttons
    [btnFile, btnUrl, btnKeep].forEach(btn => {
        if (btn) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        }
    });

    if (modeInput) modeInput.value = type;

    if (type === 'file') {
        if (fileInput) fileInput.style.display = 'block';
        if (urlInput) urlInput.style.display = 'none';
        if (btnFile) { btnFile.classList.add('btn-primary'); btnFile.classList.remove('btn-secondary'); }
    } else if (type === 'url') {
        if (fileInput) fileInput.style.display = 'none';
        if (urlInput) urlInput.style.display = 'block';
        if (btnUrl) { btnUrl.classList.add('btn-primary'); btnUrl.classList.remove('btn-secondary'); }
    } else {
        if (fileInput) fileInput.style.display = 'none';
        if (urlInput) urlInput.style.display = 'none';
        if (btnKeep) { btnKeep.classList.add('btn-primary'); btnKeep.classList.remove('btn-secondary'); }
    }
}

function previewEditBannerImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('editImagePreview');
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            preview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%; max-height:150px; border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
    }
}

async function updateBanner(e) {
    e.preventDefault();
    const id = document.getElementById('editBannerId')?.value;
    const imageMode = document.querySelector('input[name="editImageMode"]:checked')?.value || 'keep';

    try {
        let imageUrl = document.getElementById('editBannerCurrentImage')?.value || '';

        // Si se seleccionó subir archivo
        if (imageMode === 'file') {
            const fileInput = document.getElementById('editBannerImageFile');
            if (fileInput?.files?.[0]) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);

                const uploadResponse = await fetch(`${API_V1}/admin/banners/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: formData
                });
                const uploadResult = await uploadResponse.json();

                if (!uploadResult.success) {
                    throw new Error(uploadResult.message || 'Error al subir imagen');
                }
                imageUrl = uploadResult.data.url;
            }
        } else if (imageMode === 'url') {
            imageUrl = document.getElementById('editBannerImageUrl')?.value || '';
        }
        // Si es 'keep', mantiene la URL actual

        const data = {
            name: document.getElementById('editBannerName')?.value,
            section: document.getElementById('editBannerSection')?.value,
            title: document.getElementById('editBannerTitle')?.value,
            subtitle: document.getElementById('editBannerSubtitle')?.value,
            imageUrl: imageUrl,
            ctaText: document.getElementById('editBannerCtaText')?.value,
            ctaLink: document.getElementById('editBannerCtaLink')?.value,
            active: document.getElementById('editBannerActive')?.checked
        };

        const result = await fetchAPI(`${API_V1}/admin/banners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (result.success) {
            showToast('Banner actualizado', 'success');
            closeModal();
            loadBanners();
        }
    } catch (error) {
        showToast(error.message || 'Error al actualizar', 'error');
    }
}

async function deleteBanner(id) {
    if (!confirm('¿Eliminar este banner?')) return;

    try {
        await fetchAPI(`${API_V1}/admin/banners/${id}`, { method: 'DELETE' });
        showToast('Banner eliminado', 'success');
        loadBanners();
    } catch (error) {
        showToast('Error al eliminar', 'error');
    }
}

// =====================================================
// CONFIGURACION
// =====================================================

async function loadSettings() {
    // Cargar config general
    try {
        const data = await fetchAPI(`${API_V1}/admin/config`);
        if (data.success && data.data) {
            const c = data.data;
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            setVal('configSiteName', c.site_name);
            setVal('configTagline', c.site_tagline || c.tagline);
            setVal('configDescription', c.site_description);
            setVal('configPhone', c.phone);
            setVal('configWhatsapp', c.whatsapp);
            setVal('configEmail', c.email);
            setVal('configAddress', c.address);
            setVal('configInstagram', c.instagram);
            setVal('configFacebook', c.facebook);
            setVal('configTiktok', c.tiktok);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    // Cargar availability
    loadAvailability();
}

async function loadAvailability() {
    const tbody = document.getElementById('availabilityBody');
    if (!tbody) return;

    try {
        const data = await fetchAPI(`${API_V1}/admin/availability`);
        if (data.success && data.data) {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
            tbody.innerHTML = data.data.map(d => `
                <tr>
                    <td>${d.day_name || days[d.day_of_week] || d.day_of_week}</td>
                    <td><input type="checkbox" ${d.is_available ? 'checked' : ''} onchange="updateAvailability(${d.day_of_week}, this.checked, '${d.start_time}', '${d.end_time}')"></td>
                    <td><input type="time" value="${d.start_time || '09:00'}" onchange="updateAvailability(${d.day_of_week}, ${d.is_available}, this.value, '${d.end_time}')" ${!d.is_available ? 'disabled' : ''}></td>
                    <td><input type="time" value="${d.end_time || '20:00'}" onchange="updateAvailability(${d.day_of_week}, ${d.is_available}, '${d.start_time}', this.value)" ${!d.is_available ? 'disabled' : ''}></td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading availability:', error);
    }
}

async function updateAvailability(day, isAvailable, start, end) {
    try {
        await fetchAPI(`${API_V1}/admin/availability/${day}`, {
            method: 'PUT',
            body: JSON.stringify({ is_available: isAvailable, start_time: start, end_time: end })
        });
        showToast('Horario actualizado', 'success');
        loadAvailability();
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function saveGeneralSettings() {
    const configs = [
        // Información del sitio
        { key: 'site_name', value: document.getElementById('configSiteName')?.value },
        { key: 'site_tagline', value: document.getElementById('configTagline')?.value },
        { key: 'site_description', value: document.getElementById('configDescription')?.value },
        // Colores
        { key: 'primary_color', value: document.getElementById('configPrimaryColor')?.value },
        { key: 'secondary_color', value: document.getElementById('configSecondaryColor')?.value },
        { key: 'accent_color', value: document.getElementById('configAccentColor')?.value },
        { key: 'text_color', value: document.getElementById('configTextColor')?.value },
        // Contacto
        { key: 'phone', value: document.getElementById('configPhone')?.value },
        { key: 'whatsapp', value: document.getElementById('configWhatsapp')?.value },
        { key: 'email', value: document.getElementById('configEmail')?.value },
        { key: 'address', value: document.getElementById('configAddress')?.value },
        // Redes sociales
        { key: 'instagram', value: document.getElementById('configInstagram')?.value },
        { key: 'facebook', value: document.getElementById('configFacebook')?.value },
        { key: 'tiktok', value: document.getElementById('configTiktok')?.value }
    ];

    try {
        await fetchAPI(`${API_V1}/admin/config/bulk`, {
            method: 'PUT',
            body: JSON.stringify({ configs })
        });
        showToast('Configuración guardada', 'success');
    } catch (error) {
        showToast('Error al guardar', 'error');
    }
}

// Preview de logo antes de subir
function previewLogo(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0] && preview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Subir logo a Cloudinary
async function uploadLogo(type) {
    let fileInput;
    if (type === 'logo') fileInput = document.getElementById('logoFile');
    else if (type === 'logo_white') fileInput = document.getElementById('logoWhiteFile');
    else if (type === 'favicon') fileInput = document.getElementById('faviconFile');

    if (!fileInput || !fileInput.files[0]) {
        showToast('Selecciona un archivo primero', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('type', type);

    try {
        showToast('Subiendo...', 'info');
        const res = await fetch(`${API_BASE}/v1/admin/config/upload-logo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            showToast('Logo subido correctamente', 'success');
            // Actualizar preview con URL de Cloudinary
            if (type === 'logo') document.getElementById('logoPreview').src = data.data.url;
            else if (type === 'logo_white') document.getElementById('logoWhitePreview').src = data.data.url;
            else if (type === 'favicon') document.getElementById('faviconPreview').src = data.data.url;
        } else {
            showToast(data.message || 'Error subiendo logo', 'error');
        }
    } catch (error) {
        showToast('Error de conexión', 'error');
    }
}

// Guardar configuración de negocio
async function saveBusinessSettings() {
    const configs = [
        { key: 'legal_name', value: document.getElementById('configLegalName')?.value },
        { key: 'tax_id', value: document.getElementById('configTaxId')?.value },
        { key: 'tax_rate', value: document.getElementById('configTaxRate')?.value },
        { key: 'invoice_prefix', value: document.getElementById('configInvoicePrefix')?.value },
        { key: 'currency', value: document.getElementById('configCurrency')?.value },
        { key: 'invoice_terms', value: document.getElementById('configInvoiceTerms')?.value },
        { key: 'default_duration', value: document.getElementById('configDefaultDuration')?.value },
        { key: 'buffer_time', value: document.getElementById('configBufferTime')?.value },
        { key: 'cancellation_policy', value: document.getElementById('configCancellationPolicy')?.value }
    ];

    try {
        await fetchAPI(`${API_V1}/admin/config/bulk`, {
            method: 'PUT',
            body: JSON.stringify({ configs })
        });
        showToast('Configuración de negocio guardada', 'success');
    } catch (error) {
        showToast('Error al guardar', 'error');
    }
}

// Guardar configuración de marketing
async function saveMarketingSettings() {
    const configs = [
        // Google
        { key: 'gtm_id', value: document.getElementById('configGtmId')?.value },
        { key: 'ga4_id', value: document.getElementById('configGa4Id')?.value },
        { key: 'google_ads_id', value: document.getElementById('configGoogleAdsId')?.value },
        // Meta & TikTok
        { key: 'fb_pixel_id', value: document.getElementById('configFbPixelId')?.value },
        { key: 'tiktok_pixel_id', value: document.getElementById('configTiktokPixelId')?.value },
        // Otros
        { key: 'hotjar_id', value: document.getElementById('configHotjarId')?.value },
        { key: 'head_scripts', value: document.getElementById('configHeadScripts')?.value },
        { key: 'body_scripts', value: document.getElementById('configBodyScripts')?.value }
    ];

    try {
        await fetchAPI(`${API_V1}/admin/config/bulk`, {
            method: 'PUT',
            body: JSON.stringify({ configs })
        });
        showToast('Configuración de marketing guardada', 'success');
    } catch (error) {
        showToast('Error al guardar', 'error');
    }
}

// =====================================================
// USUARIOS
// =====================================================

async function loadUsers() {
    const tbody = document.getElementById('usersBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

    try {
        const data = await fetchAPI(`${API_V1}/admin/users`);
        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(u => `
                <tr>
                    <td><strong>${u.name || u.username || '-'}</strong></td>
                    <td>${u.email || '-'}</td>
                    <td><span class="badge">${u.role || '-'}</span></td>
                    <td><span class="badge ${u.active ? 'active' : 'inactive'}">${u.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn edit" onclick="showToast('Editar usuario', 'info')">Editar</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No hay usuarios</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
    }
}

// =====================================================
// WHATSAPP BUSINESS API
// =====================================================

function sendWhatsApp(phone, message) {
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '54' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
}

// Cargar estado de WhatsApp (función principal que llama a todas las sub-funciones)
async function loadWhatsAppStatus() {
    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        // Actualizar status badge visual
        const badge = document.getElementById('whatsappStatusBadge');
        if (badge) {
            const isConfigured = data.data?.configured;
            badge.innerHTML = isConfigured
                ? '<span style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e;"></span><span style="color: #22c55e; font-weight: 500;">Conectado</span>'
                : '<span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span><span style="color: #ef4444; font-weight: 500;">No configurado</span>';
        }

        // Compatibilidad con el elemento antiguo
        const statusEl = document.getElementById('whatsappStatus');
        if (statusEl) {
            if (data.data?.configured) {
                statusEl.innerHTML = '<span style="color: #22c55e;">Configurado y activo</span>';
            } else {
                statusEl.innerHTML = '<span style="color: #f59e0b;">Pendiente de configurar</span>';
            }
        }

        // Cargar checkboxes de notificaciones
        if (data.data?.notifications) {
            const n = data.data.notifications;
            setChecked('notifyConfirmation', n.confirmation_enabled);
            setChecked('notifyReminder24h', n.reminder_24h_enabled);
            setChecked('notifyReminder1h', n.reminder_1h_enabled);
            setChecked('notifyThankYou', n.thankyou_enabled);
            setChecked('notifyCancellation', n.cancellation_enabled !== false); // default true

            // Cargar mensajes personalizados
            if (n.msg_confirmation) {
                const el = document.getElementById('msgConfirmation');
                if (el) el.value = n.msg_confirmation;
            }
            if (n.msg_reminder_24h) {
                const el = document.getElementById('msgReminder24h');
                if (el) el.value = n.msg_reminder_24h;
            }
            if (n.msg_reminder_1h) {
                const el = document.getElementById('msgReminder1h');
                if (el) el.value = n.msg_reminder_1h;
            }
            if (n.msg_thankyou) {
                const el = document.getElementById('msgThankYou');
                if (el) el.value = n.msg_thankyou;
            }
            if (n.msg_cancellation) {
                const el = document.getElementById('msgCancellation');
                if (el) el.value = n.msg_cancellation;
            }
        }

        // Cargar estadísticas y historial
        loadWhatsAppStats();
        loadMessageHistory();

    } catch (err) {
        console.error('Error loading WhatsApp status:', err);
        const badge = document.getElementById('whatsappStatusBadge');
        if (badge) {
            badge.innerHTML = '<span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span><span style="color: #f59e0b;">Error de conexión</span>';
        }
    }
}

function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
}

function getChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

// Guardar configuración de WhatsApp
async function saveWhatsAppConfig() {
    const phoneNumberId = document.getElementById('waPhoneNumberId')?.value;
    const accessToken = document.getElementById('waAccessToken')?.value;
    const businessAccountId = document.getElementById('waBusinessAccountId')?.value;

    if (!phoneNumberId || !accessToken) {
        showToast('Phone Number ID y Access Token son requeridos', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                phone_number_id: phoneNumberId,
                access_token: accessToken,
                business_account_id: businessAccountId
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Configuración de WhatsApp guardada', 'success');
            loadWhatsAppStatus();
        } else {
            showToast(data.message || 'Error guardando configuración', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    }
}

// Guardar configuración de notificaciones
async function saveNotificationSettings() {
    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/notifications`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                confirmation_enabled: getChecked('notifyConfirmation'),
                reminder_24h_enabled: getChecked('notifyReminder24h'),
                reminder_1h_enabled: getChecked('notifyReminder1h'),
                thankyou_enabled: getChecked('notifyThankYou'),
                cancellation_enabled: getChecked('notifyCancellation'),
                // Mensajes personalizados
                msg_confirmation: document.getElementById('msgConfirmation')?.value || '',
                msg_reminder_24h: document.getElementById('msgReminder24h')?.value || '',
                msg_reminder_1h: document.getElementById('msgReminder1h')?.value || '',
                msg_thankyou: document.getElementById('msgThankYou')?.value || '',
                msg_cancellation: document.getElementById('msgCancellation')?.value || ''
            })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Configuración de notificaciones guardada', 'success');
        } else {
            showToast(data.message || 'Error guardando', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    }
}

// Enviar mensaje de prueba (versión anterior con prompt)
async function testWhatsApp() {
    const phone = prompt('Ingresa el número de teléfono para la prueba (con código de país):');
    if (!phone) return;

    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ phone })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Mensaje de prueba enviado!', 'success');
        } else {
            showToast(data.message || 'Error enviando mensaje', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    }
}

// Probar conexión de WhatsApp
async function testWhatsAppConnection() {
    try {
        showToast('Verificando conexión...', 'info');
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (data.success && data.data.configured) {
            showToast('Conexión verificada correctamente', 'success');
        } else {
            showToast('WhatsApp no está configurado. Guarda las credenciales primero.', 'warning');
        }
    } catch (err) {
        showToast('Error verificando conexión', 'error');
    }
}

// Enviar mensaje de prueba desde el input
async function sendTestWhatsApp() {
    const phone = document.getElementById('waTestPhone')?.value;

    if (!phone) {
        showToast('Ingresa un número de teléfono', 'error');
        return;
    }

    try {
        showToast('Enviando mensaje...', 'info');
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ phone })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Mensaje de prueba enviado!', 'success');
            loadMessageHistory();
        } else {
            showToast(data.message || 'Error enviando mensaje', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    }
}

// Cargar historial de mensajes
async function loadMessageHistory() {
    const tbody = document.getElementById('whatsappMessagesBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/messages?limit=20`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
            tbody.innerHTML = data.data.map(msg => {
                const date = new Date(msg.created_at).toLocaleString('es-ES', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                const typeLabels = {
                    'confirmation': 'Confirmación',
                    'reminder_24h': 'Recordatorio 24h',
                    'reminder_1h': 'Recordatorio 1h',
                    'thankyou': 'Agradecimiento',
                    'cancellation': 'Cancelación',
                    'reschedule': 'Reprogramación',
                    'custom': 'Personalizado'
                };
                const statusBadge = msg.status === 'sent'
                    ? '<span class="badge confirmed">Enviado</span>'
                    : msg.status === 'delivered'
                    ? '<span class="badge completed">Entregado</span>'
                    : '<span class="badge cancelled">Fallido</span>';

                return `<tr>
                    <td>${date}</td>
                    <td>${msg.phone}</td>
                    <td>${typeLabels[msg.message_type] || msg.message_type}</td>
                    <td>${statusBadge}</td>
                </tr>`;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 30px;">No hay mensajes registrados</td></tr>';
        }
    } catch (err) {
        console.error('Error loading message history:', err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888; padding: 30px;">Error cargando historial</td></tr>';
    }
}

// Cargar estadísticas de WhatsApp
async function loadWhatsAppStats() {
    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/stats`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (data.success) {
            const sentEl = document.getElementById('statsSent');
            const failedEl = document.getElementById('statsFailed');
            if (sentEl) sentEl.textContent = data.data.sent || 0;
            if (failedEl) failedEl.textContent = data.data.failed || 0;
        }
    } catch (err) {
        console.error('Error loading WhatsApp stats:', err);
    }
}

// Actualizar el estado de WhatsApp con badge visual
async function loadWhatsAppStatusBadge() {
    const badge = document.getElementById('whatsappStatusBadge');
    if (!badge) return;

    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (data.success) {
            const isConfigured = data.data.configured;
            badge.innerHTML = isConfigured
                ? '<span style="width: 12px; height: 12px; border-radius: 50%; background: #22c55e;"></span><span style="color: #22c55e; font-weight: 500;">Conectado</span>'
                : '<span style="width: 12px; height: 12px; border-radius: 50%; background: #ef4444;"></span><span style="color: #ef4444; font-weight: 500;">No configurado</span>';

            // Cargar configuración de notificaciones
            if (data.data.notifications) {
                setChecked('notifyConfirmation', data.data.notifications.confirmation_enabled);
                setChecked('notifyReminder24h', data.data.notifications.reminder_24h_enabled);
                setChecked('notifyReminder1h', data.data.notifications.reminder_1h_enabled);
                setChecked('notifyThankYou', data.data.notifications.thankyou_enabled);
            }
        }
    } catch (err) {
        badge.innerHTML = '<span style="width: 12px; height: 12px; border-radius: 50%; background: #f59e0b;"></span><span style="color: #f59e0b;">Error de conexión</span>';
    }
}

// Enviar confirmación de cita por WhatsApp
async function sendAppointmentConfirmation(appointmentId, phone, clientName, serviceName, date, time) {
    try {
        const res = await fetch(`${API_BASE}/v1/admin/whatsapp/send-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ phone, clientName, serviceName, date, time })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Confirmación enviada por WhatsApp', 'success');
        } else {
            // Fallback a WhatsApp Web
            sendWhatsApp(phone, `¡Hola ${clientName}! Tu cita para ${serviceName} el ${date} a las ${time} ha sido confirmada. ¡Te esperamos!`);
        }
    } catch (err) {
        // Fallback a WhatsApp Web
        sendWhatsApp(phone, `¡Hola ${clientName}! Tu cita para ${serviceName} el ${date} a las ${time} ha sido confirmada. ¡Te esperamos!`);
    }
}

// =====================================================
// MODAL - IDs corregidos para HTML
// =====================================================

function openModal(title, content) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    if (!overlay || !modalTitle || !modalBody) {
        console.error('Modal elements not found');
        return;
    }

    modalTitle.textContent = title || 'Modal';
    modalBody.innerHTML = content || '';
    if (modalFooter) modalFooter.innerHTML = '';

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// =====================================================
// TABS DE CONFIGURACION
// =====================================================

document.querySelectorAll('.tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const panel = document.getElementById(`tab-${tab.dataset.tab}`);
        if (panel) panel.style.display = 'block';

        // Cargar datos específicos del tab
        if (tab.dataset.tab === 'notifications') {
            loadWhatsAppStatus();
        }
    });
});

// =====================================================
// QUICK ACTIONS - Funcion para onclick en HTML
// =====================================================

function openModalByType(type) {
    switch(type) {
        case 'newAppointment': openNewAppointmentModal(); break;
        case 'newClient': openNewClientModal(); break;
        case 'newContact': openNewContactModal(); break;
        case 'newInvoice': openNewInvoiceModal(); break;
        case 'newBanner': openNewBannerModal(); break;
        case 'newService': openNewServiceModal(); break;
        case 'newPromotion': openNewPromotionModal(); break;
        case 'newUser': openNewUserModal(); break;
    }
}

// =====================================================
// INICIALIZACION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin panel initializing...');
    checkAuth();
});

// Exportar funciones globales para onclick en HTML
window.logout = logout;
window.showSection = showSection;
// openModal desde HTML usa tipos como 'newAppointment', 'newClient', etc.
window.openModal = function(typeOrTitle, content) {
    if (content === undefined) {
        // Llamado desde HTML con tipo: openModal('newAppointment')
        openModalByType(typeOrTitle);
    } else {
        // Llamado internamente con título y contenido: openModal('Título', '<html>')
        const overlay = document.getElementById('modalOverlay');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');
        if (overlay && modalTitle && modalBody) {
            modalTitle.textContent = typeOrTitle || 'Modal';
            modalBody.innerHTML = content || '';
            if (modalFooter) modalFooter.innerHTML = '';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
};
window.closeModal = closeModal;
window.viewAppointmentById = viewAppointmentById;
window.viewAppointmentDetails = viewAppointmentDetails;
window.openNewAppointmentModal = openNewAppointmentModal;
window.editAppointment = editAppointment;
window.confirmAppointment = confirmAppointment;
window.viewClient = viewClient;
window.editClient = async function(id) { showToast('Funcion en desarrollo', 'info'); };
window.openNewAppointmentForClient = openNewAppointmentForClient;
window.openNewClientModal = openNewClientModal;
window.viewContact = viewContact;
window.markContactAs = markContactAs;
window.deleteContact = deleteContact;
window.convertContactToClient = convertContactToClient;
window.openNewContactModal = openNewContactModal;
window.viewInvoice = viewInvoice;
window.markInvoicePaid = markInvoicePaid;
window.openNewInvoiceModal = openNewInvoiceModal;
window.addInvoiceItem = addInvoiceItem;
window.addInvoiceItemWithData = addInvoiceItemWithData;
window.calcInvoiceTotal = calcInvoiceTotal;
window.saveGeneralSettings = saveGeneralSettings;
window.saveBusinessSettings = saveBusinessSettings;
window.saveMarketingSettings = saveMarketingSettings;
window.previewLogo = previewLogo;
window.uploadLogo = uploadLogo;
window.updateAvailability = updateAvailability;
window.sendWhatsApp = sendWhatsApp;
window.saveWhatsAppConfig = saveWhatsAppConfig;
window.saveNotificationSettings = saveNotificationSettings;
window.testWhatsApp = testWhatsApp;
window.testWhatsAppConnection = testWhatsAppConnection;
window.sendTestWhatsApp = sendTestWhatsApp;
window.loadMessageHistory = loadMessageHistory;
window.loadWhatsAppStats = loadWhatsAppStats;
window.loadWhatsAppStatusBadge = loadWhatsAppStatusBadge;
window.loadWhatsAppStatus = loadWhatsAppStatus;
window.showToast = showToast;
// Banner functions
window.openNewBannerModal = openNewBannerModal;
window.editBanner = editBanner;
window.deleteBanner = deleteBanner;
window.toggleImageInput = toggleImageInput;
window.previewBannerImage = previewBannerImage;
window.toggleEditImageInput = toggleEditImageInput;
window.previewEditBannerImage = previewEditBannerImage;
// Placeholder functions for services, promotions, users
window.openNewServiceModal = function() { showToast('Funcion en desarrollo', 'info'); };
window.openNewPromotionModal = function() { showToast('Funcion en desarrollo', 'info'); };
window.openNewUserModal = function() { showToast('Funcion en desarrollo', 'info'); };
