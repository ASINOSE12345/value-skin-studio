// VALUE SKIN STUDIO - SERVER (Desarrollo Local)
require('dotenv').config();
const path = require('path');
const app = require('./api/index');

const PORT = process.env.PORT || 3000;

// Servir archivos estaticos
app.use(require('express').static(path.join(__dirname)));

// Ruta para el panel de administracion
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Servir admin.js
app.get('/admin/admin.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.js'));
});

// Ruta principal - SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🌿 Value Skin Studio - Backend`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Servidor: http://localhost:${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`⚙️  Admin:    http://localhost:${PORT}/admin`);
  console.log(`🔧 API v1:   http://localhost:${PORT}/api/v1/health`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
