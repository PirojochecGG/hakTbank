#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    HakTbank Docker Setup & Init        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check Docker installation
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker $(docker --version | awk '{print $3}')${NC}"
echo -e "${GREEN}✓ Docker Compose $(docker-compose --version | awk '{print $3}')${NC}"
echo ""

# Create .env file
echo -e "${YELLOW}Setting up environment...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        echo -e "${YELLOW}  ⚠️  Please update .env with your configuration${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
echo ""

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p backups logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Check if services are already running
echo -e "${YELLOW}Checking for running services...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  Some services are already running${NC}"
    echo -e "${YELLOW}Run 'docker-compose down' to stop them first${NC}"
else
    echo -e "${GREEN}✓ No running services found${NC}"
    echo ""

    # Build images
    echo -e "${YELLOW}Building Docker images...${NC}"
    echo -e "${BLUE}This may take a few minutes...${NC}"
    docker-compose build

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Images built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build images${NC}"
        exit 1
    fi
    echo ""
fi

# Summary
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Setup Complete! ✓             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo -e "  1. Review and update .env configuration:"
echo -e "     ${YELLOW}nano .env${NC}"
echo ""
echo -e "  2. Start all services:"
echo -e "     ${YELLOW}docker-compose up -d${NC}"
echo -e "     or"
echo -e "     ${YELLOW}make up${NC}"
echo ""
echo -e "  3. Check service status:"
echo -e "     ${YELLOW}docker-compose ps${NC}"
echo ""
echo -e "  4. View logs:"
echo -e "     ${YELLOW}docker-compose logs -f${NC}"
echo ""
echo -e "${GREEN}Services will be available at:${NC}"
echo -e "  • Frontend: ${YELLOW}http://localhost:80${NC}"
echo -e "  • Backend:  ${YELLOW}http://localhost:8080${NC}"
echo -e "  • Database: ${YELLOW}localhost:5432${NC}"
echo -e "  • Redis:    ${YELLOW}localhost:6379${NC}"
echo ""
echo -e "${GREEN}Useful commands:${NC}"
echo -e "  • ${YELLOW}make help${NC}       - Show all available commands"
echo -e "  • ${YELLOW}make logs${NC}       - View logs"
echo -e "  • ${YELLOW}make shell-api${NC}  - Open bash in API container"
echo -e "  • ${YELLOW}make test${NC}       - Run tests"
echo -e "  • ${YELLOW}make migrate${NC}    - Run migrations"
echo ""
echo -e "${YELLOW}Documentation: See DOCKER_SETUP.md for detailed information${NC}"
echo ""
