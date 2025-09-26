"use strict";
// Local: src/shared/services/baserowServerClient.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.baserowServer = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
const BASE_URL = 'https://dados.focoserv.com.br/api/database/rows/table';
const FILE_UPLOAD_URL = 'https://dados.focoserv.com.br/api/user-files/upload-file/';
const API_KEY = process.env.BASEROW_API_TOKEN || process.env.VITE_BASEROW_API_KEY;
const uploadFileRequestFromBuffer = async (fileBuffer, fileName, mimetype) => {
    if (!API_KEY) {
        throw new Error("A chave da API do Baserow (BASEROW_API_TOKEN ou VITE_BASEROW_API_KEY) não foi encontrada no ambiente do servidor.");
    }
    const formData = new form_data_1.default();
    formData.append('file', fileBuffer, { filename: fileName, contentType: mimetype });
    const formHeaders = formData.getHeaders();
    const headers = { 'Authorization': `Token ${API_KEY}`, ...formHeaders };
    try {
        const response = await (0, node_fetch_1.default)(FILE_UPLOAD_URL, {
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
    }
    catch (error) {
        console.error('Falha na requisição de upload para o Baserow (backend):', error);
        throw error;
    }
};
const apiRequest = async (method, tableId, path = '', body) => {
    if (!API_KEY) {
        const errorMessage = "A chave da API do Baserow (BASEROW_API_TOKEN ou VITE_BASEROW_API_KEY) não foi encontrada no ambiente do servidor.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    let finalUrl = `${BASE_URL}/${tableId}/${path}`;
    if (method === 'GET' || method === 'POST' || method === 'PATCH') {
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += `${separator}user_field_names=true`;
    }
    const headers = { 'Authorization': `Token ${API_KEY}` };
    if (body && (method === 'POST' || method === 'PATCH')) {
        headers['Content-Type'] = 'application/json';
    }
    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }
    try {
        const response = await (0, node_fetch_1.default)(finalUrl, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Não foi possível ler o corpo do erro.' }));
            console.error(`--- ERRO DETALHADO DO BASEROW (Status: ${response.status}) ---:`, errorData);
            throw new Error(`Erro na comunicação com o banco de dados (Status: ${response.status})`);
        }
        if (method === 'DELETE' || response.status === 204) {
            return {};
        }
        return await response.json();
    }
    catch (error) {
        console.error('Falha na requisição para o Baserow a partir do servidor:', error);
        throw error;
    }
};
exports.baserowServer = {
    get: (tableId, params = '') => apiRequest('GET', tableId, params),
    getRow: (tableId, rowId) => apiRequest('GET', tableId, `${rowId}/`),
    post: (tableId, data) => apiRequest('POST', tableId, ``, data),
    patch: (tableId, rowId, data) => apiRequest('PATCH', tableId, `${rowId}/`, data),
    delete: (tableId, rowId) => {
        console.log(`🗑️ Baserow DELETE - Table: ${tableId}, Row: ${rowId}`);
        return apiRequest('DELETE', tableId, `${rowId}/`);
    },
    uploadFileFromBuffer: uploadFileRequestFromBuffer,
};
