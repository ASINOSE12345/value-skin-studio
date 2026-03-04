# Epic: E-commerce & Integración con Instagram Shopping

A continuación se detallan los *issues* para construir el módulo de tienda online dentro del SaaS, permitiendo la venta de productos físicos (cremas, rutinas) y su sincronización con canales de venta externos como Instagram.

---

## 🎫 Ticket 7: Modelo de Datos y Backend para Productos (E-commerce Core)
**Título:** Crear modelo y endpoints para gestión de Productos de E-commerce
**Descripción:**
Necesitamos expandir nuestra base de datos para soportar un inventario de productos físicos vendibles, no solo servicios.

**Tareas / Criterios de Aceptación:**
- [ ] Crear el modelo `Product.js` (Nombre, descripción, precio, stock, imágenes, SKU).
- [ ] Crear el modelo `Order.js` (Carrito, estado de orden, total, datos de envío/retiro).
- [ ] Crear endpoints de administración (`/api/admin/products`) para el CRUD de productos.
- [ ] Listar productos en el panel de administrador para controlar stock y precios.

---

## 🎫 Ticket 8: Marketplace en el Frontend Web
**Título:** Implementar Tienda (Marketplace) en el Frontend orientado al cliente
**Descripción:**
Las clientas deben poder ver un catálogo de productos dentro de la misma web del centro de estética y agregarlos a un carrito.

**Tareas / Criterios de Aceptación:**
- [ ] Diseñar y maquetar la sección `/tienda` en el frontend (`index.html` o nueva vista).
- [ ] Integrar el catálogo consumiendo el endpoint público de productos.
- [ ] Implementar la lógica del "Carrito de Compras" (Local Storage o Estado).
- [ ] Implementar el "Checkout" o finalización de compra (inicialmente capturando los datos y enviándolos por WhatsApp o email al local para coordinar pago/retiro).

---

## 🎫 Ticket 9: Integración de Pasarela de Pagos (MercadoPago / Stripe)
**Título:** Integrar pasarela de cobros para automatizar ventas de la tienda
**Descripción:**
Para que la tienda opere en automático, el checkout debe procesar el pago directamente en la web.

**Tareas / Criterios de Aceptación:**
- [ ] Elegir pasarela (MercadoPago para Latam o Stripe).
- [ ] Configurar SDK en el backend y crear endpoint para generar "Preferencias de Pago" o "Checkout Sessions".
- [ ] Conectar el frontend para redirigir al usuario a pagar al completar el carrito.
- [ ] Implementar Webhook de la pasarela para confirmar automáticamente el estado de la `Order` a "Pagada" en nuestra base de datos.
- [ ] Restar el stock del producto automáticamente.

---

## 🎫 Ticket 10: Sincronización con Instagram Shopping (Facebook Commerce Manager)
**Título:** Generar Data Feed XML para sincronizar catálogo con Instagram/Meta
**Descripción:**
Queremos que los productos cargados en el SaaS se reflejen automáticamente en el catálogo de Instagram, permitiendo a los clientes "tocar y comprar" desde las fotos.

**Tareas / Criterios de Aceptación:**
- [ ] Crear un endpoint en formato XML (`/api/products/feed.xml`) siguiendo el estándar de Google Merchant / Meta Commerce.
- [ ] Conectar este Feed dinámico en el "Commerce Manager" de Meta (Facebook/Instagram).
- [ ] Validar que los cambios de precio o stock hechos en el panel de administración se actualicen en Instagram en el siguiente rastreo de Meta.
- [ ] Asegurar que el link de compra en Instagram redirija exactamente al Checkout del frontend con el producto pre-cargado.
