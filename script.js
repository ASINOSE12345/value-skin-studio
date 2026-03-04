// VALUE SKIN STUDIO - FRONTEND JAVASCRIPT

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

document.addEventListener('DOMContentLoaded', function () {

    // Header sticky y navegación
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav__link');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Toggle menú móvil
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Cerrar menú al hacer click en un link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Smooth scroll para botones con data-scroll
    document.querySelectorAll('[data-scroll]').forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-scroll');
            const target = document.getElementById(targetId);
            if (target) {
                const headerHeight = header.offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Cards clickeables
    const clickableCards = document.querySelectorAll('.card--clickable');
    clickableCards.forEach(card => {
        card.addEventListener('click', function () {
            const scrollTo = this.getAttribute('data-scroll');
            if (scrollTo) {
                const target = document.getElementById(scrollTo);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    window.scrollTo({
                        top: target.offsetTop - headerHeight,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Modal functionality
    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.getElementById('modalBody');

    // Abrir modal
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', function () {
            const modalType = this.getAttribute('data-modal');
            openModal(modalType);
        });
    });

    // Cerrar modal
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    function openModal(type) {
        let content = '';

        if (type === 'contacto' || type === 'contacto-empresa' || type === 'contacto-escuela') {
            content = getContactFormHTML(type);
        }

        modalBody.innerHTML = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Inicializar formulario del modal
        const form = document.getElementById('modalContactForm');
        if (form) {
            form.addEventListener('submit', handleModalFormSubmit);
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function getContactFormHTML(type) {
        let title = 'Contactanos';
        let defaultType = 'cliente';

        if (type === 'contacto-empresa') {
            title = 'Consulta Corporativa';
            defaultType = 'empresa';
        } else if (type === 'contacto-escuela') {
            title = 'Inscripción Escuela';
            defaultType = 'escuela';
        }

        return `
            <h2>${title}</h2>
            <form id="modalContactForm" class="contact-form">
                <div class="form-group">
                    <label for="modal-name">Nombre completo</label>
                    <input type="text" id="modal-name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="modal-email">Email</label>
                    <input type="email" id="modal-email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="modal-phone">Teléfono</label>
                    <input type="tel" id="modal-phone" name="phone" required>
                </div>
                <input type="hidden" name="type" value="${defaultType}">
                <div class="form-group">
                    <label for="modal-message">Mensaje (opcional)</label>
                    <textarea id="modal-message" name="message" rows="4"></textarea>
                </div>
                <button type="submit" class="btn btn--primary btn--full">Enviar Consulta</button>
                <div id="modalFormMessage" class="form-message" style="margin-top: 15px;"></div>
            </form>
        `;
    }

    async function handleModalFormSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const messageDiv = document.getElementById('modalFormMessage');
        const submitBtn = form.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const response = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                messageDiv.innerHTML = `
                    <div style="padding: 15px; background: #d4edda; color: #155724; border-radius: 6px;">
                        ✅ ${result.message}
                    </div>
                `;
                form.reset();

                setTimeout(() => {
                    closeModal();
                }, 2000);
            } else {
                throw new Error(result.message || 'Error al enviar');
            }
        } catch (error) {
            messageDiv.innerHTML = `
                <div style="padding: 15px; background: #f8d7da; color: #721c24; border-radius: 6px;">
                    ❌ Error al enviar el mensaje. Intente nuevamente.
                </div>
            `;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar Consulta';
        }
    }

    // Formulario de contacto principal
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            const messageDiv = document.getElementById('formMessage');
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const response = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.innerHTML = `
                        <div style="padding: 20px; background: #d4edda; color: #155724; border-radius: 8px; margin-top: 20px;">
                            ✅ ${result.message}
                        </div>
                    `;
                    contactForm.reset();

                    setTimeout(() => {
                        messageDiv.innerHTML = '';
                    }, 5000);
                } else {
                    throw new Error(result.message || 'Error al enviar');
                }
            } catch (error) {
                messageDiv.innerHTML = `
                    <div style="padding: 20px; background: #f8d7da; color: #721c24; border-radius: 8px; margin-top: 20px;">
                        ❌ Error al enviar el mensaje. Por favor intente nuevamente o contáctenos por WhatsApp.
                    </div>
                `;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Mensaje';
            }
        });
    }

    console.log('%c🌿 Value Skin Studio', 'font-size: 24px; color: #2C5F4F; font-weight: bold;');
    console.log('%cBienestar Profesional en Posadas', 'font-size: 14px; color: #8C8C88;');
});

// =====================================================
// CARGA DINÁMICA DE BANNERS
// =====================================================

async function loadHeroBanner() {
    try {
        const response = await fetch(`${API_URL}/v1/banners/section/hero`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            const banner = result.data[0]; // Primer banner activo de la sección hero

            // Actualizar imagen del hero
            const heroSection = document.querySelector('.hero');
            if (heroSection && banner.image_url) {
                heroSection.style.backgroundImage = `url('${banner.image_url}')`;
            }

            // Actualizar título si existe
            const heroTitle = document.querySelector('.hero__title');
            if (heroTitle && banner.title) {
                heroTitle.textContent = banner.title;
            }

            // Actualizar subtítulo si existe
            const heroSubtitle = document.querySelector('.hero__subtitle');
            if (heroSubtitle && banner.subtitle) {
                heroSubtitle.textContent = banner.subtitle;
            }
        }
    } catch (error) {
        console.log('Usando banner por defecto:', error.message);
    }
}

async function loadAllBanners() {
    try {
        const response = await fetch(`${API_URL}/v1/banners`);
        const result = await response.json();

        if (result.success && result.data) {
            const banners = result.data;

            // Aplicar banners según su sección
            banners.forEach(banner => {
                if (!banner.active || !banner.image_url) return;

                switch (banner.section) {
                    case 'hero':
                        const heroSection = document.querySelector('.hero');
                        if (heroSection) {
                            heroSection.style.backgroundImage = `url('${banner.image_url}')`;
                            if (banner.title) {
                                const title = document.querySelector('.hero__title');
                                if (title) title.textContent = banner.title;
                            }
                            if (banner.subtitle) {
                                const subtitle = document.querySelector('.hero__subtitle');
                                if (subtitle) subtitle.textContent = banner.subtitle;
                            }
                        }
                        break;

                    case 'cta':
                        const ctaSection = document.querySelector('.section--cta');
                        if (ctaSection) {
                            ctaSection.style.backgroundImage = `url('${banner.image_url}')`;
                            if (banner.title) {
                                const ctaTitle = document.querySelector('.cta-final__title');
                                if (ctaTitle) ctaTitle.textContent = banner.title;
                            }
                            if (banner.subtitle) {
                                const ctaText = document.querySelector('.cta-final__text');
                                if (ctaText) ctaText.textContent = banner.subtitle;
                            }
                        }
                        break;

                    case 'features':
                        // Para cards de características
                        break;

                    case 'promo':
                        // Para banners promocionales
                        break;
                }
            });
        }
    } catch (error) {
        console.log('Usando banners por defecto:', error.message);
    }
}

// Cargar todos los banners al iniciar
document.addEventListener('DOMContentLoaded', loadAllBanners);

// =====================================================
// LEAD MAGNETS (MARKETING)
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_URL}/v1/marketing/campaigns/active`);
        if (!response.ok) return; // Si no hay ruta o da error, ignorar (no romper la web)

        const result = await response.json();

        if (result.success && result.data) {
            initLeadMagnet(result.data);
        }
    } catch (e) {
        console.log('Marketing Module no disponible o sin campañas activas');
    }
});

function initLeadMagnet(campaign) {
    // Verificar si el usuario ya vió o cerró el magnet en esta sesión
    if (sessionStorage.getItem('leadMagnetSeen')) return;

    const modal = document.getElementById('leadMagnetModal');
    const modalBody = document.getElementById('leadMagnetBody');
    const overlay = document.getElementById('leadMagnetOverlay');
    const closeBtn = document.getElementById('leadMagnetClose');

    if (!modal || !modalBody) return;

    // Inyectar HTML de la campaña
    modalBody.innerHTML = `
        <h2>${campaign.title}</h2>
        <p class="subtitle--magnet">${campaign.subtitle}</p>
        
        <form class="contact-form" id="leadMagnetForm">
            <div class="form-group">
                <input type="text" name="name" placeholder="Tu Nombre" required>
            </div>
            <div class="form-group">
                <input type="email" name="email" placeholder="Tu Email" required>
            </div>
            <input type="hidden" name="campaign_id" value="${campaign.id}">
            <button type="submit" class="btn btn--primary btn--full magnet-btn">${campaign.button_text || 'Obtener Beneficio'}</button>
        </form>
        
        <div id="magnetReward" class="magnet-reward"></div>
    `;

    // Mostrar modal con retraso (ej. 3 segundos o al hacer scroll)
    setTimeout(() => {
        modal.classList.add('active');
        sessionStorage.setItem('leadMagnetSeen', 'true');
    }, 3500);

    // Cerrar modal
    const closeMagnet = () => modal.classList.remove('active');
    closeBtn.addEventListener('click', closeMagnet);
    overlay.addEventListener('click', closeMagnet);

    // Manejar el submit del Lead Magnet
    const form = document.getElementById('leadMagnetForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const btn = form.querySelector('.magnet-btn');
        const rewardDiv = document.getElementById('magnetReward');

        btn.disabled = true;
        btn.textContent = 'Procesando...';

        try {
            const res = await fetch(`${API_URL}/v1/marketing/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                form.style.display = 'none'; // ocultar form
                rewardDiv.classList.add('active');

                if (campaign.magnet_type === 'discount') {
                    rewardDiv.innerHTML = `¡Gracias ${data.name}! Tu código es:<br><br><span style="font-size:24px; color:var(--color-terracota)">${campaign.magnet_resource}</span><br><br>Saca captura o dile esto a la recepcionista.`;
                } else {
                    // ebook o pdf
                    rewardDiv.innerHTML = `¡Gracias ${data.name}! <br><a href="${campaign.magnet_resource}" target="_blank" style="color:var(--color-verde-selva); text-decoration:underline;">Click aquí para Descargar</a>`;
                }
            } else {
                alert('Hubo un error, completa todos los campos.');
                btn.disabled = false;
                btn.textContent = campaign.button_text || 'Obtener';
            }
        } catch (error) {
            console.error('Error enviando lead:', error);
            btn.disabled = false;
            btn.textContent = campaign.button_text || 'Obtener';
        }
    });
}
