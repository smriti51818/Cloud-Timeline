# Azure Services Setup Guide

This guide will help you set up all the required Azure services for the Timeline of Me application.

## Prerequisites

1. Azure account with active subscription
2. Azure CLI installed (optional but recommended)
3. Node.js 18+ installed

## Step 1: Azure AD B2C Setup

### 1.1 Create B2C Tenant

```bash
# Login to Azure
az login

# Create resource group
az group create --name timeline-rg --location "Central US"

# Create B2C tenant (this must be done via Azure Portal)
```

**Via Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure AD B2C"
3. Click "Create a new B2C tenant"
4. Choose "Create a new Azure AD B2C tenant"
5. Fill in:
   - Organization name: `Timeline of Me`
   - Initial domain name: `timelineofme` (must be unique)
   - Country/Region: Your location
6. Click "Review + create" then "Create"

### 1.2 Register Application

1. In your B2C tenant, go to "App registrations"
2. Click "New registration"
3. Fill in:
   - Name: `Timeline of Me`
   - Supported account types: "Accounts in any identity provider or organizational directory"
   - Redirect URI: `http://localhost:3000`
4. Click "Register"
5. Note down the **Application (client) ID** and **Directory (tenant) ID**

### 1.3 Create User Flow

1. Go to "User flows" in B2C
2. Click "New user flow"
3. Choose "Sign up and sign in"
4. Fill in:
   - Name: `B2C_1_signupsignin`
   - Identity providers: Check "Email signup"
   - User attributes: Check "Display Name", "Email Address"
   - Application claims: Check "Display Name", "Email Addresses"
5. Click "Create"

### 1.4 Add Google Identity Provider (Optional)

1. Go to "Identity providers" in B2C
2. Click "Add Google provider"
3. Fill in Google OAuth credentials
4. Update your user flow to include Google

## Step 2: Azure Storage Account

```bash
# Create storage account
az storage account create \
  --name timelineofmestorage \
  --resource-group timeline-rg \
  --location "Central US" \
  --sku Standard_LRS

# Create container
az storage container create \
  --name timeline-media \
  --account-name timelineofmestorage \
  --public-access off

# Get storage key
az storage account keys list \
  --account-name timelineofmestorage \
  --resource-group timeline-rg
```

**Note down:**
- Storage account name: `timelineofmestorage`
- Storage key (from the command above)

## Step 3: Azure Cosmos DB

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name timeline-cosmos \
  --resource-group timeline-rg \
  --locations regionName="Central US" failoverPriority=0 isZoneRedundant=False \
  --capabilities EnableServerless

# Create database
az cosmosdb sql database create \
  --account-name timeline-cosmos \
  --resource-group timeline-rg \
  --name timeline-db

# Create container
az cosmosdb sql container create \
  --account-name timeline-cosmos \
  --resource-group timeline-rg \
  --database-name timeline-db \
  --name timeline-entries \
  --partition-key-path "/userId" \
  --throughput 400
```

**Note down:**
- URI: `https://timeline-cosmos.documents.azure.com:443/`
- Primary key (get from Azure Portal → Cosmos DB → Keys)

## Step 4: Azure Cognitive Services

### 4.1 Computer Vision

```bash
# Create Computer Vision resource
az cognitiveservices account create \
  --name timeline-vision \
  --resource-group timeline-rg \
  --location "Central US" \
  --kind ComputerVision \
  --sku S0
```

### 4.2 Speech Services

```bash
# Create Speech Services resource
az cognitiveservices account create \
  --name timeline-speech \
  --resource-group timeline-rg \
  --location "Central US" \
  --kind SpeechServices \
  --sku S0
```

### 4.3 Text Analytics

```bash
# Create Text Analytics resource
az cognitiveservices account create \
  --name timeline-text \
  --resource-group timeline-rg \
  --location "Central US" \
  --kind TextAnalytics \
  --sku S
```

**Get keys and endpoints:**
```bash
# Get Computer Vision details
az cognitiveservices account show \
  --name timeline-vision \
  --resource-group timeline-rg

# Get Speech Services details
az cognitiveservices account show \
  --name timeline-speech \
  --resource-group timeline-rg

# Get Text Analytics details
az cognitiveservices account show \
  --name timeline-text \
  --resource-group timeline-rg
```

## Step 5: Environment Configuration

Create `.env.local` file with your Azure service details:

```env
# Azure AD B2C Configuration
NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_AZURE_TENANT_ID=your_tenant_id_here
NEXT_PUBLIC_AZURE_AUTHORITY=https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signupsignin

# Azure Storage Account
AZURE_STORAGE_ACCOUNT=timelineofmestorage
AZURE_STORAGE_KEY=your_storage_key_here
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=timelineofmestorage;AccountKey=your_storage_key_here;EndpointSuffix=core.windows.net

# Azure Cosmos DB
AZURE_COSMOS_ENDPOINT=https://timeline-cosmos.documents.azure.com:443/
AZURE_COSMOS_KEY=your_cosmos_key_here
AZURE_COSMOS_DATABASE=timeline-db
AZURE_COSMOS_CONTAINER=timeline-entries

# Azure Cognitive Services - Computer Vision
AZURE_COGNITIVE_VISION_KEY=your_vision_key_here
AZURE_COGNITIVE_VISION_ENDPOINT=https://timeline-vision.cognitiveservices.azure.com/

# Azure Cognitive Services - Speech
AZURE_COGNITIVE_SPEECH_KEY=your_speech_key_here
AZURE_COGNITIVE_SPEECH_REGION=centralus

# Azure Cognitive Services - Text Analytics
AZURE_COGNITIVE_TEXT_KEY=your_text_key_here
AZURE_COGNITIVE_TEXT_ENDPOINT=https://timeline-text.cognitiveservices.azure.com/

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

## Step 6: Test Your Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

4. Test authentication and upload functionality

## Troubleshooting

### Common Issues:

1. **Authentication not working**: Check B2C tenant configuration and redirect URIs
2. **File upload fails**: Verify storage account permissions and container exists
3. **Database errors**: Check Cosmos DB connection string and container configuration
4. **AI services not working**: Verify Cognitive Services keys and endpoints

### Cost Optimization:

- Use **Serverless** Cosmos DB for development
- Use **Standard** tier for Storage (not Premium)
- Use **S0** tier for Cognitive Services (not F0 for production)
- Set up **budget alerts** in Azure Portal

## Next Steps

1. Test all functionality locally
2. Set up CI/CD pipeline
3. Deploy to Azure Static Web Apps
4. Configure custom domain (optional)
5. Set up monitoring and alerts

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. Use **Azure Key Vault** for production secrets
3. Enable **HTTPS only** in production
4. Set up **CORS** policies for your domain
5. Use **Managed Identity** when possible
6. Enable **audit logging** for all services
