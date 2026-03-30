import axios from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    login: async (username: string, password: string) => {
        const response = await axios.post(`${API_BASE}/login`, { username, password });
        return response.data;
    },
    getFiles: async (folderId?: string, view: string = 'home') => {
        const response = await axios.get(`${API_BASE}/files`, { params: { folderId, view } });
        return response.data;
    },
    toggleStar: async (id: string, type: 'file' | 'folder') => {
        const response = await axios.post(`${API_BASE}/toggle-star`, { id, type });
        return response.data;
    },
    toggleDelete: async (id: string, type: 'file' | 'folder') => {
        const response = await axios.post(`${API_BASE}/toggle-delete`, { id, type });
        return response.data;
    },
    rename: async (id: string, type: 'file' | 'folder', newName: string) => {
        const response = await axios.post(`${API_BASE}/rename`, { id, type, newName });
        return response.data;
    },

    uploadFile: async (file: File, folderId?: string | null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) formData.append('folderId', folderId);
        const response = await axios.post(`${API_BASE}/upload`, formData);
        return response.data;
    },

    downloadFile: (fileId: string) => {
        const token = localStorage.getItem('token');
        window.open(`${API_BASE}/download/${fileId}?token=${token}`, '_blank');
    },

    createFolder: async (name: string, parentId?: string) => {
        const response = await axios.post(`${API_BASE}/folders`, { name, parentId });
        return response.data;
    },

    moveFile: async (fileId: string, folderId: string | null) => {
        const response = await axios.post(`${API_BASE}/move-file`, { fileId, folderId });
        return response.data;
    },

    getMe: async () => {
        const response = await axios.get(`${API_BASE}/me`);
        return response.data;
    },
    getSystemHealth: async () => {
        const response = await axios.get(`${API_BASE}/system/health`);
        return response.data;
    },

    getFileBlob: async (fileId: string) => {
        const response = await axios.get(`${API_BASE}/download/${fileId}`, { responseType: 'blob' });
        return response.data;
    },

    updateFolder: async (id: string, updates: { name?: string, color?: string }) => {
        const response = await axios.post(`${API_BASE}/update-folder`, { id, ...updates });
        return response.data;
    },

    deleteFolder: async (id: string) => {
        const response = await axios.post(`${API_BASE}/delete-folder`, { id });
        return response.data;
    },
};
