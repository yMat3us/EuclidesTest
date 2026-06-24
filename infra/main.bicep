@description('The name of the Azure Web App.')
param appName string = 'euclides-test-${uniqueString(resourceGroup().id)}'

@description('The location for all resources.')
param location string = resourceGroup().location

@description('The SKU of the App Service Plan.')
param sku string = 'F1' // Free tier. Change to 'B1' or higher for production.

@description('The admin token password for the teacher panel.')
@secure()
param adminToken string

@description('The Gemini API Key for the chatbot (optional).')
@secure()
param geminiApiKey string = ''

@description('The MongoDB URI for SQLite database backup sync (optional).')
@secure()
param mongodbUri string = ''

@description('The WhatsApp verify token for webhook verification (optional).')
@secure()
param whatsappVerifyToken string = ''

@description('The WhatsApp API Token / Key (optional).')
@secure()
param whatsappToken string = ''

@description('The WhatsApp admin number to receive notifications (optional).')
param whatsappAdminNumber string = ''

@description('The WhatsApp provider name (e.g. twilio, evolution, zapi, or empty for mock) (optional).')
param whatsappProvider string = ''

@description('The WhatsApp provider API URL (optional).')
param whatsappApiUrl string = ''

// Define the App Service Plan (Linux)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: sku
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux plans
  }
}

// Define the App Service Web App (Node.js 22 LTS on Linux)
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  kind: 'app'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'PORT'
          value: '3000'
        }
        {
          name: 'HOST'
          value: '0.0.0.0'
        }
        {
          name: 'DDM_ADMIN_TOKEN'
          value: adminToken
        }
        {
          name: 'GEMINI_API_KEY'
          value: geminiApiKey
        }
        {
          name: 'MONGODB_URI'
          value: mongodbUri
        }
        {
          name: 'WHATSAPP_VERIFY_TOKEN'
          value: whatsappVerifyToken
        }
        {
          name: 'WHATSAPP_TOKEN'
          value: whatsappToken
        }
        {
          name: 'WHATSAPP_API_KEY' // server uses both, let's inject both
          value: whatsappToken
        }
        {
          name: 'WHATSAPP_ADMIN_NUMBER'
          value: whatsappAdminNumber
        }
        {
          name: 'WHATSAPP_PROVIDER'
          value: whatsappProvider
        }
        {
          name: 'WHATSAPP_API_URL'
          value: whatsappApiUrl
        }
        {
          name: 'DDM_DATA_DIR'
          value: '/home/data' // Persistent path outside the app deployment folder
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
      ]
      alwaysOn: (sku != 'F1' && sku != 'D1') // AlwaysOn is not supported on Free/Shared plans
      use32BitWorkerProcess: false
      webSocketsEnabled: true
    }
  }
}

output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
