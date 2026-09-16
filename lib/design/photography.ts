/** Art direction: visual audit and crop notes in docs/design-references/photography.md. */
export const PAGE_PHOTOS = {
  dashboard: { src: "/mma-mastery-photos/pexels-shkrabaanthony-4398347.jpg", alt: "Athlète en garde dans une salle sombre", position: "50% 60%" },
  training: { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6296018.jpg", alt: "Deux athlètes répètent un coup de pied aux paos", position: "50% 44%" },
  skills: { src: "/mma-mastery-photos/pexels-brunogobofoto-5485525.jpg", alt: "Deux pratiquants travaillent un contrôle au sol près de la cage", position: "50% 40%" },
  coach: { src: "/mma-mastery-photos/pexels-cottonbro-4761782.jpg", alt: "Un boxeur en silhouette, en garde sous la lumière du gym", position: "50% 8%" },
  study: { src: "/mma-mastery-photos/pexels-eduard-perez-2158828645-38674580.jpg", alt: "Deux partenaires étudient la distance en striking", position: "50% 58%" },
  goals: { src: "/mma-mastery-photos/pexels-heloisa-freitas-734111-1608099.jpg", alt: "Athlète concentrée, les gants en garde sur fond noir", position: "50% 8%" },
  competition: { src: "/mma-mastery-photos/pexels-fabriziovelez-29015506.jpg", alt: "Deux combattants s'affrontent dans la cage sous le regard de l'arbitre", position: "48% 75%" },
  club: { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6295766.jpg", alt: "Plusieurs binômes s'entraînent ensemble dans le gym", position: "50% 45%" },
  search: { src: "/mma-mastery-photos/pexels-cottonbro-4761780.jpg", alt: "Vue d'ensemble d'un ring avec deux boxeurs", position: "50% 48%" },
  profile: { src: "/mma-mastery-photos/pexels-gera-cejas-3616330-38758889.jpg", alt: "Une athlète assise sur le tapis pendant une pause", position: "50% 30%" },
  calendar: { src: "/mma-mastery-photos/pexels-mariano-di-luch-679379189-38571271.jpg", alt: "Athlète levant ses gants après une session structurée", position: "50% 53%" },
} as const;

export type PhotoPage = keyof typeof PAGE_PHOTOS;
