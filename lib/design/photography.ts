/** Art direction: visual audit and crop notes in docs/design-references/photography.md. */
export const PAGE_PHOTOS = {
  dashboard: { src: "/mma-mastery-photos/-37DpFDYsYY7HL96ovNdzGJE1lQmDKA8d1uvLlFJJQPrLgtVmsRikjMJ7czTfs--cKYwdC1cnAasvcaLH9-swbzZpui9TP5FUMwu8tHrNVjBhXgBBPRKlIPuwePmEkdVIgxSLhRBkuHHsMOwtU-QL58nsdg6do3qQTPRTraT1zyjvNbE4Hu2t9D_36iGiBXp.jpg", alt: "Combattante travaillant au sac dans une salle baignée de lumière", position: "58% 48%" },
  training: { src: "/mma-mastery-photos/anastase-maragos-xE2qSPzgcdE-unsplash.jpg", alt: "Athlète frappant au sac dans un gym de boxe", position: "50% 52%" },
  skills: { src: "/mma-mastery-photos/pexels-gabii-fernandez-199438359-38785755.jpg", alt: "Deux pratiquantes travaillent une technique de jiu-jitsu", position: "50% 54%" },
  coach: { src: "/mma-mastery-photos/jonathan-tomas-rX36vcriciQ-unsplash.jpg", alt: "Coach tenant les paos face à une combattante concentrée", position: "58% 42%" },
  study: { src: "/mma-mastery-photos/pexels-anna-2037514238-29884890.jpg", alt: "Détail de gants pendant la préparation", position: "50% 52%" },
  goals: { src: "/mma-mastery-photos/pexels-ron-lach-8736745.jpg", alt: "Combattante ajustant ses bandes avant l'entraînement", position: "50% 38%" },
  competition: { src: "/mma-mastery-photos/pexels-fabriziovelez-29015506.jpg", alt: "Deux combattants s'affrontent dans la cage sous le regard de l'arbitre", position: "48% 75%" },
  club: { src: "/mma-mastery-photos/redd-francisco-iw73pbcJyg4-unsplash.jpg", alt: "Athlète saluant le public dans une cage pleine", position: "50% 36%" },
  search: { src: "/mma-mastery-photos/pexels-mjlo-28550403.jpg", alt: "Combattant observé à travers le grillage d'une cage", position: "50% 45%" },
  profile: { src: "/mma-mastery-photos/vV0e12TcSRRwsZeaeyU7WoK-UUh7MRz3DvLnS9jPJ2FGg4LBjLV6q1rxRjlkDBmIJfh6xrBaYR7EZyhC3Vwpdm7_ESZRQOHKlZK1JQFZDJVXZXZ7DEWo42NhcYz_NscpE6vmn31HKt2X9NtvzNC1bQtHUe2DYOv4UNLdoCNvhrr046B13hRECkQ8qvmgoFR_.jpg", alt: "Portrait d'une combattante en garde", position: "50% 36%" },
  calendar: { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6295766.jpg", alt: "Groupe structuré en séance de sparring", position: "50% 47%" },
} as const;

export const LANDING_SLIDES = [
  { src: "/mma-mastery-photos/anastase-maragos-i3Kbld04hs4-unsplash.jpg", alt: "Combattant avançant sous les lumières du gym", position: "50% 42%" },
  { src: "/mma-mastery-photos/pexels-cristian-rojas-8810145.jpg", alt: "Athlète concentré pendant une séance de préparation", position: "50% 38%" },
  { src: "/mma-mastery-photos/pexels-brunogobofoto-5521149.jpg", alt: "Combattant récupérant sur le tapis après l'effort", position: "58% 50%" },
  { src: "/mma-mastery-photos/anastase-maragos-sZYPBJ3neyA-unsplash.jpg", alt: "Boxeur travaillant dans une salle à l'atmosphère brute", position: "50% 44%" },
] as const;

export const PHOTO_STORIES = {
  training: [
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6296025.jpg", alt: "Travail au sol pendant une séance de MMA", label: "Séances", href: "/training#sessions", position: "50% 58%" },
    { src: "/mma-mastery-photos/anastase-maragos-F5Cdsj2HXvY-unsplash.jpg", alt: "Échange de coups de pied au sac", label: "Galerie", href: "/training/photos", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6296015.jpg", alt: "Partenaires répétant un coup de pied", label: "À revoir", href: "/training/review", position: "50% 48%" },
  ],
  skills: [
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11392143.jpg", alt: "Deux pratiquantes répètent une clé de bras", label: "Grappling", position: "50% 52%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-14796332.jpg", alt: "Partenaires travaillent un coup de pied", label: "Striking", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-brunogobofoto-5424557.jpg", alt: "Contrôle au sol dans une cage", label: "MMA", position: "50% 48%" },
  ],
  coach: [
    { src: "/mma-mastery-photos/pexels-davidgari-11740028.jpg", alt: "Coach échangeant avec une athlète sur le tapis", label: "Observer", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-ron-lach-8745180.jpg", alt: "Travail aux paos sur un ring lumineux", label: "Ajuster", position: "50% 46%" },
    { src: "/mma-mastery-photos/michael-starkie-ynaiLpRBigY-unsplash.jpg", alt: "Athlète au sac lourd", label: "Répéter", position: "50% 48%" },
  ],
  study: [
    { src: "/mma-mastery-photos/pexels-mica-bassa-2157036390-38718034.jpg", alt: "Pratiquante nouant sa ceinture de jiu-jitsu", label: "Comprendre", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-cottonbro-4761662.jpg", alt: "Deux boxeurs étudient la distance", label: "Décomposer", position: "50% 45%" },
    { src: "/mma-mastery-photos/pexels-shkrabaanthony-4398382.jpg", alt: "Athlète analysant sa préparation avant la séance", label: "Ressources", position: "50% 46%" },
  ],
  goals: [
    { src: "/mma-mastery-photos/pexels-gera-cejas-3616330-38502836.jpg", alt: "Athlète levant le poing après l'effort", label: "Cap", position: "50% 33%" },
    { src: "/mma-mastery-photos/sebastian-huxley-GfqSlK4A7zs-unsplash.jpg", alt: "Pratiquants de grappling vus au ras du tapis", label: "Progression", position: "50% 48%" },
  ],
  competition: [
    { src: "/mma-mastery-photos/solal-ohayon-5QIPyaDT1V0-unsplash.jpg", alt: "Combat de kick-boxing sur un ring", label: "Combat", position: "50% 42%" },
    { src: "/mma-mastery-photos/pexels-coco-championship-191448-598665.jpg", alt: "Combattante entre deux rounds", label: "Échéance", position: "50% 40%" },
    { src: "/mma-mastery-photos/pexels-franco-monsalvo-252430633-13808109.jpg", alt: "Impact d'un coup de pied en compétition", label: "Séquences", position: "50% 50%" },
  ],
  club: [
    { src: "/mma-mastery-photos/pexels-pavel-danilyuk-6295755.jpg", alt: "Groupe en entraînement de striking", label: "Cours", href: "/club#cours", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-alexapopovich-10655516.jpg", alt: "Groupe de jeunes compétiteurs et leur coach", label: "Collectif", href: "/club#collectif", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11392013.jpg", alt: "Partenaires en travail de grappling", label: "Partenaires", href: "/profile#partenaires", position: "50% 50%" },
  ],
  search: [
    { src: "/mma-mastery-photos/pexels-cottonbro-4761780.jpg", alt: "Vue d'ensemble d'un ring avec deux boxeurs", label: "Séances", position: "50% 50%" },
    { src: "/mma-mastery-photos/pexels-duren-williams-29414623-11391867.jpg", alt: "Technique de grappling en cours", label: "Compétences", position: "50% 54%" },
  ],
  profile: [
    { src: "/mma-mastery-photos/aliya-amangeldi-RPjF4KKeEOQ-unsplash.jpg", alt: "Portrait rapproché d'une athlète", label: "Identité", position: "50% 34%" },
    { src: "/mma-mastery-photos/anastase-maragos-G0V6_28ONZA-unsplash.jpg", alt: "Athlète après l'effort dans une lumière bleue", label: "Parcours", position: "50% 48%" },
  ],
  calendar: [
    { src: "/mma-mastery-photos/pexels-cottonbro-4753927.jpg", alt: "Plusieurs binômes s'entraînent dans le gym", label: "Entraînements", position: "50% 48%" },
    { src: "/mma-mastery-photos/pexels-franco-monsalvo-252430633-13808107.jpg", alt: "Combat programmé sur un ring", label: "Compétitions", position: "50% 48%" },
  ],
} as const;

export type PhotoPage = keyof typeof PAGE_PHOTOS;
export type PhotoStoryPage = keyof typeof PHOTO_STORIES;
