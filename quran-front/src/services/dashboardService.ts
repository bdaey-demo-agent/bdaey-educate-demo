import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { StudentDashboardData } from '../types/dashboard';

const dashboardService = {
    getStudentDashboard: async (): Promise<StudentDashboardData> => {
        const token = localStorage.getItem('token');
        const response = await axios.get<StudentDashboardData>(`${API_BASE_URL}/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default dashboardService;
