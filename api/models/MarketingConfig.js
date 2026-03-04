// Modelo de Configuración de Marketing - Supabase + Fallback en memoria
const { supabaseAdmin, isSupabaseConfigured } = require('../config/supabase');

// Configuración por defecto en memoria
let memoryMarketingConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  gtm_id: null,
  ga4_id: null,
  fb_pixel_id: null,
  tiktok_pixel_id: null,
  google_ads_id: null,
  hotjar_id: null,
  custom_head_scripts: null,
  custom_body_scripts: null,
  cookie_consent_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

let useMemoryFallback = false;

// Helper para verificar si es error de tabla no existe
const isTableNotFoundError = (error) => {
  return error && (error.code === 'PGRST205' || error.message?.includes('not find the table'));
};

class MarketingConfig {
  // Obtener configuración
  static async get() {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('marketing_config')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            console.log('[MarketingConfig] Tabla no existe, usando fallback en memoria');
            useMemoryFallback = true;
            return memoryMarketingConfig;
          }
          if (error.code !== 'PGRST116') throw error;
        }

        // Si no hay configuración, crearla
        if (!data) {
          return await this.create({});
        }

        return data;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          console.log('[MarketingConfig] Tabla no existe, usando fallback en memoria');
          useMemoryFallback = true;
          return memoryMarketingConfig;
        }
        throw err;
      }
    }

    return memoryMarketingConfig;
  }

  // Crear configuración
  static async create(configData) {
    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const { data, error } = await supabaseAdmin
          .from('marketing_config')
          .insert({
            gtm_id: configData.gtmId || configData.gtm_id || null,
            ga4_id: configData.ga4Id || configData.ga4_id || null,
            fb_pixel_id: configData.fbPixelId || configData.fb_pixel_id || null,
            tiktok_pixel_id: configData.tiktokPixelId || configData.tiktok_pixel_id || null,
            google_ads_id: configData.googleAdsId || configData.google_ads_id || null,
            hotjar_id: configData.hotjarId || configData.hotjar_id || null,
            custom_head_scripts: configData.customHeadScripts || configData.custom_head_scripts || null,
            custom_body_scripts: configData.customBodyScripts || configData.custom_body_scripts || null,
            cookie_consent_enabled: configData.cookieConsentEnabled ?? configData.cookie_consent_enabled ?? true
          })
          .select()
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.create(configData);
          }
          throw error;
        }
        return data;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.create(configData);
        }
        throw err;
      }
    }

    memoryMarketingConfig = {
      ...memoryMarketingConfig,
      ...configData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return memoryMarketingConfig;
  }

  // Actualizar configuración
  static async update(updateData) {
    const updates = {};

    if (updateData.gtmId !== undefined) updates.gtm_id = updateData.gtmId;
    if (updateData.gtm_id !== undefined) updates.gtm_id = updateData.gtm_id;
    if (updateData.ga4Id !== undefined) updates.ga4_id = updateData.ga4Id;
    if (updateData.ga4_id !== undefined) updates.ga4_id = updateData.ga4_id;
    if (updateData.fbPixelId !== undefined) updates.fb_pixel_id = updateData.fbPixelId;
    if (updateData.fb_pixel_id !== undefined) updates.fb_pixel_id = updateData.fb_pixel_id;
    if (updateData.tiktokPixelId !== undefined) updates.tiktok_pixel_id = updateData.tiktokPixelId;
    if (updateData.tiktok_pixel_id !== undefined) updates.tiktok_pixel_id = updateData.tiktok_pixel_id;
    if (updateData.googleAdsId !== undefined) updates.google_ads_id = updateData.googleAdsId;
    if (updateData.google_ads_id !== undefined) updates.google_ads_id = updateData.google_ads_id;
    if (updateData.hotjarId !== undefined) updates.hotjar_id = updateData.hotjarId;
    if (updateData.hotjar_id !== undefined) updates.hotjar_id = updateData.hotjar_id;
    if (updateData.customHeadScripts !== undefined) updates.custom_head_scripts = updateData.customHeadScripts;
    if (updateData.custom_head_scripts !== undefined) updates.custom_head_scripts = updateData.custom_head_scripts;
    if (updateData.customBodyScripts !== undefined) updates.custom_body_scripts = updateData.customBodyScripts;
    if (updateData.custom_body_scripts !== undefined) updates.custom_body_scripts = updateData.custom_body_scripts;
    if (updateData.cookieConsentEnabled !== undefined) updates.cookie_consent_enabled = updateData.cookieConsentEnabled;
    if (updateData.cookie_consent_enabled !== undefined) updates.cookie_consent_enabled = updateData.cookie_consent_enabled;

    if (isSupabaseConfigured() && !useMemoryFallback) {
      try {
        const current = await this.get();

        const { data, error } = await supabaseAdmin
          .from('marketing_config')
          .update(updates)
          .eq('id', current.id)
          .select()
          .single();

        if (error) {
          if (isTableNotFoundError(error)) {
            useMemoryFallback = true;
            return this.update(updateData);
          }
          throw error;
        }
        return data;
      } catch (err) {
        if (isTableNotFoundError(err)) {
          useMemoryFallback = true;
          return this.update(updateData);
        }
        throw err;
      }
    }

    memoryMarketingConfig = {
      ...memoryMarketingConfig,
      ...updates,
      updated_at: new Date().toISOString()
    };

    return memoryMarketingConfig;
  }

  // Obtener scripts para el head (para inyectar en frontend)
  static async getHeadScripts() {
    const config = await this.get();
    let scripts = '';

    // Google Tag Manager
    if (config.gtm_id) {
      scripts += `
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${config.gtm_id}');</script>
<!-- End Google Tag Manager -->`;
    }

    // Google Analytics 4
    if (config.ga4_id) {
      scripts += `
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.ga4_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config.ga4_id}');
</script>`;
    }

    // Facebook Pixel
    if (config.fb_pixel_id) {
      scripts += `
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.fb_pixel_id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${config.fb_pixel_id}&ev=PageView&noscript=1"/></noscript>`;
    }

    // TikTok Pixel
    if (config.tiktok_pixel_id) {
      scripts += `
<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${config.tiktok_pixel_id}');
  ttq.page();
}(window, document, 'ttq');
</script>`;
    }

    // Hotjar
    if (config.hotjar_id) {
      scripts += `
<!-- Hotjar -->
<script>
(function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${config.hotjar_id},hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>`;
    }

    // Scripts personalizados del head
    if (config.custom_head_scripts) {
      scripts += `\n<!-- Custom Head Scripts -->\n${config.custom_head_scripts}`;
    }

    return scripts;
  }

  // Obtener scripts para el body (para inyectar después del body tag)
  static async getBodyScripts() {
    const config = await this.get();
    let scripts = '';

    // GTM noscript
    if (config.gtm_id) {
      scripts += `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.gtm_id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
    }

    // Scripts personalizados del body
    if (config.custom_body_scripts) {
      scripts += `\n<!-- Custom Body Scripts -->\n${config.custom_body_scripts}`;
    }

    return scripts;
  }
}

module.exports = MarketingConfig;
