type httpVerb = "POST" | "GET" | "PUT" | "DELETE";

interface FetchOptions {
  method?: httpVerb;
  body?: unknown;
  headers?: Record<string, string>;
}

export const API_KEY: string = "http://localhost:8080/api";

export async function apiRequest<Response>(url: string, options: FetchOptions = {}): Promise<Response>  
{
  const { method = 'GET', body, headers } = options;

  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    mode: 'cors',
  };

  if (method !== "GET" && body !== undefined) {
    requestConfig.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, requestConfig);
    
    if (!response.ok) {
      let errorMsg = `Error del servidor: Código ${response.status}`;
      if (response.status === 404) errorMsg = '404 Not Found: Servicio no encontrado';
      if (response.status === 500) errorMsg = '500 Internal Error: Error interno en el backend';
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.message) {
          errorMsg = errorJson.message;
        }
      } catch {
        try {
          const text = await response.text();
          if (text) errorMsg = text;
        } catch { /* ignore */ }
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get("content-type");
    if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      return text as unknown as Response;
    }

    return await response.json();
  } catch (error: unknown) {
    // Propagar el error para que sea manejado por el componente llamador
    const errorMessage = error instanceof Error ? error.message : "Error de conexión con el servidor";
    throw new Error(errorMessage, { cause: error });
  }
}

export const fetchRequest = async <Response,>(url: string, options: FetchOptions = {}): Promise<Response> => {
  return apiRequest<Response>(url, options);
};