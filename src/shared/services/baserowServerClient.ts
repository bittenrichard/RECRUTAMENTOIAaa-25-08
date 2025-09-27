// Local: src/shared/services/baserowServerClient.ts

import fetch, { HeadersInit, RequestInit } from 'node-fetch';
import FormData from 'form-data';

const BASE_URL = 'https://dados.focoserv.com.br/api/database/rows/table';
const FILE_UPLOAD_URL = 'https://dados.focoserv.com.br/api/user-files/upload-file/';

// Função para obter a API key dinamicamente
const getApiKey = (): string => {
  const apiKey = process.env.BASEROW_API_TOKEN || process.env.VITE_BASEROW_API_KEY;
  if (!apiKey) {
    throw new Error("A chave da API do Baserow (BASEROW_API_TOKEN ou VITE_BASEROW_API_KEY) não foi encontrada no ambiente do servidor.");
  }
  return apiKey;
};

const uploadFileRequestFromBuffer = async (fileBuffer: Buffer, fileName: string, mimetype: string) => {
  const apiKey = getApiKey(); // Obter chave dinamicamente

  const formData = new FormData();
  formData.append('file', fileBuffer, { filename: fileName, contentType: mimetype });

  const formHeaders = formData.getHeaders();
  const headers: HeadersInit = { 'Authorization': `Token ${apiKey}`, ...formHeaders };

  try {
    const response = await fetch(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Erro ${response.status} no upload de arquivo para Baserow (backend):`, errorData);
      throw new Error(`Falha no upload do arquivo (Status: ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('Falha na requisição de upload para o Baserow (backend):', error);
    throw error;
  }
};


const apiRequest = async (
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  tableId: string,
  path: string = '',
  body?: Record<string, unknown>
) => {
  const apiKey = getApiKey(); // Obter chave dinamicamente
  
  let finalUrl = `${BASE_URL}/${tableId}/${path}`;

  if (method === 'GET' || method === 'POST' || method === 'PATCH') {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}user_field_names=true`;
  }
  
  const headers: HeadersInit = { 'Authorization': `Token ${apiKey}` };
  if (body && (method === 'POST' || method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }
  
  const options: RequestInit = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(finalUrl, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Não foi possível ler o corpo do erro.' }));
      console.error(`--- ERRO DETALHADO DO BASEROW (Status: ${response.status}) ---:`, errorData);
      throw new Error(`Erro na comunicação com o banco de dados (Status: ${response.status})`);
    }
    if (method === 'DELETE' || response.status === 204) {
      return {}; 
    }
    return await response.json();
  } catch (error) {
    console.error('Falha na requisição para o Baserow a partir do servidor:', error);
    throw error;
  }
};

export const baserowServer = {
  get: (tableId: string, params: string = '') => apiRequest('GET', tableId, params),
  getRow: (tableId: string, rowId: number) => apiRequest('GET', tableId, `${rowId}/`),
  post: (tableId: string, data: Record<string, unknown>) => apiRequest('POST', tableId, ``, data),
  patch: (tableId: string, rowId: number, data: Record<string, unknown>) => apiRequest('PATCH', tableId, `${rowId}/`, data),
  delete: (tableId: string, rowId: number) => {
    console.log(`🗑️ Baserow DELETE - Table: ${tableId}, Row: ${rowId}`);
    return apiRequest('DELETE', tableId, `${rowId}/`);
  },
  uploadFileFromBuffer: uploadFileRequestFromBuffer,
};