const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.hostname + (window.location.port ? ':' + window.location.port : ':5001');

export default WS_URL; 

let ok = "ok"