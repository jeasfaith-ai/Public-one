export const clientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  console.log(`[clientFetch] ${init?.method || 'GET'} ${url}`);
  
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return window.fetch(input, {
    ...init,
    headers
  });
};
