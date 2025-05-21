const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = (data && data.message) || response.statusText;
    throw new Error(error);
  }
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(response);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
};

export const registerUser = async (name, email, password) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await handleResponse(response);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
};

export const createInterview = async (questions) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_BASE_URL}/interviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ questions }),
  });
  return handleResponse(response);
};

export const deleteInterview = async (interviewId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      // No 'Content-Type' needed for DELETE if no body is sent
    },
  });
  return handleResponse(response); // Expects { message: 'Interview removed' }
};

export const updateInterview = async (interviewId, data) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getInterviews = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_BASE_URL}/interviews`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};

export const getInterviewById = async (interviewId) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
};
