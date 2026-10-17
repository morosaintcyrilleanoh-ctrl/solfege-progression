/** Version intégrée : les résultats de solfège restent sur l'appareil de l'élève. */
export function AccountBanner() {
  return (
    <p className="mb-4 rounded-xl border border-electric-300 bg-electric-500/5 p-3 text-sm text-slate-700">
      Ces chiffres proviennent de tes exercices de solfège <strong>sur cet appareil</strong>. Ils restent disponibles même sans
      connexion Internet.
    </p>
  );
}
