export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}` || "/";
}
