export function canCreateWorkspace(saasMode: boolean, isCustomDomain: boolean, isSystemAdmin: boolean): boolean {
  if (isCustomDomain) return false;
  if (saasMode) return true;
  return isSystemAdmin;
}
