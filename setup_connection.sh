#!/bin/bash

# Import and configure confluence connection for orchestrate
echo "Importing confluence connection..."

# Check if we're already in the confluence_agent directory
if [ ! -f "connections/confluence_connection.yaml" ]; then
    echo "Error: connections/confluence_connection.yaml not found. Make sure you're in the confluence_agent directory."
    exit 1
fi

# Import the connection configuration
echo "Importing connection configuration..."
orchestrate connections add -a confluence_creds

# Configure the connection
echo "Configuring confluence connection..."
orchestrate connections configure -a confluence_creds --env draft --kind key_value --type team
orchestrate connections configure -a confluence_creds --env live --kind key_value --type team

# Set credentials for the connection
echo "Setting connection credentials..."
echo "You will be prompted to enter your confluence credentials:"
echo "1. CONFLUENCE_URL - Your confluence URL"
echo "2. ATLASSIAN_USERNAME - Your confluence username"
echo "3. ATLASSIAN_API_TOKEN - Your confluence API token (get from Setup > My Personal Information > Reset Security Token)"
echo ""

# Prompt for credentials
read -p "Enter your CONFLUENCE_URL: " url
read -s -p "Enter your ATLASSIAN_USERNAME: " username
echo ""
read -s -p "Enter your ATLASSIAN_API_TOKEN: " token
echo ""

# Set the credentials using orchestrate CLI for draft environment
echo "Setting credentials for draft environment..."
orchestrate connections set-credentials --app-id confluence_creds --env draft -e CONFLUENCE_URL="$url" -e ATLASSIAN_USERNAME="$username" -e ATLASSIAN_API_TOKEN="$token"
# orchestrate connections set-credentials create --app-id confluence_creds --env draft -e SF_PASSWORD="$password"
# orchestrate connections set-credentials create --app-id confluence_creds --env draft -e SF_SECURITY_TOKEN="$token"
# orchestrate connections set-credentials create --app-id confluence_creds --env draft -e SF_DOMAIN="$domain"

# Also set credentials for live environment (for production deployment)
echo "Setting credentials for live environment..."
orchestrate connections set-credentials --app-id confluence_creds --env live -e CONFLUENCE_URL="$url" -e ATLASSIAN_USERNAME="$username" -e ATLASSIAN_API_TOKEN="$token"
# orchestrate connections set-credentials create --app-id confluence_creds --env live -e SF_PASSWORD="$password"
# orchestrate connections set-credentials create --app-id confluence_creds --env live -e SF_SECURITY_TOKEN="$token"
# orchestrate connections set-credentials create --app-id confluence_creds --env live -e SF_DOMAIN="$domain"

echo "Connection credentials set successfully!"
echo "Connection is ready to use with your confluence tools."
