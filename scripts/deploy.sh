#!/bin/bash

# Timeline of Me - Deployment Script
# This script helps deploy the application to Azure

set -e

echo "🚀 Timeline of Me - Deployment Script"
echo "======================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "🔐 Please log in to Azure:"
    az login
fi

# Get current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "📋 Current subscription: $SUBSCRIPTION"

# Set variables
RESOURCE_GROUP="timeline-rg"
LOCATION="Central US"
APP_NAME="timeline-of-me"
STORAGE_ACCOUNT="timelineofmestorage"

echo ""
echo "🏗️  Building the application..."

# Install dependencies
npm install

# Build the application
npm run build

echo ""
echo "📦 Application built successfully!"

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "📁 Creating resource group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location "$LOCATION"
else
    echo "📁 Resource group already exists: $RESOURCE_GROUP"
fi

echo ""
echo "🌐 Deploying to Azure Static Web Apps..."

# Check if Static Web App exists
if ! az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo "🆕 Creating new Static Web App..."
    
    # Get GitHub repository URL (you'll need to update this)
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/timeline-of-me): " GITHUB_REPO
    
    if [ -z "$GITHUB_REPO" ]; then
        echo "❌ GitHub repository URL is required"
        exit 1
    fi
    
    # Create Static Web App
    az staticwebapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --source $GITHUB_REPO \
        --location "$LOCATION" \
        --branch main \
        --app-location "/" \
        --output-location "out"
    
    echo "✅ Static Web App created successfully!"
    echo ""
    echo "🔑 You'll need to add the following secrets to your GitHub repository:"
    echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN"
    echo ""
    echo "   Get the token from: Azure Portal → Static Web Apps → $APP_NAME → Manage deployment token"
else
    echo "✅ Static Web App already exists: $APP_NAME"
fi

echo ""
echo "⚙️  Configuring environment variables..."

# Get Static Web App details
SWA_URL=$(az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv)

echo "📝 Please configure the following environment variables in Azure Portal:"
echo "   Go to: Azure Portal → Static Web Apps → $APP_NAME → Configuration"
echo ""
echo "Required environment variables:"
echo "==============================="

# Read environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📄 Reading from .env.local..."
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ ! $line =~ ^# ]] && [[ -n $line ]]; then
            echo "   $line"
        fi
    done < .env.local
else
    echo "⚠️  .env.local not found. Please create it with your Azure service credentials."
    echo "   See env.example for reference."
fi

echo ""
echo "🌍 Your application will be available at:"
echo "   https://$SWA_URL"
echo ""
echo "📋 Next steps:"
echo "   1. Configure environment variables in Azure Portal"
echo "   2. Push your code to the main branch"
echo "   3. The application will automatically deploy"
echo "   4. Test all functionality"
echo ""
echo "✅ Deployment setup complete!"

# Optional: Open Azure Portal
read -p "🌐 Open Azure Portal? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    az portal
fi
