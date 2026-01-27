# Cloud Timeline Deployment Guide

This guide covers deploying the **Timeline of Me** application to Azure Static Web Apps.

## Prerequisites

Before deploying, ensure you have:

- ✅ Azure account with active subscription
- ✅ GitHub repository with your code
- ✅ All Azure services provisioned (see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md))
- ✅ Environment variables configured

## Deployment Architecture

The application uses:
- **Azure Static Web Apps** - Hosts the Next.js frontend
- **Azure Functions** - Serverless API routes (automatically configured)
- **Azure Cosmos DB** - NoSQL database for timeline entries
- **Azure Blob Storage** - Media file storage
- **Azure Cognitive Services** - AI features (transcription, sentiment analysis)

---

## Step 1: Create Azure Static Web App

### Via Azure Portal

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** → Search for **Static Web Apps**
3. Click **Create**

**Configuration:**
- **Subscription**: Select your subscription
- **Resource Group**: Create new or select existing
- **Name**: `cloud-timeline-app` (or your preferred name)
- **Region**: Choose closest to your users
- **SKU**: Free (or Standard for production)
- **Deployment source**: GitHub
- **GitHub account**: Authorize and select your account
- **Organization**: Your GitHub username/org
- **Repository**: Select your Cloud Timeline repo
- **Branch**: `main`

**Build Details:**
- **Build Presets**: Next.js
- **App location**: `/`
- **API location**: `` (leave empty)
- **Output location**: `.next`

4. Click **Review + create** → **Create**

### Via Azure CLI

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name cloud-timeline-rg --location eastus

# Create Static Web App
az staticwebapp create \
  --name cloud-timeline-app \
  --resource-group cloud-timeline-rg \
  --source https://github.com/YOUR-USERNAME/YOUR-REPO \
  --location eastus \
  --branch main \
  --app-location "/" \
  --output-location ".next" \
  --login-with-github
```

---

## Step 2: Configure GitHub Secrets

After creating the Static Web App, Azure generates a deployment token.

### Get Deployment Token

**Via Portal:**
1. Go to your Static Web App resource
2. Navigate to **Overview** → **Manage deployment token**
3. Copy the token

**Via CLI:**
```bash
az staticwebapp secrets list \
  --name cloud-timeline-app \
  --query "properties.apiKey" \
  --output tsv
```

### Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add the following secrets:

| Secret Name | Value  | Where to get it |
|-------------|--------|-----------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token | From Azure Portal or CLI above |
| `NEXTAUTH_SECRET` | Random 32-char string | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL | From Azure Static Web App (e.g., `https://your-app.azurestaticapps.net`) |
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | Azure AD Client ID | Azure Portal → App Registrations |
| `NEXT_PUBLIC_AZURE_TENANT_ID` | Azure AD Tenant ID | Azure Portal → App Registrations |
| `AZURE_STORAGE_ACCOUNT` | Storage account name | Azure Portal → Storage Accounts |
| `AZURE_STORAGE_KEY` | Storage account key | Azure Portal → Storage Accounts → Access keys |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage connection string | Azure Portal → Storage Accounts → Access keys |
| `AZURE_COSMOS_ENDPOINT` | Cosmos DB endpoint | Azure Portal → Cosmos DB → Keys |
| `AZURE_COSMOS_KEY` | Cosmos DB primary key | Azure Portal → Cosmos DB → Keys |
| `AZURE_COSMOS_DATABASE` | `timeline-db` | Your database name |
| `AZURE_COSMOS_CONTAINER` | `timeline-entries` | Your container name |
| `AZURE_COGNITIVE_VISION_KEY` | Computer Vision key | Azure Portal → Cognitive Services → Computer Vision |
| `AZURE_COGNITIVE_VISION_ENDPOINT` | Computer Vision endpoint | Azure Portal → Cognitive Services → Computer Vision |
| `AZURE_COGNITIVE_SPEECH_KEY` | Speech service key | Azure Portal → Cognitive Services → Speech |
| `AZURE_COGNITIVE_SPEECH_REGION` | Speech region | e.g., `eastus` |
| `AZURE_COGNITIVE_TEXT_KEY` | Text Analytics key | Azure Portal → Cognitive Services → Language |
| `AZURE_COGNITIVE_TEXT_ENDPOINT` | Text Analytics endpoint | Azure Portal → Cognitive Services → Language |

---

## Step 3: Trigger Deployment

### Automatic Deployment

Push to `main` branch:
```bash
git add .
git commit -m "Configure for deployment"
git push origin main
```

The GitHub Action will automatically:
1. Install dependencies
2. Validate environment variables
3. Run type checking
4. Run linting
5. Build the Next.js app
6. Deploy to Azure Static Web Apps

### Monitor Deployment

1. Go to **GitHub** → **Actions** tab
2. Watch the **Azure Static Web Apps CI/CD** workflow
3. Check for any errors in the logs

---

## Step 4: Configure Custom Domain (Optional)

### Add Custom Domain

1. Go to Azure Portal → Your Static Web App
2. Navigate to **Custom domains**
3. Click **Add** → **Custom domain on other DNS**
4. Enter your domain name
5. Follow DNS configuration instructions

### Configure DNS

Add the following records to your DNS provider:

**For root domain:**
```
Type: A
Name: @
Value: [IP from Azure]
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: [your-app].azurestaticapps.net
```

---

## Step 5: Verify Deployment

### Check Application

1. Visit your Azure Static Web Apps URL
2. Verify authentication works (login flow)
3. Test creating timeline entries
4. Upload media files
5. Test AI features

### Check Logs

View deployment logs:
```bash
az staticwebapp logs show \
  --name cloud-timeline-app \
  --resource-group cloud-timeline-rg
```

---

## Troubleshooting

### Build Fails

**Error: Environment variables not set**
- Solution: Verify all GitHub secrets are added correctly

**Error: Type checking failed**
- Solution: Run `npm run type-check` locally and fix errors

### Deployment Succeeds but App Doesn't Work

**Authentication fails**
- Check `NEXTAUTH_URL` matches your actual URL
- Verify Azure AD redirect URIs include your deployment URL

**Database connection fails**
- Verify Cosmos DB firewall allows Azure services
- Check connection string is correct

**Media uploads fail**
- Verify Storage Account allows public access for blobs
- Check CORS settings on Storage Account

### Common Issues

| Issue | Solution |
|-------|----------|
| 404 errors on page refresh | Check `staticwebapp.config.json` navigation fallback |
| API routes not working | Verify API location in workflow is empty (Next.js handles this) |
| Images not loading | Check Azure Blob Storage CORS and access settings |
| Slow cold starts | Consider upgrading to Standard SKU for better performance |

---

## Rolling Back a Deployment

### Via GitHub

1. Go to **Actions** tab
2. Find the last successful deployment
3. Click **Re-run jobs**

### Via Azure CLI

```bash
# List deployments
az staticwebapp environment list \
  --name cloud-timeline-app \
  --resource-group cloud-timeline-rg

# Activate a previous deployment
az staticwebapp environment show \
  --name cloud-timeline-app \
  --resource-group cloud-timeline-rg \
  --environment-name [environment-name]
```

---

## Production Checklist

Before going to production:

- [ ] All environment variables configured in GitHub Secrets
- [ ] Custom domain configured with SSL
- [ ] Azure AD redirect URIs updated for production domain
- [ ] Cosmos DB firewall configured
- [ ] Storage Account CORS configured
- [ ] Error monitoring set up (consider Application Insights)
- [ ] Backup strategy for Cosmos DB
- [ ] Cost alerts configured in Azure
- [ ] Load testing completed
- [ ] Security headers verified

---

## Cost Optimization

- **Static Web Apps**: Free tier includes 100GB bandwidth/month
- **Cosmos DB**: Use autoscale with min 400 RU/s
- **Blob Storage**: Use cool tier for older media
- **Cognitive Services**: Monitor usage to stay in free tier limits

---

## Support

For issues:
1. Check Azure Status: https://status.azure.com
2. Review workflow logs in GitHub Actions
3. Check Azure Portal for service health

## Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Azure Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/best-practices)
