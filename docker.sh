#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info ".env created from .env.example. Please update it with your values if needed."
    else
        print_error ".env.example not found!"
        exit 1
    fi
fi

# Function to show help
show_help() {
    echo "Usage: $0 {up|down|restart|logs|build|clean|status|shell-api|shell-web|test}"
    echo ""
    echo "Commands:"
    echo "  up          - Start all services (docker-compose up -d)"
    echo "  down        - Stop all services (docker-compose down)"
    echo "  restart     - Restart all services"
    echo "  logs        - Show logs from all services"
    echo "  build       - Build all images"
    echo "  clean       - Remove containers, volumes, and images"
    echo "  status      - Show status of all services"
    echo "  shell-api   - Open shell in API container"
    echo "  shell-web   - Open shell in Web container"
    echo "  test        - Run tests in API"
    echo ""
}

# Function to start services
start_services() {
    print_info "Starting services..."
    docker-compose up -d
    print_info "Services started!"
    print_info "Web: http://localhost:80"
    print_info "API: http://localhost:8080"
    print_info "PostgreSQL: localhost:5432"
    print_info "Redis: localhost:6379"
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose down
    print_info "Services stopped!"
}

# Function to restart services
restart_services() {
    print_info "Restarting services..."
    docker-compose restart
    print_info "Services restarted!"
}

# Function to show logs
show_logs() {
    docker-compose logs -f
}

# Function to build images
build_images() {
    print_info "Building images..."
    docker-compose build
    print_info "Images built!"
}

# Function to clean up
clean_services() {
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_info "Cleanup completed!"
    else
        print_warning "Cleanup cancelled."
    fi
}

# Function to show status
show_status() {
    print_info "Container Status:"
    docker-compose ps
}

# Function to open shell in API container
shell_api() {
    docker-compose exec api /bin/bash
}

# Function to open shell in Web container
shell_web() {
    docker-compose exec web /bin/sh
}

# Function to run tests
run_tests() {
    print_info "Running tests..."
    docker-compose exec api uv run pytest tests/
}

# Main script logic
case "${1:-up}" in
    up)
        start_services
        ;;
    down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    build)
        build_images
        ;;
    clean)
        clean_services
        ;;
    status)
        show_status
        ;;
    shell-api)
        shell_api
        ;;
    shell-web)
        shell_web
        ;;
    test)
        run_tests
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
