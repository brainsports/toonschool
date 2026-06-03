import { BrowserRouter } from 'react-router-dom'
import AppRouter from './router'
import { AuthProvider } from '../shared/contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  )
}
