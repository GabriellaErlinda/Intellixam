import axios from 'axios';

// Base URL for your backend API
const API_URL = 'https://capstoneimg-343455652978.asia-southeast2.run.app/api'; // Your Flask backend URL

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or get from context/state
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor to handle token expiry globally if needed

export default apiClient;