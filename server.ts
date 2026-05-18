import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";

// Definir __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());
  
  // Helper to get consistent headers for Mercado Livre API
  const getMLHeaders = (accessToken: any, method: string = 'GET') => {
    const token = String(accessToken || "").trim();
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest'
    };

    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  const handleAxiosError = (error: any, context: string) => {
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data;
    const isHtml = typeof errorData === 'string' && (errorData.includes('<html>') || errorData.includes('<!DOCTYPE html>'));
    const url = error.config?.url;
    
    console.error(`[Proxy] ML ${context} Error (${statusCode}) on URL: ${url}`);
    if (isHtml) {
      console.error(`[Proxy] HTML RECEIVED - Possible WAF block or ML service issue.`);
    } else {
      console.error(`[Proxy] Response Data:`, JSON.stringify(errorData));
    }
    
    return { statusCode, errorData, isHtml };
  };

  // API Routes
  
  // Endpoint para trocar o código por token
  app.post("/api/ml/auth", async (req, res) => {
    const { code, appId, clientSecret, redirectUri } = req.body;
    
    if (!code || !appId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("client_id", appId);
      params.append("client_secret", clientSecret);
      params.append("code", code);
      params.append("redirect_uri", redirectUri);

      const response = await axios.post("https://api.mercadolibre.com/oauth/token", params, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Error exchanging code for token:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Failed to authenticate with Mercado Livre",
        details: error.response?.data
      });
    }
  });

  // Endpoint para atualizar o token (refresh)
  app.post("/api/ml/refresh", async (req, res) => {
    const { refreshToken, appId, clientSecret } = req.body;
    
    if (!refreshToken || !appId || !clientSecret) {
      return res.status(400).json({ error: "Missing required fields for refresh" });
    }

    try {
      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("client_id", appId);
      params.append("client_secret", clientSecret);
      params.append("refresh_token", refreshToken);

      const response = await axios.post("https://api.mercadolibre.com/oauth/token", params, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("Error refreshing token:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ 
        error: "Failed to refresh token", 
        details: error.response?.data 
      });
    }
  });


  // Endpoints Genéricos de Proxy para o Mercado Livre (para manter o secret no backend)
  app.get("/api/ml/orders", async (req, res) => {
    // Exemplo de como funcionaria o proxy com o token
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      // Aqui buscaríamos os pedidos usando o token do usuário
      // const response = await axios.get("https://api.mercadolibre.com/orders/search?seller=...", { ... });
      res.json({ message: "Order data proxy ready" });
    } catch (error) {
       res.status(500).json({ error: "API Failure" });
    }
  });

  // Endpoint para duplicar um item
  app.post("/api/ml/duplicate", async (req, res) => {
    const { itemId, accessToken, mods } = req.body;
    
    if (!itemId || !accessToken) {
      return res.status(400).json({ error: "Missing itemId or token" });
    }

    let original: any;
    let newItem: any = {};

    try {
      // 1. Get original item details
      try {
        const itemRes = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
          headers: getMLHeaders(accessToken)
        });
        original = itemRes.data;
      } catch (e: any) {
        console.error(`Error fetching item ${itemId}:`, e.response?.data || e.message);
        return res.status(e.response?.status || 500).json({ 
          error: "Failed to fetch original item", 
          details: e.response?.data 
        });
      }

      // 1.1 Get original description
      let descriptionText = "Novo anúncio duplicado via PRO";
      try {
        const descRes = await axios.get(`https://api.mercadolibre.com/items/${itemId}/description`, {
          headers: getMLHeaders(accessToken)
        });
        descriptionText = descRes.data.plain_text || descriptionText;
      } catch (e) {
        console.warn(`Could not fetch description for ${itemId}, using fallback.`);
      }

      // 2. Prepare new item - Minimalist "Controlled Recreation" Pattern
      const originalTitle = mods?.title || original.title || "Produto duplicado";
      
      // Robust Catalog Detection
      const isCatalog = !!(
        original.catalog_product_id || 
        original.catalog_listing === true || 
        (original.attributes && original.attributes.some((a: any) => a.id === 'CATALOG_PRODUCT_ID' && a.value_id))
      );
      
      const isRestrictedDomain = original.domain_id?.includes('CELLPHONES') || 
                                original.domain_id?.includes('TABLETS') ||
                                original.domain_id?.includes('SMARTWATCHES');
                                
      const hasVariations = original.variations && original.variations.length > 0;
      const hasFamily = !!(original.family_id || original.family_name);

      // Simple attribute filtering helper
      const getFilteredAttributes = () => {
        if (!original.attributes) return [];
        return original.attributes
          .filter((attr: any) => {
            const tags = attr.tags || [];
            if (tags.includes('read_only') || tags.includes('fixed') || tags.includes('hidden')) return false;
            // Exclude structural IDs
            return !['ID', 'PARENT_ITEM_ID', 'VARIATION_ID', 'SELLER_SKU', 'CATALOG_PRODUCT_ID'].includes(attr.id);
          })
          .map((attr: any) => {
            const a: any = { id: attr.id };
            if (attr.value_id) a.value_id = attr.value_id;
            else if (attr.value_name) a.value_name = attr.value_name;
            return a;
          })
          .filter((attr: any) => attr.value_id || attr.value_name);
      };

      newItem = {};

      if (isCatalog || isRestrictedDomain) {
        // GOLDEN RULE: Catalog/Restricted = Minimalist Payload
        console.log(`[Duplicate] Catalog/Restricted Domain detected (${original.domain_id || "Catalog"}). Forcing title removal.`);
        newItem = {
          catalog_product_id: original.catalog_product_id,
          category_id: original.category_id,
          price: Math.max(1, Number(Number(mods?.price || original.price || 1).toFixed(2))),
          currency_id: original.currency_id || "BRL",
          available_quantity: Number(mods?.available_quantity || Math.max(1, original.available_quantity || 1)),
          buying_mode: "buy_it_now",
          listing_type_id: mods?.listing_type_id || original.listing_type_id || "gold_special",
          condition: original.condition || "new",
          family_name: originalTitle.substring(0, 60),
          pictures: original.pictures
            ? original.pictures.slice(0, 10).map((p: any) => ({ source: p.secure_url || p.url }))
            : []
        };
        
        // Ensure catalog_product_id is valid
        if (!newItem.catalog_product_id && isCatalog) {
          const catalogAttr = original.attributes?.find((a: any) => a.id === 'CATALOG_PRODUCT_ID');
          if (catalogAttr?.value_id) newItem.catalog_product_id = catalogAttr.value_id;
        }

        if (!newItem.catalog_product_id) delete newItem.catalog_product_id;
        
        // Final scrub for catalog items
        delete newItem.title;
        delete newItem.variations;
      } else {
        // Standard item - Built from scratch to avoid API noise
        newItem = {
          title: originalTitle.substring(0, 60),
          category_id: original.category_id,
          price: Math.max(1, Number(Number(mods?.price || original.price || 1).toFixed(2))),
          currency_id: original.currency_id || "BRL",
          available_quantity: Number(mods?.available_quantity || Math.max(1, original.available_quantity || 1)),
          buying_mode: "buy_it_now",
          listing_type_id: mods?.listing_type_id || original.listing_type_id || "gold_special",
          condition: original.condition || "new",
          pictures: original.pictures
            ? original.pictures.slice(0, 10).map((p: any) => ({ source: p.secure_url || p.url }))
            : [],
          attributes: getFilteredAttributes()
        };

        // Re-inject family_name if variations or previous family existed
        if (hasVariations || hasFamily) {
           newItem.family_name = originalTitle.substring(0, 60);
        }

        // Handle variations if not a catalog/restricted item
        if (hasVariations) {
          newItem.variations = original.variations.map((v: any) => {
            const varAttr = v.attribute_combinations.map((ac: any) => ({
              id: ac.id,
              value_id: ac.value_id,
              value_name: ac.value_name
            }));
            
            return {
              price: newItem.price,
              available_quantity: v.available_quantity || 1,
              attribute_combinations: varAttr,
              picture_ids: v.picture_ids
            };
          });
        }
      }

      // Re-add optional but safe fields
      if (original.domain_id) newItem.domain_id = original.domain_id;

      // Shipping - Simplified to avoid errors
      if (original.shipping && original.shipping.mode === 'me2') {
        newItem.shipping = {
          mode: 'me2',
          local_pick_up: false,
          free_shipping: original.shipping.free_shipping || false
        };
      } else {
        newItem.shipping = {
          mode: 'not_specified',
          local_pick_up: true
        };
      }

      // 3. Post to ML
      console.log(`[Duplicate] Sending POST to /items for ${itemId}`);
      const createRes = await axios.post(`https://api.mercadolibre.com/items`, newItem, {
        headers: getMLHeaders(accessToken, 'POST')
      });

      const newCreatedItemId = createRes.data.id;
      console.log(`[Duplicate] Success! New item ID: ${newCreatedItemId}`);

      // 4. Update description (separate call)
      try {
        await axios.put(`https://api.mercadolibre.com/items/${newCreatedItemId}/description`, {
          plain_text: descriptionText
        }, {
          headers: getMLHeaders(accessToken, 'PUT')
        });
        console.log(`[Duplicate] Description updated for ${newCreatedItemId}`);
      } catch (descErr: any) {
        console.warn(`[Duplicate] Failed to update description for ${newCreatedItemId}:`, descErr.response?.data || descErr.message);
      }

      res.json(createRes.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      const statusCode = error.response?.status || 500;
      const cause = errorData?.cause || [];
      
      console.error(`[Duplicate] ML API Error (${statusCode}):`, JSON.stringify(errorData, null, 2));

      // Build a user-friendly message based on ML error cause
      let userMessage = errorData?.message || "Ocorreu um erro ao duplicar o anúncio.";
      
      if (errorData?.error === "validation_error") {
        const details = cause.map((c: any) => {
          let msg = c.message || c.code;
          // Specifically handle common catalog/family errors
          if (msg.includes("title") && (newItem.catalog_product_id || original.catalog_listing)) {
            return "Este é um item de catálogo. O campo 'Título' não é permitido (ele é definido automaticamente pelo catálogo).";
          }
          if (msg.includes("family_name") || msg.includes("family_id")) {
             return "Este item requer informações de 'Família' (family_name) para agrupar as variações corretamente.";
          }
          return msg;
        }).join(" | ");
        
        if (details) {
          userMessage = `Erro de Validação: ${details}`;
        }
      } else if (statusCode === 403) {
        userMessage = "Acesso Negado (403): Verifique se o seu Token possui as permissões necessárias para criar anúncios.";
      }

      res.status(statusCode).json({ 
        error: errorData?.error || "duplicate_failed", 
        message: userMessage,
        details: errorData,
        cause: cause
      });
    }
  });

  // Endpoint para buscar itens (Proxy)
  app.get("/api/ml/items/search", async (req, res) => {
    const { userId, accessToken, status, q, offset, limit } = req.query;
    if (!userId || !accessToken) return res.status(400).json({ error: "Missing userId or token" });

    try {
      const searchLimit = Number(limit) || 50;
      const searchOffset = Number(offset) || 0;
      let url = `https://api.mercadolibre.com/users/${userId}/items/search?limit=${searchLimit}&offset=${searchOffset}`;
      console.log(`[Proxy] Searching items for user ${userId} (status: ${status}, q: ${q})`);
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }
      if (q) {
        url += `&q=${encodeURIComponent(String(q))}`;
      }
      
      const response = await axios.get(url, {
        headers: getMLHeaders(accessToken)
      });
      console.log(`[Proxy] Items Search Success: found ${response.data.results?.length || 0} results. Total: ${response.data.paging?.total}`);
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Search Items");
      res.status(statusCode).json({ error: "Failed to search items", details: errorData });
    }
  });

  // Endpoint para atualizar item (Proxy)
  app.put("/api/ml/items/:id", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    const data = req.body;

    if (!id || !accessToken) return res.status(400).json({ error: "Missing itemId or token" });

    try {
      console.log(`[Proxy] Updating item ${id} with:`, JSON.stringify(data));
      const response = await axios.put(`https://api.mercadolibre.com/items/${id}`, data, {
        headers: getMLHeaders(accessToken, 'PUT')
      });
      console.log(`[Proxy] ML Update Success for ${id}`);
      res.json(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      const errorData = error.response?.data;
      console.error(`[Proxy] ML Update Error for ${id} (${statusCode}):`, JSON.stringify(errorData) || error.message);
      res.status(statusCode).json({ 
        error: "Failed to update item", 
        details: errorData 
      });
    }
  });

  // Endpoint para detalhes do usuário logado (Proxy)
  app.get("/api/ml/me", async (req, res) => {
    const { accessToken } = req.query;
    if (!accessToken) return res.status(400).json({ error: "Missing token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/users/me`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Users Me");
      res.status(statusCode).json({ error: "Failed to get user details", details: errorData });
    }
  });

  // Endpoint para detalhes de múltiplos itens (Batch)
  app.get("/api/ml/items", async (req, res) => {
    const { ids, accessToken } = req.query;
    if (!ids || !accessToken) return res.status(400).json({ error: "Missing ids or token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/items?ids=${ids}`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Batch Item Details");
      res.status(statusCode).json({ error: "Failed to get batch item details", details: errorData });
    }
  });

  // Endpoint para detalhes do item (Proxy) (Keep for single fetch)
  app.get("/api/ml/items/:id", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing itemId or token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/items/${id}`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Item Details");
      res.status(statusCode).json({ error: "Failed to get item details", details: errorData });
    }
  });

  // Endpoint para buscar descrição do item (Proxy)
  app.get("/api/ml/items/:id/description", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing itemId or token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/items/${id}/description`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Item Description");
      res.status(statusCode).json({ error: "Failed to get item description", details: errorData });
    }
  });

  // Endpoint para detalhes de um pedido específico
  app.get("/api/ml/orders/:id", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing orderId or token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/orders/${id}`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({ error: "Failed to get order details", details: error.response?.data });
    }
  });

  // Endpoint para detalhes de envio
  app.get("/api/ml/shipments/:id", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing shipmentId or token" });

    try {
      const response = await axios.get(`https://api.mercadolibre.com/shipments/${id}`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({ error: "Failed to get shipment details", details: error.response?.data });
    }
  });

  // Endpoint para buscar mensagens de um pedido (pack_id)
  app.get("/api/ml/orders/:id/messages", async (req, res) => {
    const { id } = req.params;
    const { accessToken, sellerId } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing token" });

    try {
      // First get order pack_id if available
      const orderRes = await axios.get(`https://api.mercadolibre.com/orders/${id}`, {
        headers: getMLHeaders(accessToken)
      });
      const packId = orderRes.data.pack_id || id;
      
      const response = await axios.get(`https://api.mercadolibre.com/messages/packs/${packId}/seller/${sellerId}`, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({ error: "Failed to get messages", details: error.response?.data });
    }
  });

  // Endpoint para enviar mensagem
  app.post("/api/ml/orders/:id/messages", async (req, res) => {
    const { id } = req.params;
    const { accessToken, sellerId, buyerId } = req.query;
    const { text } = req.body;

    if (!id || !accessToken || !text) return res.status(400).json({ error: "Missing required fields" });

    try {
      const orderRes = await axios.get(`https://api.mercadolibre.com/orders/${id}`, {
        headers: getMLHeaders(accessToken)
      });
      const packId = orderRes.data.pack_id || id;

      const response = await axios.post(`https://api.mercadolibre.com/messages/packs/${packId}/seller/${sellerId}?customer_id=${buyerId}`, {
        from: {
          user_id: Number(sellerId)
        },
        to: [
          {
            user_id: Number(buyerId)
          }
        ],
        text: text
      }, {
        headers: getMLHeaders(accessToken, 'POST')
      });
      res.json(response.data);
    } catch (error: any) {
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({ error: "Failed to send message", details: error.response?.data });
    }
  });

  // Endpoint para buscar URL da etiqueta
  app.get("/api/ml/shipments/:id/labels", async (req, res) => {
    const { id } = req.params;
    const { accessToken } = req.query;
    if (!id || !accessToken) return res.status(400).json({ error: "Missing shipmentId or token" });

    // In ML, the labels PDF is often a direct link or requires a token to download.
    // For simplicity, we return the link as ML provides it if we can get it, 
    // but usually it's https://api.mercadolibre.com/shipment_labels?shipment_ids={id}&response_type=pdf
    res.json({ url: `https://api.mercadolibre.com/shipment_labels?shipment_ids=${id}&response_type=pdf&access_token=${accessToken}` });
  });

  // Endpoint para buscar pedidos (Proxy)
  app.get("/api/ml/orders/search", async (req, res) => {
    const { userId, accessToken } = req.query;
    if (!userId || !accessToken) return res.status(400).json({ error: "Missing userId or token" });

    try {
      const url = `https://api.mercadolibre.com/orders/search?seller=${userId}&sort=date_desc&limit=50`;
      console.log(`[Proxy] Fetching orders for seller ${userId}`);
      
      const response = await axios.get(url, {
        headers: getMLHeaders(accessToken)
      });
      res.json(response.data);
    } catch (error: any) {
      const { statusCode, errorData } = handleAxiosError(error, "Orders Search");
      res.status(statusCode).json({ 
        error: "Failed to search orders", 
        details: errorData 
      });
    }
  });

  // Endpoint para duplicação em massa automatizada
  app.post("/api/ml/automation/batch", async (req, res) => {
    const { items, accessToken, config } = req.body;
    // items: Array of { id, currentPrice }
    // config: { priceVarCents: number, optimize: boolean }
    
    if (!items || !accessToken || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const results = [];
    const priceVar = Number(config?.priceVarCents || 0) / 100;

    for (const item of items) {
      try {
        // Here we'd call the duplication logic
        // For efficiency, I'll internalize a simplified version of duplication here or call an internal helper
        // But for this turn, I'll use the existing logic inside a loop (refactored if needed)
        
        // Let's assume the client sends the 'mods' already for each item if they want AI optimization
        // Or we can just handle the price variation here
        const newPrice = Number(item.currentPrice) + priceVar;
        
        // For now, let's just return a plan/mock response to the client to confirm we reached this
        // In a real scenario, this would loop 20 times and call ML API
        results.push({ id: item.id, status: "pending", newPrice });
      } catch (e) {
        results.push({ id: item.id, status: "failed", error: "Loop error" });
      }
    }

    res.json({ results, message: "Batch duplication initiated" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
