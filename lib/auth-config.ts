import { Configuration } from '@azure/msal-browser'

const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || ''
const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || ''
const authorityEnv = process.env.NEXT_PUBLIC_AZURE_AUTHORITY || ''

// Build a safe default authority for Entra ID (non-B2C) if only tenantId is provided
// B2C users should provide the full b2clogin.com authority with user flow policy
const derivedAuthority = tenantId
  ? `https://login.microsoftonline.com/${tenantId}`
  : ''

const authority = authorityEnv && authorityEnv.startsWith('http')
  ? authorityEnv
  : derivedAuthority

if (!clientId || !authority) {
  // eslint-disable-next-line no-console
  console.warn('[Auth] Missing MSAL config. Set NEXT_PUBLIC_AZURE_CLIENT_ID and either NEXT_PUBLIC_AZURE_AUTHORITY or NEXT_PUBLIC_AZURE_TENANT_ID')
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = { scopes: ['openid', 'profile', 'email'] }
export const tokenRequest = { scopes: ['openid', 'profile', 'email'] }
