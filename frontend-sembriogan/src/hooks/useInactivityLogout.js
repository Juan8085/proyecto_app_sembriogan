import { useEffect } from 'react';

export default function useInactivityLogout(timeoutMinutes = 15) {
  useEffect(() => {
    let timeoutId;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const performLogout = (showAlert = false) => {
        localStorage.removeItem('clienteSembriogan');
        localStorage.removeItem('tokenSembriogan');
        localStorage.removeItem('usuarioSembriogan');
        localStorage.removeItem('tokenVetSembriogan');
        localStorage.removeItem('datosVetSembriogan');
        localStorage.removeItem('lastActivitySembriogan');
        
        if (showAlert) {
            alert('Tu sesión ha expirado por inactividad.');
        }
        
        window.location.href = '/';
    };

    const checkInitialActivity = () => {
        const lastActivity = localStorage.getItem('lastActivitySembriogan');
        const hasSession = localStorage.getItem('clienteSembriogan') || localStorage.getItem('tokenSembriogan');
        
        if (hasSession) {
            if (!lastActivity) {
                // Si hay sesión pero no hay registro de actividad (ej. de ayer), la cerramos por seguridad.
                performLogout(false);
            } else if (Date.now() - parseInt(lastActivity, 10) > timeoutMs) {
                // Si el tiempo expiró mientras la pestaña estaba cerrada
                performLogout(true);
            }
        }
    };

    const resetTimer = () => {
      // Actualizamos el timestamp en localstorage para que persista si cierran la pestaña
      localStorage.setItem('lastActivitySembriogan', Date.now().toString());
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        performLogout(true);
      }, timeoutMs);
    };

    // 1. Comprobar al instante si la sesión ya caducó mientras el navegador estuvo cerrado
    checkInitialActivity();

    // 2. Si pasó la prueba, iniciamos el temporizador
    resetTimer();

    // 3. Eventos que reinician el temporizador y el timestamp
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    const handleEvent = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleEvent));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [timeoutMinutes]);
}

