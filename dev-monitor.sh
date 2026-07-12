#!/bin/bash

# CPACE Learning Portal - Development Monitor
# Live development tracking script

echo "🚀 CPACE Learning Portal - Development Monitor"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo -e "${GREEN}✅ $1 is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not running${NC}"
        return 1
    fi
}

# Function to show port status
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ $service on port $port is active${NC}"
        return 0
    else
        echo -e "${RED}❌ $service on port $port is not active${NC}"
        return 1
    fi
}

# Function to show development URLs
show_urls() {
    echo -e "${BLUE}📱 Development URLs:${NC}"
    echo -e "   🌐 Landing Page: ${YELLOW}http://localhost:3000${NC}"
    echo -e "   🔐 Login:        ${YELLOW}http://localhost:3000/login${NC}"
    echo -e "   📝 Register:     ${YELLOW}http://localhost:3000/register${NC}"
    echo -e "   📊 Dashboard:    ${YELLOW}http://localhost:3000/dashboard${NC}"
    echo -e "   🗄️ Database:     ${YELLOW}http://localhost:5555${NC} (Prisma Studio)"
    echo ""
}

# Function to show system info
show_system_info() {
    echo -e "${BLUE}📊 System Information:${NC}"
    echo -e "   Node.js: $(node --version)"
    echo -e "   npm:     $(npm --version)"
    echo -e "   Current Directory: $(pwd)"
    echo ""
}

# Function to show git status
show_git_status() {
    echo -e "${BLUE}📋 Git Status:${NC}"
    git status --porcelain | head -5
    if [ $(git status --porcelain | wc -l) -gt 5 ]; then
        echo "   ... and more files"
    fi
    echo ""
}

# Function to start services if not running
start_services() {
    echo -e "${YELLOW}🔧 Starting Services...${NC}"
    
    # Check if Next.js dev server is running
    if ! check_process "next-server"; then
        echo -e "${YELLOW}   Starting Next.js development server...${NC}"
        npm run dev &
        sleep 3
    fi
    
    # Check if Prisma dev server is running
    if ! check_process "prisma"; then
        echo -e "${YELLOW}   Starting Prisma development server...${NC}"
        npx prisma dev &
        sleep 3
    fi
    
    echo ""
}

# Function to show recent errors from logs
show_recent_errors() {
    echo -e "${BLUE}🔍 Recent Errors (last 10 lines):${NC}"
    if [ -f ".next/server.log" ]; then
        tail -10 .next/server.log | grep -i error || echo "   No recent errors found"
    else
        echo "   No log file found"
    fi
    echo ""
}

# Function to show database status
show_database_status() {
    echo -e "${BLUE}🗄️ Database Status:${NC}"
    
    # Check if Prisma client is generated
    if [ -d "node_modules/.prisma/client" ]; then
        echo -e "   ${GREEN}✅ Prisma client generated${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Prisma client not generated${NC}"
        echo -e "   Run: ${YELLOW}npx prisma generate${NC}"
    fi
    
    # Check database connection (basic check)
    if npx prisma db pull --force > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "   ${RED}❌ Database connection failed${NC}"
        echo -e "   Check: ${YELLOW}DATABASE_URL${NC} in .env file"
    fi
    echo ""
}

# Function to show project statistics
show_project_stats() {
    echo -e "${BLUE}📈 Project Statistics:${NC}"
    
    # Count files by type
    echo -e "   📄 TypeScript files: $(find . -name "*.ts" -o -name "*.tsx" | wc -l | tr -d ' ')"
    echo -e "   🎨 CSS files:        $(find . -name "*.css" | wc -l | tr -d ' ')"
    echo -e "   📦 Dependencies:     $(cat package.json | jq '.dependencies | keys | length' 2>/dev/null || echo "N/A")"
    echo -e "   🔧 Dev Dependencies: $(cat package.json | jq '.devDependencies | keys | length' 2>/dev/null || echo "N/A")"
    echo ""
}

# Main monitoring loop
main_monitor() {
    while true; do
        clear
        echo "🚀 CPACE Learning Portal - Live Development Monitor"
        echo "===================================================="
        echo "Last updated: $(date)"
        echo ""
        
        # Show all status information
        show_system_info
        show_urls
        show_git_status
        show_database_status
        show_project_stats
        
        echo -e "${BLUE}🔍 Service Status:${NC}"
        check_port "3000" "Next.js Dev Server"
        check_port "51213" "Prisma Database"
        check_port "5555" "Prisma Studio (if running)"
        echo ""
        
        echo -e "${BLUE}📋 Quick Commands:${NC}"
        echo -e "   ${YELLOW}npm run dev${NC}        - Start development server"
        echo -e "   ${YELLOW}npx prisma dev${NC}      - Start database server"
        echo -e "   ${YELLOW}npx prisma studio${NC}   - Open database GUI"
        echo -e "   ${YELLOW}npx prisma db push${NC}  - Apply schema changes"
        echo -e "   ${YELLOW}npm run build${NC}       - Build for production"
        echo ""
        
        echo -e "${GREEN}Press Ctrl+C to stop monitoring${NC}"
        echo -e "${YELLOW}Auto-refresh in 30 seconds...${NC}"
        
        sleep 30
    done
}

# Command line argument handling
case "$1" in
    "start")
        echo -e "${YELLOW}🚀 Starting all development services...${NC}"
        start_services
        show_urls
        ;;
    "status")
        echo -e "${BLUE}📊 Current Status:${NC}"
        show_system_info
        show_urls
        show_database_status
        show_project_stats
        check_port "3000" "Next.js Dev Server"
        check_port "51213" "Prisma Database"
        ;;
    "monitor")
        main_monitor
        ;;
    "help"|"-h"|"--help")
        echo "CPACE Development Monitor"
        echo ""
        echo "Usage: ./dev-monitor.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start    - Start all development services"
        echo "  status   - Show current status"
        echo "  monitor  - Start live monitoring (auto-refresh)"
        echo "  help     - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./dev-monitor.sh start     # Start services"
        echo "  ./dev-monitor.sh monitor   # Live monitoring"
        echo "  ./dev-monitor.sh status    # Quick status check"
        ;;
    *)
        echo -e "${YELLOW}🚀 Starting CPACE Development Monitor...${NC}"
        echo -e "${BLUE}Use './dev-monitor.sh help' for all commands${NC}"
        echo ""
        main_monitor
        ;;
esac
