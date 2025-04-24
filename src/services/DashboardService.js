import axios from 'axios';
import AuthService from './AuthService';

const API_URL = 'http://localhost:5000/api';

class DashboardService {
  // Set auth header
  setAuthHeader() {
    return {
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`
      }
    };
  }

  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await axios.get(
        `${API_URL}/dashboard/stats`, 
        this.setAuthHeader()
      );
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  // Get recent analyses
  async getRecentAnalyses() {
    try {
      const response = await axios.get(
        `${API_URL}/dashboard/recent`,
        this.setAuthHeader()
      );
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }
}

export default new DashboardService();