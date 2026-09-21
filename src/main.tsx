import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {PreferencesProvider} from './Preferences';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><PreferencesProvider><App/></PreferencesProvider></React.StrictMode>);
if('serviceWorker' in navigator && import.meta.env.PROD){window.addEventListener('load',()=>{navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`,{scope:import.meta.env.BASE_URL}).catch(()=>{});});}
