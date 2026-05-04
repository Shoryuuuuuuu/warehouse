import useSWR, { mutate } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'An error occurred');
  }
  return res.json();
};

export function useApi<T>(url: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<{ success: boolean; data: T }>(
    url,
    fetcher
  );

  return {
    data: data?.data,
    isLoading,
    isValidating,
    error: error?.message,
    mutate: () => mutate(url),
  };
}

export function usePaginatedApi<T>(
  baseUrl: string,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  additionalParams: Record<string, string> = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && { search }),
    ...additionalParams,
  });

  const url = `${baseUrl}?${params.toString()}`;

  const { data, error, isLoading, isValidating } = useSWR<{
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(url, fetcher);

  return {
    data: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.page || 1,
    isLoading,
    isValidating,
    error: error?.message,
    mutate: () => mutate(url),
  };
}

export async function apiPost<T>(url: string, data: unknown): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiPut<T>(url: string, data: unknown): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function apiDelete(url: string): Promise<{ success: boolean; error?: string; message?: string }> {
  const res = await fetch(url, {
    method: 'DELETE',
  });
  return res.json();
}
