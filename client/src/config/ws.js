const WS_URL = process.env.REACT_APP_WS_URL || 
  (window.location.protocol === 'https:' 
    ? 'wss://bitrix.mainserver.co.za' 
    : 'ws://bitrix.mainserver.co.za');

console.log('WebSocket URL:', WS_URL); // Add logging to help debug connection issues

export default WS_URL; 

let ok = "ok"