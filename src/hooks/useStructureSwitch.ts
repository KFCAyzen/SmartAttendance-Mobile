import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import type { Structure } from '../api/structures';
import { useAppContextStore } from '../stores/app-context.store';
import { useStructureStore } from '../stores/structure.store';

/** Applique le choix de structure active : persiste, vide le cache (tout
 * l'écran back-office en dépend), et rafraîchit le vocabulaire (entreprise/école). */
export function useSwitchStructure() {
  const queryClient = useQueryClient();
  const setActiveStructureId = useStructureStore((s) => s.setActive);
  const [switching, setSwitching] = useState(false);

  const switchTo = async (structure: Structure) => {
    setSwitching(true);
    try {
      await setActiveStructureId(structure.id);
      // Le type de la structure choisie est déjà connu (elle vient de la liste
      // /structures) : on l'applique directement plutôt que de le re-déduire
      // via un aller-retour réseau vers /config/app-context, dont l'échec
      // serait silencieusement ignoré et laisserait l'ancien vocabulaire affiché.
      await useAppContextStore.getState().setContext(structure.type);
      queryClient.clear();
    } finally {
      setSwitching(false);
    }
  };

  return { switchTo, switching };
}
