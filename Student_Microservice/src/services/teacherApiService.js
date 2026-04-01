const axios = require('axios');
const { TEACHER_SERVICE_URL } = require('../config/env');

const teacherApiService = {
  async verifyAssignmentExists(assignmentId) {
    try {
      const response = await axios.get(
        `${TEACHER_SERVICE_URL}/teachers/assignments/public/${assignmentId}`,
        {
          timeout: 5000
        }
      );

      if (response.data.success && response.data.data) {
        const { isActive } = response.data.data;
        return {
          exists: true,
          isActive: isActive,
          assignment: response.data.data
        };
      }

      return {
        exists: false,
        isActive: false,
        assignment: null
      };
    } catch (error) {
      console.error('Error verifying assignment:', error.message);
      return {
        exists: false,
        isActive: false,
        assignment: null,
        error: error.message
      };
    }
  }
};

module.exports = teacherApiService;
