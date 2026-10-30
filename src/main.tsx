import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import LicenseGate from './licensing/LicenseGate';

createRoot(document.getElementById('root')!).render(<LicenseGate><App /></LicenseGate>);
