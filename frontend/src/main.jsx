import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
import RagApp from './RagApp.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RagApp/>
  </StrictMode>,
)
