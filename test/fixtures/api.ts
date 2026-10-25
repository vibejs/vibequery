export let userLoads = 0;

export function resetUserLoads(): void {
  userLoads = 0;
}

export async function loadUser(): Promise<{ name: string }> {
  userLoads += 1;
  return { name: 'Ada' };
}
