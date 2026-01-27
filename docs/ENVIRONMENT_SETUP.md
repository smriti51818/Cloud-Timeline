# Azure Environment Setup Guide

This guide walks you through setting up all required Azure services for the Cloud Timeline application.

## Overview

You'll need to create and configure the following Azure services:
1. Azure Active Directory (App Registration)
2. Azure Storage Account (Blob Storage)
3. Azure Cosmos DB
4. Azure Cognitive Services (3 services)
5. Azure Static Web App

**Estimated Setup Time**: 30-45 minutes  
**Estimated Monthly Cost**: $0-$50 (depending on usage, mostly free tier)

---

## Prerequisites

- Azure account ([Create free account](https://azure.microsoft.com/free/))
- Azure CLI installed ([Install guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Basic understanding of Azure Portal

---

## Step 1: Azure Active Directory (Authentication)

### Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory**
3 Click **App registrations** → **New registration**

**Configuration:**
- **Name**: `Cloud Timeline App`
- **Supported account types**: Select based on your needs:
  - Single tenant (org only) or
  - Multitenant + personal Microsoft accounts
- **Redirect URI**: 
  - Platform: `Web`
  - URI: `http://localhost:3000/api/auth/callback/azure-ad` (for development)

4. Click **Register**

### Configure App Registration

After creation:

**1.Get Application (client) ID:**
- Copy the **Application (client) ID**
- Save as `NEXT_PUBLIC_AZURE_CLIENT_ID`

**2. Get Directory (tenant) ID:**
- Copy the **Directory (tenant) ID**
- Save as `NEXT_PUBLIC_AZURE_TENANT_ID`

**3. Add Production Redirect URI:**
- Go to **Authentication**
- Click **Add a platform** → **Web**
- Add: `https://YOUR-APP.azurestaticapps.net/api/auth/callback/azure-ad`
- Enable **ID tokens** checkbox
- Click **Save**

**4. API Permissions:**
- Go to **API permissions**
- By default, `User.Read` is included (sufficient for our app)

---

## Step 2: Azure Storage Account (Blob Storage)

### Create Storage Account

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name cloud-timeline-rg --location eastus

# Create storage account
az storage account create \
  --name cloudtimelinestg \
  --resource-group cloud-timeline-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### Create Blob Container

```bash
# Create container for media files
az storage container create \
  --name timeline-media \
  --account-name cloudtimelinestg \
  --public-access blob
```

### Configure CORS

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT DELETE \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name cloudtimelinestg
```

### Get Credentials

```bash
# Get account key
az storage account keys list \
  --resource-group cloud-timeline-rg \
  --account-name cloudtimelinestg \
  --query "[0].value" \
  --output tsv
```

Save the following:
- **Account Name**: `cloudtimelinestg` → `AZURE_STORAGE_ACCOUNT`
- **Account Key**: (from command above) → `AZURE_STORAGE_KEY`
- **Connection String**: Go to Portal → Storage Account → Access keys

---

## Step 3: Azure Cosmos DB

### Create Cosmos DB Account

```bash
az cosmosdb create \
  --name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --default-consistency-level Session \
  --locations regionName=eastus failoverPriority=0 \
  --enable-free-tier true
```

### Create Database and Container

```bash
# Create database
az cosmosdb sql database create \
  --account-name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --name timeline-db

# Create container
az cosmosdb sql container create \
  --account-name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --database-name timeline-db \
  --name timeline-entries \
  --partition-key-path "/userId" \
  --throughput 400
```

### Get Credentials

**Via Portal:**
1. Navigate to Cosmos DB Account
2. Go to **Keys**
3. Copy:
   - **URI** → `AZURE_COSMOS_ENDPOINT`
   - **PRIMARY KEY** → `AZURE_COSMOS_KEY`

**Via CLI:**
```bash
# Get endpoint
az cosmosdb show \
  --name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --query "documentEndpoint" \
  --output tsv

# Get key
az cosmosdb keys list \
  --name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --query "primaryMasterKey" \
  --output tsv
```

---

## Step 4: Azure Cognitive Services

You need 3 Cognitive Services:

### 4a. Computer Vision (Image Analysis)

```bash
az cognitiveservices account create \
  --name cloud-timeline-vision \
  --resource-group cloud-timeline-rg \
  --kind ComputerVision \
  --sku F0 \
  --location eastus \
  --yes
```

**Get Credentials:**
```bash
# Get endpoint
az cognitiveservices account show \
  --name cloud-timeline-vision \
  --resource-group cloud-timeline-rg \
  --query "properties.endpoint" \
  --output tsv

# Get key
az cognitiveservices account keys list \
  --name cloud-timeline-vision \
  --resource-group cloud-timeline-rg \
  --query "key1" \
  --output tsv
```

Save as:
- `AZURE_COGNITIVE_VISION_ENDPOINT`
- `AZURE_COGNITIVE_VISION_KEY`

### 4b. Speech Services (Audio Transcription)

```bash
az cognitiveservices account create \
  --name cloud-timeline-speech \
  --resource-group cloud-timeline-rg \
  --kind SpeechServices \
  --sku F0 \
  --location eastus \
  --yes
```

**Get Credentials:**
```bash
# Get key
az cognitiveservices account keys list \
  --name cloud-timeline-speech \
  --resource-group cloud-timeline-rg \
  --query "key1" \
  --output tsv
```

Save as:
- `AZURE_COGNITIVE_SPEECH_KEY` (key from above)
- `AZURE_COGNITIVE_SPEECH_REGION` (e.g., `eastus`)

### 4c. Language Service (Sentiment Analysis)

```bash
az cognitiveservices account create \
  --name cloud-timeline-language \
  --resource-group cloud-timeline-rg \
  --kind TextAnalytics \
  --sku F0 \
  --location eastus \
  --yes
```

**Get Credentials:**
```bash
# Get endpoint
az cognitiveservices account show \
  --name cloud-timeline-language \
  --resource-group cloud-timeline-rg \
  --query "properties.endpoint" \
  --output tsv

# Get key
az cognitiveservices account keys list \
  --name cloud-timeline-language \
  --resource-group cloud-timeline-rg \
  --query "key1" \
  --output tsv
```

Save as:
- `AZURE_COGNITIVE_TEXT_ENDPOINT`
- `AZURE_COGNITIVE_TEXT_KEY`

---

## Step 5: Configure Environment Variables

### For Local Development

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in all the values you saved above

3. Generate NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Save as `NEXTAUTH_SECRET`

### For Production (GitHub Secrets)

Add all environment variables as GitHub Secrets (see [DEPLOYMENT.md](../DEPLOYMENT.md#step-2-configure-github-secrets))

---

## Verification

### Test Each Service

**1. Azure AD:**
```bash
curl https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0/.well-known/openid-configuration
```

**2. Storage:**
```bash
az storage blob list \
  --container-name timeline-media \
  --account-name cloudtimelinestg
```

**3. Cosmos DB:**
```bash
az cosmosdb sql database show \
  --account-name cloud-timeline-cosmos \
  --resource-group cloud-timeline-rg \
  --name timeline-db
```

**4. Cognitive Services:**
Test via Azure Portal → Resource → Quick test

---

## Cost Management

### Free Tier Limits

| Service | Free Tier | Overage Cost |
|---------|-----------|--------------|
| Static Web Apps | 100GB bandwidth | $0.20/GB |
| Cosmos DB | 1000 RU/s | ~$24/month for 400 RU/s |
| Blob Storage | 5GB | ~$0.02/GB/month |
| Computer Vision | 5,000 transactions | $1/1,000 transactions |
| Speech | 5 audio hours | $1/hour |
| Text Analytics | 5,000 text records | $2/1,000 records |

### Set Cost Alerts

```bash
# Create budget alert
az consumption budget create \
  --budget-name cloud-timeline-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date "2026-01-01" \
  --end-date "2027-01-01"
```

---

## Cleanup (When Done Testing)

To delete all resources:

```bash
az group delete --name cloud-timeline-rg --yes --no-wait
```

---

## Troubleshooting

### Common Issues

**"Subscription not found"**
- Run `az account list` and set correct subscription
- `az account set --subscription YOUR_SUBSCRIPTION_ID`

**"Resource name already exists"**
- Resource names are globally unique
- Add random suffix: `cloudtimelinestg12345`

**"Quota exceeded"**
- You may have hit free tier limits
- Check Azure Portal → Cost Management

---

## Next Steps

After completing this setup:
1. ✅  Test locally with `npm run dev`
2. ✅ Follow [DEPLOYMENT.md](../DEPLOYMENT.md) to deploy to production

---

## Additional Resources

- [Azure Free Account](https://azure.microsoft.com/free/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Azure Documentation](https://docs.microsoft.com/azure/)
