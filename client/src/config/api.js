let API_URL;

if (process.env.NODE_ENV === 'production') {
  API_URL = '/api';
} else {
  API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
}

export default API_URL; 