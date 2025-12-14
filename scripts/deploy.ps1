# Timeline of Me - Deployment Script (Windows PowerShell)
# This script helps deploy the application to Azure

Write-Host "🚀 Timeline of Me - Deployment Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $null = Get-Command az -ErrorAction Stop
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $null = az account show 2>$null
} catch {
    Write-Host "🔐 Please log in to Azure:" -ForegroundColor Yellow
    az login
}

# Get current subscription
$subscription = az account show --query name -o tsv
Write-Host "📋 Current subscription: $subscription" -ForegroundColor Green

# Set variables
$resourceGroup = "timeline-rg"
$location = "Central India"
$appName = "timeline-of-me"

Write-Host ""
Write-Host "🏗️  Building the application..." -ForegroundColor Yellow

# Install dependencies
npm install

# Build the application
npm run build

Write-Host ""
Write-Host "📦 Application built successfully!" -ForegroundColor Green

# Check if resource group exists
try {
    $null = az group show --name $resourceGroup 2>$null
    Write-Host "📁 Resource group already exists: $resourceGroup" -ForegroundColor Green
} catch {
    Write-Host "📁 Creating resource group: $resourceGroup" -ForegroundColor Yellow
    az group create --name $resourceGroup --location $location
}

Write-Host ""
Write-Host "🌐 Deploying to Azure Static Web Apps..." -ForegroundColor Yellow

# Check if Static Web App exists
try {
    $null = az staticwebapp show --name $appName --resource-group $resourceGroup 2>$null
    Write-Host "✅ Static Web App already exists: $appName" -ForegroundColor Green
} catch {
    Write-Host "🆕 Creating new Static Web App..." -ForegroundColor Yellow
    
    # Get GitHub repository URL
    $githubRepo = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/timeline-of-me)"
    
    if ([string]::IsNullOrWhiteSpace($githubRepo)) {
        Write-Host "❌ GitHub repository URL is required" -ForegroundColor Red
        exit 1
    }
    
    # Create Static Web App
    az staticwebapp create `
        --name $appName `
        --resource-group $resourceGroup `
        --source $githubRepo `
        --location $location `
        --branch main `
        --app-location "/" `
        --output-location "out"
    
    Write-Host "✅ Static Web App created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔑 You'll need to add the following secrets to your GitHub repository:" -ForegroundColor Yellow
    Write-Host "   - AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    Write-Host ""
    Write-Host "   Get the token from: Azure Portal → Static Web Apps → $appName → Manage deployment token" -ForegroundColor White
}

Write-Host ""
Write-Host "⚙️  Configuring environment variables..." -ForegroundColor Yellow

# Get Static Web App details
$swaUrl = az staticwebapp show --name $appName --resource-group $resourceGroup --query defaultHostname -o tsv

Write-Host "📝 Please configure the following environment variables in Azure Portal:" -ForegroundColor Yellow
Write-Host "   Go to: Azure Portal → Static Web Apps → $appName → Configuration" -ForegroundColor White
Write-Host ""
Write-Host "Required environment variables:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Read environment variables from .env.local if it exists
if (Test-Path ".env.local") {
    Write-Host "📄 Reading from .env.local..." -ForegroundColor Green
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -notmatch "^#" -and $_.Trim() -ne "") {
            Write-Host "   $_" -ForegroundColor White
        }
    }
} else {
    Write-Host "⚠️  .env.local not found. Please create it with your Azure service credentials." -ForegroundColor Yellow
    Write-Host "   See env.example for reference." -ForegroundColor White
}

Write-Host ""
Write-Host "🌍 Your application will be available at:" -ForegroundColor Green
Write-Host "   https://$swaUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Configure environment variables in Azure Portal" -ForegroundColor White
Write-Host "   2. Push your code to the main branch" -ForegroundColor White
Write-Host "   3. The application will automatically deploy" -ForegroundColor White
Write-Host "   4. Test all functionality" -ForegroundColor White
Write-Host ""
Write-Host "✅ Deployment setup complete!" -ForegroundColor Green

# Optional: Open Azure Portal
$openPortal = Read-Host "🌐 Open Azure Portal? (y/n)"
if ($openPortal -eq "y" -or $openPortal -eq "Y") {
    az portal
}
