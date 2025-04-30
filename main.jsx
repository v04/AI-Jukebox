import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatbotUI from './ChatbotUI.jsx'
import './index.css'

const container = document.getElementById('root')
const root = ReactDOM.createRoot(container)
root.render(
  <React.StrictMode>
    <ChatbotUI />
  </React.StrictMode>
)
