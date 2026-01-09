import './App.css'

// Layout
import { useSocket } from './hooks/useSocket';
import { BrowserRouter, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();
  useSocket();
  return (
    <>
      <BrowserRouter>
        <Routes>

        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App
