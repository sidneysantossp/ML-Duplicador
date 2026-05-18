import axios from 'axios';

export interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export const MLService = {
  // Troca o código pelo token via backend
  exchangeCode: async (code: string, appId: string, clientSecret: string, redirectUri: string): Promise<MLTokenResponse> => {
    const response = await axios.post('/api/ml/auth', {
      code,
      appId,
      clientSecret,
      redirectUri
    });
    return response.data;
  },

  // Atualiza um item (status, preço, etc)
  updateItem: async (itemId: string, data: any, accessToken: string) => {
    const response = await axios.put(`/api/ml/items/${itemId}`, data, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca anúncios reais do usuário com filtros
  getProducts: async (accessToken: string, userId: number, status?: string, q?: string, offset: number = 0, limit: number = 20) => {
    const response = await axios.get(`/api/ml/items/search`, {
      params: { 
        userId, 
        accessToken,
        status: status === 'all' ? undefined : status,
        q,
        offset,
        limit
      }
    });
    return response.data;
  },

  // Busca detalhes de vários itens (Multiget)
  getItems: async (itemIds: string[], accessToken: string) => {
    const ids = itemIds.join(',');
    const response = await axios.get(`/api/ml/items`, {
      params: { ids, accessToken }
    });
    return response.data; // This returns an array of objects like { code: 200, body: { ... } }
  },

  // Busca detalhes de um item
  getItemDetails: async (itemId: string, accessToken: string) => {
    const response = await axios.get(`/api/ml/items/${itemId}`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca descrição de um item
  getItemDescription: async (itemId: string, accessToken: string) => {
    const response = await axios.get(`/api/ml/items/${itemId}/description`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca pedidos (Orders)
  getOrders: async (userId: number, accessToken: string) => {
    const response = await axios.get(`/api/ml/orders/search`, {
      params: { userId, accessToken }
    });
    return response.data;
  },

  // Busca detalhes de um pedido
  getOrderDetails: async (orderId: string, accessToken: string) => {
    const response = await axios.get(`/api/ml/orders/${orderId}`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca detalhes de envio
  getShipmentDetails: async (shipmentId: string, accessToken: string) => {
    const response = await axios.get(`/api/ml/shipments/${shipmentId}`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca URL da etiqueta
  getShipmentLabel: async (shipmentId: string, accessToken: string) => {
    const response = await axios.get(`/api/ml/shipments/${shipmentId}/labels`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Busca mensagens de um pedido
  getMessages: async (orderId: string, accessToken: string, sellerId: number) => {
    const response = await axios.get(`/api/ml/orders/${orderId}/messages`, {
      params: { accessToken, sellerId }
    });
    return response.data;
  },

  // Envia uma mensagem
  sendMessage: async (orderId: string, accessToken: string, sellerId: number, buyerId: number, text: string) => {
    const response = await axios.post(`/api/ml/orders/${orderId}/messages`, { text }, {
      params: { accessToken, sellerId, buyerId }
    });
    return response.data;
  },

  // Busca detalhes do usuário logado
  getMe: async (accessToken: string) => {
    const response = await axios.get(`/api/ml/me`, {
      params: { accessToken }
    });
    return response.data;
  },

  // Efetua a duplicação via Backend
  duplicateItem: async (itemId: string, accessToken: string, mods?: any) => {
    const response = await axios.post('/api/ml/duplicate', {
      itemId,
      accessToken,
      mods
    });
    return response.data;
  },

  // Atualiza o token usando o refresh token
  refreshToken: async (refreshToken: string, appId: string, clientSecret: string): Promise<MLTokenResponse> => {
    const response = await axios.post('/api/ml/refresh', {
      refreshToken,
      appId,
      clientSecret
    });
    return response.data;
  }
};
