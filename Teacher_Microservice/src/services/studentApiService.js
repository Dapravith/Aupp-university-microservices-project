const axios = require('axios');
const envConfig = require('../config/env');

const studentApiService = {
  searchStudents: async (query) => {
    try {
      const response = await axios.get(
        `${envConfig.STUDENT_SERVICE_URL}/students/search`,
        {
          params: { q: query }
        }
      );

      return response.data.data || [];
    } catch (err) {
      console.error('Error searching students:', err.message);
      throw new Error('Failed to search students');
    }
  },

  getSubmissionDetails: async (submissionId) => {
    try {
      const response = await axios.get(
        `${envConfig.STUDENT_SERVICE_URL}/students/internal/${submissionId}`
      );

      return response.data.data;
    } catch (err) {
      console.error('Error getting submission details:', err.message);
      throw new Error('Failed to get submission details');
    }
  },

  updateSubmissionReview: async (submissionId, reviewData) => {
    try {
      const response = await axios.patch(
        `${envConfig.STUDENT_SERVICE_URL}/students/internal/${submissionId}/review`,
        {
          score: reviewData.score,
          feedback: reviewData.feedback,
          status: 'reviewed'
        }
      );

      return response.data.data;
    } catch (err) {
      console.error('Error updating submission review:', err.message);
      throw new Error('Failed to update submission review');
    }
  }
};

module.exports = studentApiService;
