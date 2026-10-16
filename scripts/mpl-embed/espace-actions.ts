/**
 * Version intégrée à Music Progression Lab : pas de compte Solfège Progression.
 * Le niveau et l'accès aux modules se décident sur l'appareil (test de niveau).
 */
export async function recordPlacementOnAccountAction(input: unknown): Promise<{ saved: boolean; message?: string }> {
  void input;
  return { saved: false };
}

export async function advancedAccessForAccountAction(): Promise<{ allowed: boolean; reason?: string }> {
  return { allowed: false };
}
