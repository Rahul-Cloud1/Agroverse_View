// API Configuration
const API_CONFIG = {
  // Local backend for development
  BASE_URL: 'http://localhost:5000',
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
    },
    EQUIPMENT: '/api/equipment',
    PRODUCTS: '/api/products',
    PRODUCTSB2C: '/api/productsb2c',
    RENT_REQUESTS: '/api/rent-requests',
    PRODUCT_REQUESTS: '/api/product-requests',
    ORDERS: '/api/orders',
    UPLOAD: '/api/upload',
  }
};

export default API_CONFIG;