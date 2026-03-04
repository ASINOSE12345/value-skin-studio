// Seeders para datos iniciales
require('dotenv').config();

const User = require('../models/User');
const SiteConfig = require('../models/SiteConfig');
const Banner = require('../models/Banner');
const Service = require('../models/Service');
const Content = require('../models/Content');
const { isSupabaseConfigured } = require('../config/supabase');

// Datos iniciales de configuracion
const defaultConfig = {
  // General
  site_name: 'Value Skin Studio',
  site_title: 'Value Skin Studio | Tratamientos de Belleza Premium',
  site_description: 'Centro de estetica premium con tratamientos faciales, corporales y programas especializados.',

  // Logo
  logo_url: '/images/logo.png',

  // Contacto
  phone: '(55) 1234-5678',
  email: 'contacto@valueskinstudio.com',
  whatsapp: '5512345678',
  address: 'Av. Principal 123, Col. Centro, CDMX',

  // Redes sociales
  instagram: 'https://instagram.com/valueskinstudio',
  facebook: 'https://facebook.com/valueskinstudio',
  tiktok: '',
  youtube: '',

  // Colores
  primary_color: '#d4af37',
  secondary_color: '#1a1a2e',
  accent_color: '#ffffff',
  background_color: '#0a0a0f',
  text_color: '#ffffff',

  // Horarios
  schedule: JSON.stringify({
    lunes: '9:00 - 19:00',
    martes: '9:00 - 19:00',
    miercoles: '9:00 - 19:00',
    jueves: '9:00 - 19:00',
    viernes: '9:00 - 19:00',
    sabado: '10:00 - 15:00',
    domingo: 'Cerrado'
  })
};

// Usuario admin inicial
const defaultAdmin = {
  username: 'admin',
  email: 'admin@valueskinstudio.com',
  password: 'admin123456',
  first_name: 'Administrador',
  last_name: 'Sistema',
  role: 'superadmin'
};

// Banner hero inicial
const defaultBanner = {
  title: 'Descubre tu mejor version',
  subtitle: 'Tratamientos de belleza premium',
  description: 'Experimenta tratamientos de vanguardia en un ambiente de lujo y relajacion.',
  section: 'hero',
  imageUrl: '/images/hero-bg.jpg',
  ctaText: 'Reservar Cita',
  ctaLink: '#contacto',
  ctaSecondaryText: 'Ver Servicios',
  ctaSecondaryLink: '#servicios',
  overlayColor: '#000000',
  overlayOpacity: 0.5,
  textColor: '#ffffff',
  active: true
};

// Servicios iniciales
const defaultServices = [
  {
    name: 'Tratamiento Facial Hidratante',
    description: 'Tratamiento profundo de hidratacion facial que restaura la luminosidad natural de tu piel.',
    shortDescription: 'Hidratacion profunda para una piel radiante',
    category: 'para-ti',
    price: 1200,
    duration: 60,
    imageUrl: '/images/service-facial.jpg',
    features: ['Limpieza profunda', 'Exfoliacion suave', 'Mascarilla hidratante', 'Serum personalizado'],
    featured: true,
    active: true
  },
  {
    name: 'Masaje Relajante',
    description: 'Masaje corporal completo que alivia el estres y la tension muscular.',
    shortDescription: 'Relajacion total para cuerpo y mente',
    category: 'para-ti',
    price: 900,
    duration: 50,
    imageUrl: '/images/service-masaje.jpg',
    features: ['Aromaterapia incluida', 'Aceites esenciales', 'Ambiente relajante'],
    featured: true,
    active: true
  },
  {
    name: 'Programa Empresarial',
    description: 'Servicios de bienestar personalizados para el ambito corporativo.',
    shortDescription: 'Bienestar para tu equipo de trabajo',
    category: 'empresas',
    price: 0,
    duration: 0,
    imageUrl: '/images/service-empresas.jpg',
    features: ['Programas a medida', 'Eventos corporativos', 'Descuentos grupales'],
    featured: false,
    active: true
  },
  {
    name: 'Spa Day para Hoteles',
    description: 'Experiencias de spa completas para huespedes de hoteles asociados.',
    shortDescription: 'Experiencia spa para huespedes',
    category: 'hoteles',
    price: 0,
    duration: 0,
    imageUrl: '/images/service-hoteles.jpg',
    features: ['Servicios in-room', 'Paquetes especiales', 'Personal capacitado'],
    featured: false,
    active: true
  },
  {
    name: 'Cursos de Estetica',
    description: 'Formacion profesional en tecnicas de estetica y cuidado personal.',
    shortDescription: 'Aprende de los expertos',
    category: 'escuela',
    price: 5000,
    duration: 0,
    imageUrl: '/images/service-escuela.jpg',
    features: ['Certificacion oficial', 'Practicas incluidas', 'Material didactico'],
    featured: false,
    active: true
  }
];

// Contenido inicial
const defaultContent = {
  hero: {
    titulo: { value: 'Descubre tu mejor version', type: 'text' },
    subtitulo: { value: 'Tratamientos de belleza premium', type: 'text' },
    descripcion: { value: 'Experimenta tratamientos de vanguardia', type: 'text' }
  },
  about: {
    titulo: { value: 'Sobre Nosotros', type: 'text' },
    descripcion: { value: 'Value Skin Studio es un centro de estetica premium dedicado a realzar tu belleza natural.', type: 'html' }
  },
  contact: {
    titulo: { value: 'Contactanos', type: 'text' },
    descripcion: { value: 'Estamos aqui para ayudarte. Envianos un mensaje.', type: 'text' }
  }
};

// Funcion principal de seed
const seed = async () => {
  console.log('='.repeat(50));
  console.log('Iniciando seeders...');
  console.log('Supabase configurado:', isSupabaseConfigured());
  console.log('='.repeat(50));

  try {
    // 1. Crear usuario admin
    console.log('\n1. Creando usuario admin...');
    const existingAdmin = await User.getByEmail(defaultAdmin.email);
    if (!existingAdmin) {
      await User.create(defaultAdmin);
      console.log('   Usuario admin creado: admin@valueskinstudio.com');
    } else {
      console.log('   Usuario admin ya existe');
    }

    // 2. Crear configuracion inicial
    console.log('\n2. Creando configuracion inicial...');
    for (const [key, value] of Object.entries(defaultConfig)) {
      const existing = await SiteConfig.get(key);
      if (!existing) {
        await SiteConfig.set(key, value);
        console.log(`   Configuracion '${key}' creada`);
      }
    }
    console.log('   Configuracion completada');

    // 3. Crear banner hero
    console.log('\n3. Creando banner hero...');
    const banners = await Banner.getBySection('hero');
    if (banners.length === 0) {
      await Banner.create(defaultBanner);
      console.log('   Banner hero creado');
    } else {
      console.log('   Banner hero ya existe');
    }

    // 4. Crear servicios
    console.log('\n4. Creando servicios...');
    for (const serviceData of defaultServices) {
      const existing = await Service.getBySlug(serviceData.name.toLowerCase().replace(/\s+/g, '-'));
      if (!existing) {
        await Service.create(serviceData);
        console.log(`   Servicio '${serviceData.name}' creado`);
      }
    }
    console.log('   Servicios completados');

    // 5. Crear contenido
    console.log('\n5. Creando contenido dinamico...');
    for (const [section, items] of Object.entries(defaultContent)) {
      for (const [key, config] of Object.entries(items)) {
        const existing = await Content.get(section, key);
        if (!existing) {
          await Content.create({
            section,
            key,
            value: config.value,
            type: config.type
          });
          console.log(`   Contenido '${section}.${key}' creado`);
        }
      }
    }
    console.log('   Contenido completado');

    console.log('\n' + '='.repeat(50));
    console.log('Seeders completados exitosamente!');
    console.log('='.repeat(50));
    console.log('\nCredenciales de admin:');
    console.log('  Email: admin@valueskinstudio.com');
    console.log('  Password: admin123456');
    console.log('\nIMPORTANTE: Cambia la password despues del primer login!');

  } catch (error) {
    console.error('\nError en seeders:', error);
    process.exit(1);
  }
};

// Funcion para limpiar datos (usar con cuidado)
const clean = async () => {
  console.log('Limpiando datos...');
  // Implementar si es necesario
  console.log('Limpieza completada');
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'clean') {
    clean().then(() => process.exit(0));
  } else {
    seed().then(() => process.exit(0));
  }
}

module.exports = { seed, clean };
