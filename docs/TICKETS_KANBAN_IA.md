# Epic: Asistente Virtual Inteligente (IA Chatbot)

A continuación se detallan los *issues* o tarjetas listos para ser copiados y pegados en tu tablero Kanban de GitHub. Cada uno tiene un alcance claro y los criterios de aceptación para que el equipo de desarrollo pueda tomarlos directamente.

---

## 🎫 Ticket 1: Configuración del Motor LLM y Base de Conocimiento (RAG)
**Título:** Configurar conexión con API de LLM y preparar contexto inicial (RAG)
**Descripción:**
Necesitamos establecer el "cerebro" inicial del asistente. El objetivo es conectar nuestra aplicación con un LLM (OpenAI o Anthropic) y enviarle un "System Prompt" robusto junto con la información base del estudio (precios, horarios, reglas).

**Tareas / Criterios de Aceptación:**
- [ ] Crear cuenta y obtener API Key (OpenAI o Anthropic).
- [ ] Configurar variables de entorno (`OPENAI_API_KEY` o similar) en el proyecto.
- [ ] Redactar un documento interno (`docs/knowledge_base.txt`) con las reglas de negocio, FAQ, tratamientos y precios de Value Skin Studio.
- [ ] Crear un servicio o utilidad en el backend (`api/services/llmService.js`) que sea capaz de enviar un mensaje al LLM con el System Prompt + Base de conocimiento y devolver la respuesta de texto.
- [ ] Escribir pruebas unitarias básicas para verificar la conexión.

---

## 🎫 Ticket 2: Endpoint del Chatbot en el Backend
**Título:** Crear API Endpoint `/api/chat` para procesamiento de mensajes
**Descripción:**
El frontend (y en el futuro WhatsApp) necesitará una ruta REST a la cual enviar los mensajes de los usuarios y recibir las respuestas de la IA.

**Tareas / Criterios de Aceptación:**
- [ ] Crear ruta POST `/api/chat`.
- [ ] Validar el payload de entrada (ej: `{ message: "Hola", sessionId: "123" }`).
- [ ] Implementar gestión temporal del historial de conversación atado al `sessionId` (puede ser en memoria o base de datos/Redis) para que la IA tenga contexto ("memoria") de lo que se habló.
- [ ] Integrar esta ruta con el `llmService` del Ticket 1.
- [ ] Devolver la respuesta generada por la IA al cliente en formato JSON.

---

## 🎫 Ticket 3: Interfaz de Usuario (UI) del Widget Web
**Título:** Implementar Widget Flotante de Chat en el Frontend
**Descripción:**
Queremos un widget en el frontend web (`index.html` / `styles.css`) donde los usuarios puedan interactuar con el asistente virtual para hacer pruebas y empezar a dar valor.

**Tareas / Criterios de Aceptación:**
- [ ] Diseñar y maquetar (HTML/CSS) un botón flotante en la esquina inferior derecha.
- [ ] Maquetar la ventana de chat emergente (área de mensajes, input de texto, botón de enviar).
- [ ] Implementar la lógica en `script.js` para enviar el mensaje del usuario mediante `fetch` al endpoint POST `/api/chat`.
- [ ] Mostrar *loaders* o indicadores de "Escribiendo..." mientras el backend responde.
- [ ] Renderizar los mensajes del usuario y de la IA utilizando estilos diferenciados (burbujas de chat).

---

## 🎫 Ticket 4: Function Calling - Consulta de Disponibilidad
**Título:** Dotar a la IA de la capacidad de consultar disponibilidad de turnos (Function Calling)
**Descripción:**
El asistente no solo debe "hablar", sino consultar la base de datos real. Cuando un usuario pida un turno, la IA debe poder invocar una función del backend para ver si hay espacio.

**Tareas / Criterios de Aceptación:**
- [ ] Definir el esquema JSON de la herramienta (`getAvailabilities(date, treatment)`) para el LLM.
- [ ] Implementar la función intermedia en el backend que conecte esta petición de la IA con la tabla de reservas o el calendario.
- [ ] Procesar la respuesta de la base de datos y devolvérsela a la IA para que la interprete y genere un mensaje natural (ej. "Tengo lugar a las 16:00 y a las 17:00. ¿Cuál prefieres?").
- [ ] Testear con prompts como: "¿Tenés lugar para facial mañana?".

---

## 🎫 Ticket 5: Function Calling - Creación y Cancelación de Reservas
**Título:** Dotar a la IA de la capacidad de agendar y cancelar turnos
**Descripción:**
Continuando con la automatización, una vez que el usuario confirma el horario, la IA debe insertar directamente la reserva en el sistema o cancelarla si se le solicita.

**Tareas / Criterios de Aceptación:**
- [ ] Definir el esquema JSON de herramientas (`bookAppointment(name, phone, date, treatment)` y `cancelAppointment(appointmentId)`).
- [ ] Conectar estas funciones a los controladores existentes de reservas en el backend.
- [ ] Validar que la IA solicite obligatoriamente los datos mínimos (nombre, teléfono) antes de ejecutar el agendamiento.
- [ ] Confirmar al usuario con un mensaje de éxito cuando la reserva se haya guardado correctamente en la BD.

---

## 🎫 Ticket 6: Piloto - Integración WhatsApp Business API (Fase 2)
**Título:** Integrar motor conversacional con la API de WhatsApp
**Descripción:**
Una vez validado el funcionamiento en la web, el canal principal será WhatsApp. Necesitamos un Webhook que reciba eventos de Meta/WhatsApp y los envíe a nuestra IA.

**Tareas / Criterios de Aceptación:**
- [ ] Configurar cuenta de desarrollador en Meta y crear App de WhatsApp Business.
- [ ] Crear endpoint GET/POST `/api/webhooks/whatsapp` para validar y recibir mensajes entrantes de WhatsApp.
- [ ] Extraer el mensaje y el número del remitente (`from`) del payload de Meta.
- [ ] Usar el número como identificador de sesión (`sessionId`) y pasar el mensaje a `/api/chat` (o al servicio interno subyacente).
- [ ] Tomar la respuesta de la IA y enviarla de vuelta mediante un request a la Graph API de Meta (WhatsApp).
