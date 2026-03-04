// VALUE SKIN STUDIO - CARGADOR DE CONTENIDO DINAMICO
// Carga contenido del backend y actualiza el DOM

const DynamicContent = (() => {
  // Cache para evitar multiples requests
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Obtener del cache o hacer request
  const fetchWithCache = async (key, fetcher) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      return null;
    }
  };

  // =====================================================
  // CARGAR CONFIGURACION DEL SITIO
  // =====================================================
  const loadSiteConfig = async () => {
    const result = await fetchWithCache('config', () => ApiService.config.getPublic());
    if (!result?.success) return;

    const config = result.data;

    // Actualizar logo
    if (config.logo_url) {
      document.querySelectorAll('.logo img, .footer__logo img').forEach(img => {
        img.src = config.logo_url;
        img.alt = config.site_name || 'Value Skin Studio';
      });
    }

    // Actualizar titulo
    if (config.site_title) {
      document.title = config.site_title;
    }

    // Actualizar meta descripcion
    if (config.site_description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = config.site_description;
    }

    // Actualizar colores CSS
    if (config.primary_color || config.secondary_color) {
      const root = document.documentElement;
      if (config.primary_color) root.style.setProperty('--color-gold', config.primary_color);
      if (config.secondary_color) root.style.setProperty('--color-dark', config.secondary_color);
      if (config.accent_color) root.style.setProperty('--color-white', config.accent_color);
    }

    return config;
  };

  // =====================================================
  // CARGAR INFORMACION DE CONTACTO
  // =====================================================
  const loadContactInfo = async () => {
    const result = await fetchWithCache('contact', () => ApiService.config.getContact());
    if (!result?.success) return;

    const contact = result.data;

    // Actualizar telefono
    if (contact.phone) {
      document.querySelectorAll('[data-contact="phone"]').forEach(el => {
        el.textContent = contact.phone;
        if (el.tagName === 'A') el.href = `tel:${contact.phone.replace(/\D/g, '')}`;
      });
    }

    // Actualizar email
    if (contact.email) {
      document.querySelectorAll('[data-contact="email"]').forEach(el => {
        el.textContent = contact.email;
        if (el.tagName === 'A') el.href = `mailto:${contact.email}`;
      });
    }

    // Actualizar direccion
    if (contact.address) {
      document.querySelectorAll('[data-contact="address"]').forEach(el => {
        el.textContent = contact.address;
      });
    }

    // Actualizar WhatsApp
    if (contact.whatsapp) {
      document.querySelectorAll('[data-contact="whatsapp"], .whatsapp-btn').forEach(el => {
        const number = contact.whatsapp.replace(/\D/g, '');
        if (el.tagName === 'A') {
          el.href = `https://wa.me/${number}`;
        }
      });
    }

    return contact;
  };

  // =====================================================
  // CARGAR REDES SOCIALES
  // =====================================================
  const loadSocialLinks = async () => {
    const result = await fetchWithCache('social', () => ApiService.config.getSocial());
    if (!result?.success) return;

    const social = result.data;

    // Actualizar Instagram
    if (social.instagram) {
      document.querySelectorAll('[data-social="instagram"]').forEach(el => {
        el.href = social.instagram;
        el.style.display = '';
      });
    }

    // Actualizar Facebook
    if (social.facebook) {
      document.querySelectorAll('[data-social="facebook"]').forEach(el => {
        el.href = social.facebook;
        el.style.display = '';
      });
    }

    // Actualizar TikTok
    if (social.tiktok) {
      document.querySelectorAll('[data-social="tiktok"]').forEach(el => {
        el.href = social.tiktok;
        el.style.display = '';
      });
    }

    return social;
  };

  // =====================================================
  // CARGAR BANNER HERO
  // =====================================================
  const loadHeroBanner = async () => {
    const result = await fetchWithCache('hero', () => ApiService.banners.getHero());
    if (!result?.success || !result.data) return;

    const banner = result.data;
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    // Actualizar imagen de fondo
    if (banner.image_url) {
      heroSection.style.backgroundImage = `url('${banner.image_url}')`;
    }

    // Actualizar titulo
    if (banner.title) {
      const titleEl = heroSection.querySelector('.hero__title, h1');
      if (titleEl) titleEl.textContent = banner.title;
    }

    // Actualizar subtitulo
    if (banner.subtitle) {
      const subtitleEl = heroSection.querySelector('.hero__subtitle, .subtitle');
      if (subtitleEl) subtitleEl.textContent = banner.subtitle;
    }

    // Actualizar descripcion
    if (banner.description) {
      const descEl = heroSection.querySelector('.hero__description, .description');
      if (descEl) descEl.textContent = banner.description;
    }

    // Actualizar CTA principal
    if (banner.cta_text) {
      const ctaEl = heroSection.querySelector('.hero__cta .btn--primary, [data-cta="primary"]');
      if (ctaEl) {
        ctaEl.textContent = banner.cta_text;
        if (banner.cta_link) ctaEl.href = banner.cta_link;
      }
    }

    // Actualizar CTA secundario
    if (banner.cta_secondary_text) {
      const ctaSecEl = heroSection.querySelector('.hero__cta .btn--outline, [data-cta="secondary"]');
      if (ctaSecEl) {
        ctaSecEl.textContent = banner.cta_secondary_text;
        if (banner.cta_secondary_link) ctaSecEl.href = banner.cta_secondary_link;
      }
    }

    // Actualizar overlay
    if (banner.overlay_color && banner.overlay_opacity) {
      const overlay = heroSection.querySelector('.hero__overlay');
      if (overlay) {
        overlay.style.backgroundColor = banner.overlay_color;
        overlay.style.opacity = banner.overlay_opacity;
      }
    }

    return banner;
  };

  // =====================================================
  // CARGAR SERVICIOS
  // =====================================================
  const loadServices = async (containerId = 'services-container', category = null) => {
    const result = category
      ? await ApiService.services.getByCategory(category)
      : await ApiService.services.getFeatured();

    if (!result?.success) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const services = result.data;
    if (!services.length) return;

    container.innerHTML = services.map(service => `
      <div class="card card--service" data-service-id="${service.id}">
        ${service.image_url ? `
          <div class="card__image">
            <img src="${service.image_url}" alt="${service.name}" loading="lazy">
          </div>
        ` : ''}
        <div class="card__content">
          <h3 class="card__title">${service.name}</h3>
          <p class="card__description">${service.short_description || service.description}</p>
          ${service.price > 0 ? `
            <div class="card__price">$${service.price.toLocaleString('es-MX')}</div>
          ` : ''}
          ${service.duration ? `
            <div class="card__duration">${service.duration} min</div>
          ` : ''}
          <a href="#contacto" class="btn btn--primary btn--sm" data-modal="contacto">
            Reservar
          </a>
        </div>
      </div>
    `).join('');

    return services;
  };

  // =====================================================
  // CARGAR PROMOCIONES
  // =====================================================
  const loadPromotions = async (containerId = 'promotions-container') => {
    const result = await fetchWithCache('promotions', () => ApiService.promotions.getHome());
    if (!result?.success) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const promotions = result.data;
    if (!promotions.length) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = promotions.map(promo => `
      <div class="promo-card" data-promo-id="${promo.id}">
        ${promo.banner_image ? `
          <img src="${promo.banner_image}" alt="${promo.title}" class="promo-card__image">
        ` : ''}
        <div class="promo-card__content">
          <h3 class="promo-card__title">${promo.title}</h3>
          ${promo.description ? `<p class="promo-card__desc">${promo.description}</p>` : ''}
          <div class="promo-card__discount">
            ${promo.discount_type === 'percentage'
              ? `${promo.discount_value}% de descuento`
              : `$${promo.discount_value} de descuento`}
          </div>
          ${promo.code ? `
            <div class="promo-card__code">Codigo: <strong>${promo.code}</strong></div>
          ` : ''}
          ${promo.end_date ? `
            <div class="promo-card__expiry">
              Valido hasta: ${new Date(promo.end_date).toLocaleDateString('es-MX')}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    container.style.display = '';
    return promotions;
  };

  // =====================================================
  // CARGAR CONTENIDO DINAMICO POR SECCION
  // =====================================================
  const loadSectionContent = async (section) => {
    const result = await fetchWithCache(`content-${section}`, () =>
      ApiService.content.getFormatted(section)
    );
    if (!result?.success) return;

    const content = result.data;

    // Actualizar elementos con data-content
    Object.entries(content).forEach(([key, value]) => {
      document.querySelectorAll(`[data-content="${section}.${key}"]`).forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = value;
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = value;
        } else {
          el.innerHTML = value;
        }
      });
    });

    return content;
  };

  // =====================================================
  // CARGAR HORARIOS
  // =====================================================
  const loadSchedule = async () => {
    const result = await fetchWithCache('schedule', () => ApiService.config.getSchedule());
    if (!result?.success) return;

    const schedule = result.data.schedule;
    if (!schedule) return;

    const scheduleData = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;

    const container = document.getElementById('schedule-container');
    if (container) {
      container.innerHTML = Object.entries(scheduleData).map(([day, hours]) => `
        <div class="schedule__item">
          <span class="schedule__day">${day.charAt(0).toUpperCase() + day.slice(1)}</span>
          <span class="schedule__hours">${hours}</span>
        </div>
      `).join('');
    }

    return scheduleData;
  };

  // =====================================================
  // INICIALIZACION
  // =====================================================
  const init = async () => {
    // Verificar que ApiService este disponible
    if (typeof ApiService === 'undefined') {
      console.error('ApiService no esta cargado');
      return;
    }

    console.log('Cargando contenido dinamico...');

    // Cargar todo en paralelo
    const results = await Promise.allSettled([
      loadSiteConfig(),
      loadContactInfo(),
      loadSocialLinks(),
      loadHeroBanner(),
      loadServices(),
      loadPromotions(),
      loadSchedule()
    ]);

    console.log('Contenido dinamico cargado');

    return results;
  };

  // API publica
  return {
    init,
    loadSiteConfig,
    loadContactInfo,
    loadSocialLinks,
    loadHeroBanner,
    loadServices,
    loadPromotions,
    loadSectionContent,
    loadSchedule,
    clearCache: () => cache.clear()
  };
})();

// Auto-inicializar cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
  // Pequeno delay para asegurar que ApiService este cargado
  setTimeout(() => {
    DynamicContent.init();
  }, 100);
});

// Exportar globalmente
window.DynamicContent = DynamicContent;
