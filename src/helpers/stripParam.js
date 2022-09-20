export function stripParam(url) {
  return url.substring(url.lastIndexOf("/") + 1);
}
