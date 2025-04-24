import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

axios.defaults.withCredentials = true;

class AuthService {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (response.data.access_token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  async register(username, email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Get current user
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  // Get user's token
  getToken() {
    return localStorage.getItem('access_token');
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken();
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await axios.get(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  // Get user history
  async getUserHistory() {
    try {
      const response = await axios.get(`${API_URL}/user/history`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }
}

export default new AuthService();