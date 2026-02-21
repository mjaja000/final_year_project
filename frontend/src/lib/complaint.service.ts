/**
 * ComplaintService - Handles all feedback/complaint API calls to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log('[ComplaintService] Initialized with API_BASE_URL:', API_BASE_URL);

// Types
export interface CreateComplaintPayload {
  routeId: number;
  vehicleId: number;
  feedbackType: 'Complaint' | 'Compliment';
  comment: string;
  phoneNumber?: string;
}

export interface ComplaintResponse {
  id: number;
  user_id: string | null;
  route_id: number;
  vehicle_id: number;
  feedback_type: string;
  comment: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SubmitComplaintResponse {
  message: string;
  feedback: ComplaintResponse;
  notificationsSent: {
    sms: boolean;
    whatsapp: boolean;
  };
}

export interface FeedbackListResponse {
  message?: string;
  feedback?: ComplaintResponse[];
  [key: string]: any;
}

class ComplaintService {
  /**
   * Submit a new complaint/feedback
   */
  static async submitComplaint(payload: CreateComplaintPayload): Promise<SubmitComplaintResponse> {
    const endpoint = '/api/feedback';
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('[ComplaintService] Submitting complaint...');
    console.log('[ComplaintService] URL:', url);
    console.log('[ComplaintService] Payload:', payload);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[ComplaintService] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ComplaintService] HTTP error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('[ComplaintService] Content-Type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const data = await response.json();
      console.log('[ComplaintService] Success! Response data:', data);
      return data;
    } catch (error: any) {
      console.error('[ComplaintService] Error submitting complaint:', {
        message: error.message,
        stack: error.stack,
        url,
      });
      throw error;
    }
  }

  /**
   * Get all public complaints/feedback
   */
  static async getAllComplaints(): Promise<ComplaintResponse[]> {
    const endpoint = '/api/feedback';
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('[ComplaintService] Fetching all complaints...');
    console.log('[ComplaintService] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[ComplaintService] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FeedbackListResponse = await response.json();
      const complaints = Array.isArray(data) ? data : (data.feedback || []);

      console.log('[ComplaintService] Fetched complaints:', complaints.length, 'items');
      return complaints;
    } catch (error: any) {
      console.error('[ComplaintService] Error fetching complaints:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific complaint by ID
   */
  static async getComplaintById(id: number): Promise<ComplaintResponse> {
    const endpoint = `/api/feedback/${id}`;
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('[ComplaintService] Fetching complaint ID:', id);
    console.log('[ComplaintService] URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[ComplaintService] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ComplaintService] Fetched complaint:', data);
      return data;
    } catch (error: any) {
      console.error('[ComplaintService] Error fetching complaint:', error.message);
      throw error;
    }
  }

  /**
   * Test connection to backend
   */
  static async testConnection(): Promise<boolean> {
    const healthUrl = `${API_BASE_URL}/health`;

    console.log('[ComplaintService] Testing connection to:', healthUrl);

    try {
      const response = await fetch(healthUrl);
      const isHealthy = response.ok;
      console.log('[ComplaintService] Connection test result:', isHealthy ? 'CONNECTED' : 'FAILED');
      return isHealthy;
    } catch (error: any) {
      console.error('[ComplaintService] Connection test failed:', error.message);
      return false;
    }
  }
}

export default ComplaintService;
