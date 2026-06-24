#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
RESOURCE_GROUP="rg-euclides-test"
LOCATION="eastus"
DEPLOYMENT_NAME="euclides-deployment-$(date +%Y%m%d%H%M%S)"

echo "====================================================="
echo "   Deploying Euclides Test Infrastructure to Azure   "
echo "====================================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI (az) is not installed."
    echo "Please install it first: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Ensure user is logged in
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "You are not logged in. Redirecting to browser login..."
    az login
fi

# Create resource group if it doesn't exist
echo "Ensuring resource group '${RESOURCE_GROUP}' exists in region '${LOCATION}'..."
az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}" --output table

# Read secure parameters
read -r -p "Enter DDM_ADMIN_TOKEN (admin panel password): " adminToken
if [ -z "$adminToken" ]; then
    echo "Error: DDM_ADMIN_TOKEN cannot be empty."
    exit 1
fi

read -r -p "Enter GEMINI_API_KEY (optional, press Enter to skip): " geminiApiKey
read -r -p "Enter GEMINI_MODEL (optional, defaults to gemini-3.5-flash): " geminiModel
if [ -z "$geminiModel" ]; then
    geminiModel="gemini-3.5-flash"
fi
read -r -p "Enter MONGODB_URI (optional connection string for MongoDB backups, press Enter to skip): " mongodbUri
read -r -p "Enter WHATSAPP_VERIFY_TOKEN (optional webhook verify token, press Enter to skip): " whatsappVerifyToken
read -r -p "Enter WHATSAPP_TOKEN / API KEY (optional WhatsApp credential, press Enter to skip): " whatsappToken
read -r -p "Enter WHATSAPP_ADMIN_NUMBER (optional admin phone number, press Enter to skip): " whatsappAdminNumber
read -r -p "Enter WHATSAPP_PROVIDER (optional: twilio, evolution, zapi, press Enter to skip): " whatsappProvider
read -r -p "Enter WHATSAPP_API_URL (optional endpoint for WhatsApp sending, press Enter to skip): " whatsappApiUrl
read -r -p "Enter TWILIO_ACCOUNT_SID (optional, required if provider is twilio): " twilioAccountSid
read -r -p "Enter TWILIO_AUTH_TOKEN (secure, optional, required if provider is twilio): " twilioAuthToken
read -r -p "Enter TWILIO_PHONE_NUMBER (optional, required if provider is twilio): " twilioPhoneNumber

echo "Deploying Bicep template..."
az deployment group create \
  --name "${DEPLOYMENT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file ./main.bicep \
  --parameters \
    adminToken="${adminToken}" \
    geminiApiKey="${geminiApiKey}" \
    geminiModel="${geminiModel}" \
    mongodbUri="${mongodbUri}" \
    whatsappVerifyToken="${whatsappVerifyToken}" \
    whatsappToken="${whatsappToken}" \
    whatsappAdminNumber="${whatsappAdminNumber}" \
    whatsappProvider="${whatsappProvider}" \
    whatsappApiUrl="${whatsappApiUrl}" \
    twilioAccountSid="${twilioAccountSid}" \
    twilioAuthToken="${twilioAuthToken}" \
    twilioPhoneNumber="${twilioPhoneNumber}" \
  --output table

echo "Deployment completed successfully!"
echo "====================================================="
echo "Note: Copy your Azure Web App name from the output above"
echo "and update the 'AZURE_WEBAPP_NAME' variable in:"
echo "  .github/workflows/azure-deploy.yml"
echo "====================================================="
