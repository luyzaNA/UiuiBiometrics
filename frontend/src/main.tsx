import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {AuthProvider} from "react-oidc-context";

const cognitoAuthConfig = {
    authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_aBOOx7l1A",
    client_id: "3a7gjc7aq8v5auneeuqtfvcb1a",
    redirect_uri: "http://localhost:5173",
    response_type: "code",
    scope: "email openid phone",
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider {...cognitoAuthConfig}>
      <App />
      </AuthProvider>
  </StrictMode>,
)
