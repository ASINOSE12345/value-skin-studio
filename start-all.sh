#!/bin/bash

# ============================================================
# 💻 PROPIEDAD INTELECTUAL
# Este código es propiedad de JB Coding IOT
# https://jbcodingiot.com
# Todos los derechos reservados © 2025
# ============================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Banner
clear
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${CYAN}${BOLD}FM Logistics - Sistema de Gestión Integral${NC}               ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}💻 PROPIEDAD INTELECTUAL${NC}                                   ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}Este código es propiedad de JB Coding IOT${NC}                 ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}https://jbcodingiot.com${NC}                                    ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}Todos los derechos reservados © 2025${NC}                      ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar si un puerto está en uso
check_port() {
    port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Puerto en uso
    else
        return 1  # Puerto libre
    fi
}

# Función para matar procesos en un puerto específico
kill_port() {
    port=$1
    echo -e "${YELLOW}  → Limpiando puerto $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Directorio base del proyecto
PROJECT_DIR="/Users/nicominetti/Documents/nam-business/nam-agents/projects/fm-logistics"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Verificar que los directorios existan
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Error: No se encontraron los directorios del proyecto${NC}"
    exit 1
fi

# Paso 1: Limpiar puertos
echo -e "${CYAN}${BOLD}[1/4] Limpiando puertos...${NC}"
if check_port 5001; then
    kill_port 5001
fi
if check_port 5173; then
    kill_port 5173
fi
if check_port 5555; then
    kill_port 5555
fi
echo -e "${GREEN}  ✓ Puertos limpiados${NC}"
echo ""

# Paso 2: Iniciar Backend
echo -e "${CYAN}${BOLD}[2/4] Iniciando Backend (Puerto 5001)...${NC}"
cd "$BACKEND_DIR"

# Verificar que package.json exista
if [ ! -f "package.json" ]; then
    echo -e "${RED}  ✗ Error: package.json no encontrado en $BACKEND_DIR${NC}"
    exit 1
fi

# Iniciar backend en segundo plano
echo -e "${BLUE}  → Ejecutando: npm start${NC}"
npm start > backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo -e "${YELLOW}  → Esperando que el backend esté listo...${NC}"
for i in {1..30}; do
    if check_port 5001; then
        echo -e "${GREEN}  ✓ Backend iniciado correctamente${NC}"
        echo -e "${GREEN}  ✓ URL: http://localhost:5001${NC}"
        echo -e "${GREEN}  ✓ PID: $BACKEND_PID${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ Timeout: El backend no respondió${NC}"
        echo -e "${YELLOW}  → Revisa el archivo backend.log para más detalles${NC}"
    fi
done
echo ""

# Paso 3: Iniciar Prisma Studio (opcional)
echo -e "${CYAN}${BOLD}[3/4] Iniciando Prisma Studio (Puerto 5555)...${NC}"
cd "$BACKEND_DIR"
echo -e "${BLUE}  → Ejecutando: npx prisma studio${NC}"
npx prisma studio --port 5555 > prisma-studio.log 2>&1 &
PRISMA_PID=$!

# Esperar a que Prisma Studio esté listo
echo -e "${YELLOW}  → Esperando que Prisma Studio esté listo...${NC}"
for i in {1..20}; do
    if check_port 5555; then
        echo -e "${GREEN}  ✓ Prisma Studio iniciado correctamente${NC}"
        echo -e "${GREEN}  ✓ URL: http://localhost:5555${NC}"
        echo -e "${GREEN}  ✓ PID: $PRISMA_PID${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}  ⊙ Prisma Studio no se inició (opcional)${NC}"
    fi
done
echo ""

# Paso 4: Iniciar Frontend
echo -e "${CYAN}${BOLD}[4/4] Iniciando Frontend (Puerto 5173)...${NC}"
cd "$FRONTEND_DIR"

# Verificar que package.json exista
if [ ! -f "package.json" ]; then
    echo -e "${RED}  ✗ Error: package.json no encontrado en $FRONTEND_DIR${NC}"
    exit 1
fi

# Iniciar frontend en segundo plano
echo -e "${BLUE}  → Ejecutando: npm run dev${NC}"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Esperar a que el frontend esté listo
echo -e "${YELLOW}  → Esperando que el frontend esté listo...${NC}"
for i in {1..30}; do
    if check_port 5173; then
        echo -e "${GREEN}  ✓ Frontend iniciado correctamente${NC}"
        echo -e "${GREEN}  ✓ URL: http://localhost:5173${NC}"
        echo -e "${GREEN}  ✓ PID: $FRONTEND_PID${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}  ✗ Timeout: El frontend no respondió${NC}"
        echo -e "${YELLOW}  → Revisa el archivo frontend.log para más detalles${NC}"
    fi
done
echo ""

# Resumen
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${GREEN}${BOLD}✅ SISTEMA INICIADO CORRECTAMENTE${NC}                         ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${CYAN}📱 Frontend:${NC}      ${GREEN}http://localhost:5173${NC}                  ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${CYAN}⚙️  Backend:${NC}       ${GREEN}http://localhost:5001${NC}                  ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${CYAN}🗄️  Prisma Studio:${NC} ${GREEN}http://localhost:5555${NC}                  ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}PIDs:${NC}                                                      ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}Backend:${NC}  $BACKEND_PID                                             ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${YELLOW}Frontend:${NC} $FRONTEND_PID                                             ${MAGENTA}║${NC}"
if [ ! -z "$PRISMA_PID" ]; then
echo -e "${MAGENTA}║${NC}   ${YELLOW}Prisma:${NC}   $PRISMA_PID                                             ${MAGENTA}║${NC}"
fi
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}   ${RED}Para detener todos los servicios, presiona Ctrl+C${NC}        ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}                                                                ${MAGENTA}║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}${BOLD}Logs en tiempo real:${NC}"
echo -e "${YELLOW}  Backend:  tail -f $BACKEND_DIR/backend.log${NC}"
echo -e "${YELLOW}  Frontend: tail -f $FRONTEND_DIR/frontend.log${NC}"
echo ""

# Guardar PIDs en un archivo para poder detenerlos después
echo "$BACKEND_PID" > "$PROJECT_DIR/.pids"
echo "$FRONTEND_PID" >> "$PROJECT_DIR/.pids"
if [ ! -z "$PRISMA_PID" ]; then
    echo "$PRISMA_PID" >> "$PROJECT_DIR/.pids"
fi

# Mantener el script corriendo y capturar Ctrl+C
cleanup() {
    echo ""
    echo -e "${YELLOW}${BOLD}Deteniendo servicios...${NC}"

    if [ -f "$PROJECT_DIR/.pids" ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}  → Deteniendo proceso $pid...${NC}"
                kill $pid 2>/dev/null
            fi
        done < "$PROJECT_DIR/.pids"
        rm "$PROJECT_DIR/.pids"
    fi

    echo -e "${GREEN}✓ Todos los servicios han sido detenidos${NC}"
    echo ""
    exit 0
}

trap cleanup INT TERM

# Esperar indefinidamente
echo -e "${CYAN}Presiona Ctrl+C para detener todos los servicios...${NC}"
wait
