/** Art direction: visual audit and crop notes in docs/design-references/photography.md. */
export const PAGE_PHOTOS = {
  dashboard: { src: "/mma-mastery-photos/hero-white-gloves-cage.jpg", alt: "Combattant en garde, gants blancs levés, dans une cage à l'éclairage dramatique", position: "50% 38%" },
  training: { src: "/mma-mastery-photos/anastase-maragos-xE2qSPzgcdE-unsplash.jpg", alt: "Athlète frappant au sac dans un gym de boxe", position: "50% 52%" },
  skills: { src: "/mma-mastery-photos/pexels-gabii-fernandez-199438359-38785755.jpg", alt: "Deux pratiquantes travaillent une technique de jiu-jitsu", position: "50% 54%" },
  coach: { src: "/mma-mastery-photos/jonathan-tomas-rX36vcriciQ-unsplash.jpg", alt: "Coach tenant les paos face à une combattante concentrée", position: "58% 42%" },
  study: { src: "/mma-mastery-photos/pexels-anna-2037514238-29884890.jpg", alt: "Détail de gants pendant la préparation", position: "50% 52%" },
  goals: { src: "/mma-mastery-photos/pexels-ron-lach-8736745.jpg", alt: "Combattante ajustant ses bandes avant l'entraînement", position: "50% 38%" },
  competition: { src: "/mma-mastery-photos/pexels-fabriziovelez-29015506.jpg", alt: "Deux combattants s'affrontent dans la cage sous le regard de l'arbitre", position: "48% 75%" },
  club: { src: "/mma-mastery-photos/redd-francisco-iw73pbcJyg4-unsplash.jpg", alt: "Athlète saluant le public dans une cage pleine", position: "50% 36%" },
  search: { src: "/mma-mastery-photos/pexels-mjlo-28550403.jpg", alt: "Combattant observé à travers le grillage d'une cage", position: "50% 45%" },
  profile: { src: "/mma-mastery-photos/vV0e12TcSRRwsZeaeyU7WoK-UUh7MRz3DvLnS9jPJ2FGg4LBjLV6q1rxRjlkDBmIJfh6xrBaYR7EZyhC3Vwpdm7_ESZRQOHKlZK1JQFZDJVXZXZ7DEWo42NhcYz_NscpE6vmn31HKt2X9NtvzNC1bQtHUe2DYOv4UNLdoCNvhrr046B13hRECkQ8qvmgoFR_.jpg", alt: "Portrait d'une combattante en garde", position: "50% 43%" },
  calendar: { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6295766.jpg", alt: "Groupe structuré en séance de sparring", position: "50% 54%" },
  youtube: { src: "/mma-mastery-photos/diego-corona-_fljZhTXzSs-unsplash.jpg", alt: "Coup de pied sauté sur un ring sous des lumières dramatiques", position: "55% 45%" },
} as const;

export const LANDING_SLIDES = [
  { src: "/mma-mastery-photos/rotation-heavybag-back.jpg", alt: "Combattante travaillant au sac, vue de dos", position: "50% 30%" },
  { src: "/mma-mastery-photos/rotation-corner-embrace.jpg", alt: "Deux combattants échangeant dans un coin de salle", position: "50% 32%" },
  { src: "/mma-mastery-photos/rotation-heavybag-laugh.jpg", alt: "Combattante souriante face au sac lourd", position: "62% 65%" },
  { src: "/mma-mastery-photos/rotation-ring-jab.jpg", alt: "Boxeur portant un direct sur le ring", position: "42% 38%" },
] as const;

export const LANDING_FINAL_PHOTO = {
  src: "/mma-mastery-photos/gabriel-f-rodrigues-CtmroEwoSKY-unsplash.jpg",
  alt: "Combattants au contact dans la cage",
  position: "38% 45%",
} as const;

export const PHOTO_STORIES = {
  training: [
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6296025.jpg", alt: "Travail au sol pendant une séance de MMA", label: "Séances", labelKey: "training.sessions", href: "/training#sessions", position: "50% 58%" },
    { src: "/mma-mastery-photos/anastase-maragos-F5Cdsj2HXvY-unsplash.jpg", alt: "Échange de coups de pied au sac", label: "Galerie", labelKey: "nav.gallery", href: "/training/photos", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6296015.jpg", alt: "Partenaires répétant un coup de pied", label: "À revoir", labelKey: "photoLabel.review", href: "/training/review", position: "50% 48%" },
  ],
  skills: [
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11392143.jpg", alt: "Deux pratiquantes répètent une clé de bras", label: "Grappling", labelKey: "photoLabel.grappling", position: "50% 52%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-14796332.jpg", alt: "Partenaires travaillent un coup de pied", label: "Striking", labelKey: "photoLabel.striking", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-brunogobofoto-5424557.jpg", alt: "Contrôle au sol dans une cage", label: "MMA", labelKey: "photoLabel.mma", position: "50% 48%" },
  ],
  coach: [
    { src: "/mma-mastery-photos/pexels-davidgari-11740028.jpg", alt: "Coach échangeant avec une athlète sur le tapis", label: "Observer", labelKey: "photoLabel.watch", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-ron-lach-8745180.jpg", alt: "Travail aux paos sur un ring lumineux", label: "Ajuster", labelKey: "photoLabel.adjust", position: "50% 46%" },
    { src: "/mma-mastery-photos/michael-starkie-ynaiLpRBigY-unsplash.jpg", alt: "Athlète au sac lourd", label: "Répéter", labelKey: "photoLabel.repeat", position: "50% 48%" },
  ],
  study: [
    { src: "/mma-mastery-photos/pexels-mica-bassa-2157036390-38718034.jpg", alt: "Pratiquante nouant sa ceinture de jiu-jitsu", label: "Comprendre", labelKey: "photoLabel.understand", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-cottonbro-4761662.jpg", alt: "Deux boxeurs étudient la distance", label: "Décomposer", labelKey: "photoLabel.breakdown", position: "50% 45%" },
    { src: "/mma-mastery-photos/pexels-heloisa-freitas-734111-1608099.jpg", alt: "Détail de gants avant la séance", label: "Ressources", labelKey: "photoLabel.resources", position: "62% 45%" },
  ],
  goals: [
    { src: "/mma-mastery-photos/pexels-gera-cejas-3616330-38502836.jpg", alt: "Athlète levant le poing après l'effort", label: "Cap", labelKey: "photoLabel.direction", position: "50% 33%" },
    { src: "/mma-mastery-photos/sebastian-huxley-GfqSlK4A7zs-unsplash.jpg", alt: "Pratiquants de grappling vus au ras du tapis", label: "Progression", labelKey: "photoLabel.progress", position: "50% 48%" },
  ],
  competition: [
    { src: "/mma-mastery-photos/solal-ohayon-5QIPyaDT1V0-unsplash.jpg", alt: "Combat de kick-boxing sur un ring", label: "Combat", labelKey: "photoLabel.fight", position: "50% 42%" },
    { src: "/mma-mastery-photos/pexels-coco-championship-191448-598665.jpg", alt: "Combattante entre deux rounds", label: "Échéance", labelKey: "photoLabel.upcoming", position: "50% 40%" },
    { src: "/mma-mastery-photos/pexels-franco-monsalvo-252430633-13808109.jpg", alt: "Impact d'un coup de pied en compétition", label: "Séquences", labelKey: "photoLabel.sequences", position: "50% 50%" },
  ],
  club: [
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6295755.jpg", alt: "Groupe en entraînement de striking", label: "Cours", labelKey: "photoLabel.classes", href: "/club#cours", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-alexapopovich-10655516.jpg", alt: "Groupe de jeunes compétiteurs et leur coach", label: "Collectif", labelKey: "photoLabel.collective", href: "/club#collectif", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11392013.jpg", alt: "Partenaires en travail de grappling", label: "Partenaires", labelKey: "photoLabel.partners", href: "/profile#partenaires", position: "50% 50%" },
  ],
  search: [
    { src: "/mma-mastery-photos/pexels-cottonbro-4761780.jpg", alt: "Vue d'ensemble d'un ring avec deux boxeurs", label: "Séances", labelKey: "training.sessions", href: "/training", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11391867.jpg", alt: "Technique de grappling en cours", label: "Compétences", labelKey: "nav.skills", href: "/skills", position: "50% 54%" },
  ],
  profile: [
    { src: "/mma-mastery-photos/aliya-amangeldi-RPjF4KKeEOQ-unsplash.jpg", alt: "Portrait rapproché d'une athlète", label: "Identité", labelKey: "photoLabel.identity", position: "50% 43%" },
    { src: "/mma-mastery-photos/anastase-maragos-G0V6_28ONZA-unsplash.jpg", alt: "Athlète après l'effort dans une lumière bleue", label: "Parcours", labelKey: "photoLabel.journey", position: "50% 44%" },
  ],
  calendar: [
    { src: "/mma-mastery-photos/pexels-cottonbro-4753927.jpg", alt: "Plusieurs binômes s'entraînent dans le gym", label: "Entraînements", labelKey: "photoLabel.trainings", href: "/training", position: "46% 46%" },
    { src: "/mma-mastery-photos/pexels-franco-monsalvo-252430633-13808107.jpg", alt: "Combat programmé sur un ring", label: "Compétitions", labelKey: "photoLabel.competitions", href: "/competition", position: "50% 54%" },
  ],
} as const;

export type PhotoPage = keyof typeof PAGE_PHOTOS;
export type PhotoStoryPage = keyof typeof PHOTO_STORIES;
