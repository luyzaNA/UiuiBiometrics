import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {AuthProvider, type AuthProviderProps} from "react-oidc-context";

const cognitoAuthConfig: AuthProviderProps = {
    authority: import.meta.env.VITE_COGNITO_AUTHORITY,
    client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,

    response_type: "code",
    scope: "email openid phone profile",
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider {...cognitoAuthConfig}>
      <App />
      </AuthProvider>
  </StrictMode>,
)
