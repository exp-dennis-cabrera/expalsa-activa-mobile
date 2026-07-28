import { getApiClient } from './client';

export interface Comment {
  id: number;
  content: string;
  authorId: number | null;
  authorName: string | null;
  createdAt: string;
  files: WorkOrderFile[];
}

export interface Task {
  id: number;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'CHECKBOX' | 'METER';
  orderIndex: number;
  value: string | null;
  completed: boolean;
}

export interface TimeLog {
  id: number;
  userId: number | null;
  userName: string | null;
  hours: number;
  logDate: string | null;
  cost: number | null;
  running: boolean;
  startedAt: string | null;
  createdAt: string;
}

export interface AdditionalCost {
  id: number;
  description: string;
  cost: number;
  category: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
}

export interface WorkOrderFile {
  id: number;
  fileName: string;
  downloadUrl: string;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface WorkOrderLink {
  linkId: number;
  workOrderId: number;
  title: string;
  status: string;
}

export const workOrderExtrasApi = {
  // Comentarios
  getComments: async (workOrderId: number): Promise<Comment[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/comments`);
    return data;
  },
  addComment: async (workOrderId: number, content: string, fileIds?: number[]): Promise<Comment> => {
    const client = await getApiClient();
    const { data } = await client.post(`/work-orders/${workOrderId}/comments`, { content, fileIds });
    return data;
  },

  // Tareas
  getTasks: async (workOrderId: number): Promise<Task[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/tasks`);
    return data;
  },
  updateTask: async (taskId: number, value: { value?: string; completed?: boolean }): Promise<Task> => {
    const client = await getApiClient();
    const { data } = await client.patch(`/tasks/${taskId}`, value);
    return data;
  },

  // Cronómetro y tiempo
  getTimeLogs: async (workOrderId: number): Promise<TimeLog[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/time-logs`);
    return data;
  },
  startTimer: async (workOrderId: number): Promise<TimeLog> => {
    const client = await getApiClient();
    const { data } = await client.post(`/work-orders/${workOrderId}/timer/start`);
    return data;
  },
  stopTimer: async (workOrderId: number): Promise<TimeLog> => {
    const client = await getApiClient();
    const { data } = await client.post(`/work-orders/${workOrderId}/timer/stop`);
    return data;
  },

  // Costos adicionales
  getCosts: async (workOrderId: number): Promise<AdditionalCost[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/costs`);
    return data;
  },
  addCost: async (workOrderId: number, description: string, cost: number): Promise<AdditionalCost> => {
    const client = await getApiClient();
    const { data } = await client.post(`/work-orders/${workOrderId}/costs`, { description, cost });
    return data;
  },

  // Archivos adjuntos
  getFiles: async (workOrderId: number): Promise<WorkOrderFile[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/files`);
    return data;
  },
  uploadFile: async (workOrderId: number, file: { uri: string; name: string; mimeType: string }): Promise<WorkOrderFile> => {
    const client = await getApiClient();
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
    const { data } = await client.post(`/work-orders/${workOrderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteFile: async (workOrderId: number, fileId: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/work-orders/${workOrderId}/files/${fileId}`);
  },

  // Vinculos a otras ordenes de trabajo
  getLinks: async (workOrderId: number): Promise<WorkOrderLink[]> => {
    const client = await getApiClient();
    const { data } = await client.get(`/work-orders/${workOrderId}/links`);
    return data;
  },
  addLink: async (workOrderId: number, linkedWorkOrderId: number): Promise<WorkOrderLink> => {
    const client = await getApiClient();
    const { data } = await client.post(`/work-orders/${workOrderId}/links`, { linkedWorkOrderId });
    return data;
  },
  removeLink: async (workOrderId: number, linkId: number): Promise<void> => {
    const client = await getApiClient();
    await client.delete(`/work-orders/${workOrderId}/links/${linkId}`);
  },
};
