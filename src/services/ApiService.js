import axios from 'axios';
import AuthService from './AuthService';

const API_URL = 'http://localhost:5000/api';

class ApiService {
  // Set auth header
  setAuthHeader() {
    return {
      headers: {
        Authorization: `Bearer ${AuthService.getToken()}`
      }
    };
  }

  // Analyze face image
  async analyzeFace(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await axios.post(
        `${API_URL}/analyze-face`,
        formData,
        {
          ...this.setAuthHeader(),
          headers: {
            ...this.setAuthHeader().headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  async analyzeVideo(videoFormData, progressCallback = null) {
    try {
      const response = await axios.post(
        `${API_URL}/video/analyze-video`,
        videoFormData,
        {
          ...this.setAuthHeader(),
          headers: {
            ...this.setAuthHeader().headers,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: progressCallback
            ? progressEvent => {
              progressCallback(progressEvent);
            }
            : null
        }
      );

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }

  // Check API status
  async checkStatus() {
    try {
      const response = await axios.get(`${API_URL}/status`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { error: 'Network error' };
    }
  }
}

export default new ApiService();