#!/usr/bin/env bash

# Validating options
validate_option() {
    local option="${1:-local}" # If there's not a param 1, set it to "local"
    local valid_options=("ec2" "local_live" "local")
    local candidate

    for candidate in "${valid_options[@]}"; do
        if [[ "$option" == "$candidate" ]]; then
            printf '%s\n' "$option"
            return 0
        fi
    done
    
    echo "Invalid option: $option" >&2
    return 1
}

# Verifying docker is in use and finding the correct docker command
verify_docker() {
    local compose
    # Check that the docker command works
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker is not installed or is not in PATH. Rerun ./installDependencies.sh." >&2
        return 1
    fi

    # Find the right docker compose command
    if docker compose version >/dev/null 2>&1; then
        compose="docker compose"
    elif command -v docker-compose >/dev/null 2>&1; then
        compose="docker-compose"
    else
        echo "The Docker compose plugin is not available to the Docker CLI." >&2
        echo "Docker executable: $(command -v docker)" >&2
        docker --version || true
        echo "Rerun ./installDependencies.sh, then verify with: docker compose version" >&2
        return 1
    fi

    # Check that docker is running
    if ! docker info >/dev/null 2>&1; then
        echo "Docker is installed, but the daemon is unavailable or this user lacks permission." >&2
        echo "Log out and SSH back in, then run: docker info" >&2
        return 1
    fi

    # If everything is working, return the right compose command
    printf '%s\n' "$compose"
    return 0
}