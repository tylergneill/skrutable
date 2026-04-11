export function validTabUrl(tab) {
  if (!tab || !tab.url || (typeof tab.id === "number" && tab.id < 0)) return false;
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) return false;
  return true;
}
