export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
