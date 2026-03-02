import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('App starting...');

try {
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
  console.log('App rendered successfully');
} catch (e) {
  console.error('App render failed:', e);
}
