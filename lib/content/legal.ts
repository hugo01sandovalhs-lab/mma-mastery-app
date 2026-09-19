import type { Locale } from "@/lib/i18n";

/**
 * Privacy Policy and Terms of Service copy. This describes what the app
 * actually does today (data collected, storage in Supabase, the YouTube
 * Data API integration, cookie usage) rather than boilerplate. It
 * deliberately does NOT invent a legal entity name, registered address,
 * SIRET/company number, or DPO/contact identity — those are owner-specific
 * facts this session has no authority to fabricate. Every such gap is
 * marked with `NEEDS_OWNER_INPUT` so the rendered page can flag it clearly
 * instead of silently shipping a placeholder that looks like real data.
 */

export const NEEDS_OWNER_INPUT = "NEEDS_OWNER_INPUT";

export type LegalSection = { heading: string; body: string };
export type LegalDoc = { title: string; updated: string; intro: string; sections: LegalSection[] };
export type LegalContent = { privacy: LegalDoc; terms: LegalDoc };

export const LEGAL_CONTENT: Record<Locale, LegalContent> = {
  fr: {
    privacy: {
      title: "Politique de confidentialité",
      updated: "Dernière mise à jour : à compléter par l'éditeur",
      intro: "Cette page décrit les données que MMA Mastery traite, pourquoi, et comment les exercer. Elle sera complétée par l'éditeur avec ses coordonnées légales avant mise en production.",
      sections: [
        { heading: "Responsable du traitement", body: `${NEEDS_OWNER_INPUT} : nom de l'entité, adresse et numéro d'immatriculation (SIRET ou équivalent) à renseigner ici avant publication.` },
        { heading: "Données collectées", body: "Informations de compte (email), profil athlète optionnel (nom, âge, taille, poids, disciplines, objectifs), séances d'entraînement et de sparring, progression sur le catalogue de compétences, événements de club et présence, photos que vous importez, et vos préférences de langue." },
        { heading: "Finalités", body: "Ces données servent uniquement à faire fonctionner le suivi d'entraînement, la progression de compétences, le coach et les fonctionnalités de club — jamais à des fins publicitaires." },
        { heading: "Sous-traitants et destinataires", body: "Les données sont hébergées chez Supabase (base de données et stockage). La recherche de vidéos utilise l'API YouTube Data de Google, interrogée uniquement à votre demande, sans transmission de vos données personnelles à Google." },
        { heading: "Durée de conservation", body: "Vos données sont conservées tant que votre compte existe. Une suppression de compte peut être demandée via les coordonnées ci-dessous." },
        { heading: "Cookies", body: "L'application utilise uniquement des cookies strictement nécessaires : la session d'authentification et votre préférence de langue. Aucun cookie publicitaire ou de mesure d'audience tiers n'est utilisé." },
        { heading: "Vos droits", body: "Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour l'exercer, contactez l'éditeur aux coordonnées indiquées ci-dessous." },
        { heading: "Sécurité", body: "L'accès aux données est protégé par authentification et des règles de sécurité au niveau des lignes (Row Level Security) : chaque utilisateur ne voit que ses propres données d'entraînement." },
        { heading: "Contact", body: `${NEEDS_OWNER_INPUT} : adresse email de contact pour les demandes liées aux données personnelles.` },
      ],
    },
    terms: {
      title: "Conditions générales d'utilisation",
      updated: "Dernière mise à jour : à compléter par l'éditeur",
      intro: "Ces conditions régissent l'utilisation de MMA Mastery. Elles seront complétées par l'éditeur avec ses coordonnées légales avant mise en production.",
      sections: [
        { heading: "Éditeur du service", body: `${NEEDS_OWNER_INPUT} : nom de l'entité, adresse et numéro d'immatriculation (SIRET ou équivalent) à renseigner ici avant publication.` },
        { heading: "Objet", body: "MMA Mastery est une application de suivi d'entraînement, de progression de compétences et de gestion de club pour pratiquants de sports de combat." },
        { heading: "Compte utilisateur", body: "L'accès nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude des informations fournies." },
        { heading: "Contenu utilisateur", body: "Vous restez propriétaire des données et photos que vous importez. Vous garantissez disposer des droits nécessaires sur les photos que vous publiez, y compris celles de tiers identifiables." },
        { heading: "Usage acceptable", body: "Le service ne doit pas être utilisé pour publier du contenu illicite, porter atteinte aux droits d'autrui, ou tenter de contourner les mesures de sécurité." },
        { heading: "Disponibilité", body: "Le service est fourni « en l'état ». Des interruptions pour maintenance ou des indisponibilités ponctuelles peuvent survenir." },
        { heading: "Résiliation", body: "Vous pouvez cesser d'utiliser le service à tout moment. L'éditeur peut suspendre un compte en cas d'usage abusif ou contraire aux présentes conditions." },
        { heading: "Droit applicable", body: `${NEEDS_OWNER_INPUT} : droit applicable et juridiction compétente à préciser par l'éditeur.` },
        { heading: "Contact", body: `${NEEDS_OWNER_INPUT} : adresse email de contact pour toute question relative aux présentes conditions.` },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: to be completed by the publisher",
      intro: "This page describes what data MMA Mastery processes, why, and how to exercise your rights. It will be completed by the publisher with their legal details before going live.",
      sections: [
        { heading: "Data controller", body: `${NEEDS_OWNER_INPUT}: legal entity name, registered address, and company registration number to be filled in here before publishing.` },
        { heading: "Data collected", body: "Account information (email), optional athlete profile (name, age, height, weight, disciplines, goals), training and sparring sessions, skill catalog progress, club events and attendance, photos you upload, and your language preference." },
        { heading: "Purpose", body: "This data is used solely to run training tracking, skill progression, the coach, and club features — never for advertising." },
        { heading: "Processors and recipients", body: "Data is hosted with Supabase (database and storage). Video search uses Google's YouTube Data API, queried only at your request, without sending your personal data to Google." },
        { heading: "Retention", body: "Your data is kept as long as your account exists. Account deletion can be requested using the contact details below." },
        { heading: "Cookies", body: "The app only uses strictly necessary cookies: the authentication session and your language preference. No advertising or third-party analytics cookies are used." },
        { heading: "Your rights", body: "You have a right to access, correct, delete, and receive a copy of your data. To exercise it, contact the publisher using the details below." },
        { heading: "Security", body: "Data access is protected by authentication and Row Level Security: each user can only see their own training data." },
        { heading: "Contact", body: `${NEEDS_OWNER_INPUT}: contact email address for data-related requests.` },
      ],
    },
    terms: {
      title: "Terms of Service",
      updated: "Last updated: to be completed by the publisher",
      intro: "These terms govern the use of MMA Mastery. They will be completed by the publisher with their legal details before going live.",
      sections: [
        { heading: "Service publisher", body: `${NEEDS_OWNER_INPUT}: legal entity name, registered address, and company registration number to be filled in here before publishing.` },
        { heading: "Purpose", body: "MMA Mastery is a training tracker, skill progression, and club management app for combat sports practitioners." },
        { heading: "User account", body: "Access requires creating an account. You are responsible for keeping your credentials confidential and for the accuracy of the information you provide." },
        { heading: "User content", body: "You remain the owner of the data and photos you upload. You warrant that you hold the necessary rights over any photos you publish, including those showing identifiable third parties." },
        { heading: "Acceptable use", body: "The service must not be used to publish unlawful content, infringe on others' rights, or attempt to bypass security measures." },
        { heading: "Availability", body: "The service is provided \"as is\". Maintenance interruptions or occasional unavailability may occur." },
        { heading: "Termination", body: "You may stop using the service at any time. The publisher may suspend an account for abusive use or violation of these terms." },
        { heading: "Governing law", body: `${NEEDS_OWNER_INPUT}: governing law and competent jurisdiction to be specified by the publisher.` },
        { heading: "Contact", body: `${NEEDS_OWNER_INPUT}: contact email address for any question about these terms.` },
      ],
    },
  },
  es: {
    privacy: {
      title: "Política de privacidad",
      updated: "Última actualización: a completar por el editor",
      intro: "Esta página describe qué datos trata MMA Mastery, por qué, y cómo ejercer tus derechos. El editor la completará con sus datos legales antes de la puesta en producción.",
      sections: [
        { heading: "Responsable del tratamiento", body: `${NEEDS_OWNER_INPUT}: nombre de la entidad, dirección y número de registro a completar aquí antes de publicar.` },
        { heading: "Datos recopilados", body: "Información de cuenta (email), perfil de atleta opcional (nombre, edad, altura, peso, disciplinas, objetivos), sesiones de entrenamiento y sparring, progreso en el catálogo de competencias, eventos de club y asistencia, fotos que subes, y tu preferencia de idioma." },
        { heading: "Finalidad", body: "Estos datos se usan únicamente para el seguimiento de entrenamiento, la progresión de competencias, el coach y las funciones de club — nunca con fines publicitarios." },
        { heading: "Encargados y destinatarios", body: "Los datos se alojan en Supabase (base de datos y almacenamiento). La búsqueda de vídeos usa la API YouTube Data de Google, consultada solo a tu petición, sin enviar tus datos personales a Google." },
        { heading: "Conservación", body: "Tus datos se conservan mientras exista tu cuenta. Puedes solicitar la eliminación de tu cuenta con los datos de contacto indicados abajo." },
        { heading: "Cookies", body: "La aplicación solo usa cookies estrictamente necesarias: la sesión de autenticación y tu preferencia de idioma. No se usan cookies publicitarias ni de analítica de terceros." },
        { heading: "Tus derechos", body: "Tienes derecho a acceder, rectificar, eliminar y portar tus datos. Para ejercerlo, contacta con el editor en los datos indicados abajo." },
        { heading: "Seguridad", body: "El acceso a los datos está protegido por autenticación y seguridad a nivel de fila (Row Level Security): cada usuario solo ve sus propios datos de entrenamiento." },
        { heading: "Contacto", body: `${NEEDS_OWNER_INPUT}: dirección de email de contacto para solicitudes relacionadas con datos personales.` },
      ],
    },
    terms: {
      title: "Términos y condiciones",
      updated: "Última actualización: a completar por el editor",
      intro: "Estos términos rigen el uso de MMA Mastery. El editor los completará con sus datos legales antes de la puesta en producción.",
      sections: [
        { heading: "Editor del servicio", body: `${NEEDS_OWNER_INPUT}: nombre de la entidad, dirección y número de registro a completar aquí antes de publicar.` },
        { heading: "Objeto", body: "MMA Mastery es una aplicación de seguimiento de entrenamiento, progresión de competencias y gestión de club para practicantes de deportes de combate." },
        { heading: "Cuenta de usuario", body: "El acceso requiere crear una cuenta. Eres responsable de mantener tus credenciales confidenciales y de la exactitud de la información proporcionada." },
        { heading: "Contenido de usuario", body: "Conservas la propiedad de los datos y fotos que subes. Garantizas contar con los derechos necesarios sobre cualquier foto que publiques, incluidas las de terceros identificables." },
        { heading: "Uso aceptable", body: "El servicio no debe usarse para publicar contenido ilícito, vulnerar los derechos de terceros, ni intentar eludir las medidas de seguridad." },
        { heading: "Disponibilidad", body: "El servicio se proporciona \"tal cual\". Pueden producirse interrupciones por mantenimiento o indisponibilidad ocasional." },
        { heading: "Resolución", body: "Puedes dejar de usar el servicio en cualquier momento. El editor puede suspender una cuenta por uso abusivo o incumplimiento de estos términos." },
        { heading: "Ley aplicable", body: `${NEEDS_OWNER_INPUT}: ley aplicable y jurisdicción competente a especificar por el editor.` },
        { heading: "Contacto", body: `${NEEDS_OWNER_INPUT}: dirección de email de contacto para cualquier pregunta sobre estos términos.` },
      ],
    },
  },
  de: {
    privacy: {
      title: "Datenschutzerklärung",
      updated: "Letzte Aktualisierung: vom Betreiber zu ergänzen",
      intro: "Diese Seite beschreibt, welche Daten MMA Mastery verarbeitet, warum, und wie du deine Rechte ausübst. Sie wird vom Betreiber vor dem Livegang mit dessen rechtlichen Angaben vervollständigt.",
      sections: [
        { heading: "Verantwortlicher", body: `${NEEDS_OWNER_INPUT}: Name der Rechtsperson, Anschrift und Handelsregisternummer hier vor Veröffentlichung eintragen.` },
        { heading: "Erhobene Daten", body: "Kontoinformationen (E-Mail), optionales Athletenprofil (Name, Alter, Größe, Gewicht, Disziplinen, Ziele), Trainings- und Sparring-Einheiten, Fortschritt im Fertigkeitenkatalog, Vereinsveranstaltungen und Anwesenheit, hochgeladene Fotos sowie deine Spracheinstellung." },
        { heading: "Zweck", body: "Diese Daten dienen ausschließlich dem Trainings-Tracking, dem Fertigkeitsfortschritt, dem Coach und den Vereinsfunktionen — niemals zu Werbezwecken." },
        { heading: "Auftragsverarbeiter und Empfänger", body: "Die Daten werden bei Supabase gehostet (Datenbank und Speicher). Die Videosuche nutzt die YouTube Data API von Google, die nur auf deine Anfrage hin abgefragt wird, ohne dass deine personenbezogenen Daten an Google übermittelt werden." },
        { heading: "Speicherdauer", body: "Deine Daten werden gespeichert, solange dein Konto besteht. Eine Kontolöschung kann über die unten angegebenen Kontaktdaten beantragt werden." },
        { heading: "Cookies", body: "Die App verwendet nur unbedingt notwendige Cookies: die Authentifizierungssitzung und deine Spracheinstellung. Es werden keine Werbe- oder Analyse-Cookies Dritter verwendet." },
        { heading: "Deine Rechte", body: "Du hast ein Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. Wende dich dazu an den Betreiber über die unten angegebenen Kontaktdaten." },
        { heading: "Sicherheit", body: "Der Datenzugriff ist durch Authentifizierung und Row-Level-Security geschützt: Jeder Nutzer sieht ausschließlich seine eigenen Trainingsdaten." },
        { heading: "Kontakt", body: `${NEEDS_OWNER_INPUT}: Kontakt-E-Mail-Adresse für Anfragen zu personenbezogenen Daten.` },
      ],
    },
    terms: {
      title: "Nutzungsbedingungen",
      updated: "Letzte Aktualisierung: vom Betreiber zu ergänzen",
      intro: "Diese Bedingungen regeln die Nutzung von MMA Mastery. Sie werden vom Betreiber vor dem Livegang mit dessen rechtlichen Angaben vervollständigt.",
      sections: [
        { heading: "Betreiber des Dienstes", body: `${NEEDS_OWNER_INPUT}: Name der Rechtsperson, Anschrift und Handelsregisternummer hier vor Veröffentlichung eintragen.` },
        { heading: "Zweck", body: "MMA Mastery ist eine App zum Trainings-Tracking, zur Fertigkeitsentwicklung und zur Vereinsverwaltung für Kampfsportler." },
        { heading: "Nutzerkonto", body: "Der Zugang erfordert die Erstellung eines Kontos. Du bist für die Vertraulichkeit deiner Zugangsdaten und die Richtigkeit deiner Angaben verantwortlich." },
        { heading: "Nutzerinhalte", body: "Du bleibst Eigentümer der von dir hochgeladenen Daten und Fotos. Du sicherst zu, über die erforderlichen Rechte an veröffentlichten Fotos zu verfügen, auch an solchen mit erkennbaren Dritten." },
        { heading: "Zulässige Nutzung", body: "Der Dienst darf nicht genutzt werden, um rechtswidrige Inhalte zu veröffentlichen, Rechte Dritter zu verletzen oder Sicherheitsmaßnahmen zu umgehen." },
        { heading: "Verfügbarkeit", body: "Der Dienst wird „wie besehen“ bereitgestellt. Wartungsunterbrechungen oder gelegentliche Nichtverfügbarkeit können auftreten." },
        { heading: "Kündigung", body: "Du kannst die Nutzung jederzeit beenden. Der Betreiber kann ein Konto bei missbräuchlicher Nutzung oder Verstoß gegen diese Bedingungen sperren." },
        { heading: "Anwendbares Recht", body: `${NEEDS_OWNER_INPUT}: anwendbares Recht und zuständiger Gerichtsstand vom Betreiber festzulegen.` },
        { heading: "Kontakt", body: `${NEEDS_OWNER_INPUT}: Kontakt-E-Mail-Adresse für Fragen zu diesen Bedingungen.` },
      ],
    },
  },
  ru: {
    privacy: {
      title: "Политика конфиденциальности",
      updated: "Последнее обновление: заполняется владельцем",
      intro: "На этой странице описано, какие данные обрабатывает MMA Mastery, зачем и как реализовать свои права. Владелец дополнит её юридическими данными перед запуском.",
      sections: [
        { heading: "Оператор данных", body: `${NEEDS_OWNER_INPUT}: название юридического лица, адрес и регистрационный номер — заполнить здесь перед публикацией.` },
        { heading: "Собираемые данные", body: "Данные учётной записи (email), необязательный профиль спортсмена (имя, возраст, рост, вес, дисциплины, цели), тренировки и спарринги, прогресс по каталогу навыков, события клуба и посещаемость, загружаемые фото и языковые настройки." },
        { heading: "Цели обработки", body: "Эти данные используются исключительно для отслеживания тренировок, прогресса навыков, коуча и функций клуба — никогда для рекламы." },
        { heading: "Обработчики и получатели", body: "Данные размещаются в Supabase (база данных и хранилище). Поиск видео использует YouTube Data API от Google, запрашиваемый только по вашему запросу, без передачи ваших персональных данных Google." },
        { heading: "Срок хранения", body: "Ваши данные хранятся, пока существует ваш аккаунт. Удаление аккаунта можно запросить по контактным данным ниже." },
        { heading: "Файлы cookie", body: "Приложение использует только строго необходимые cookie: сессию аутентификации и языковые настройки. Рекламные и сторонние аналитические cookie не используются." },
        { heading: "Ваши права", body: "У вас есть право на доступ, исправление, удаление и перенос своих данных. Для этого обратитесь к владельцу по контактам ниже." },
        { heading: "Безопасность", body: "Доступ к данным защищён аутентификацией и политиками безопасности на уровне строк (Row Level Security): каждый пользователь видит только свои тренировочные данные." },
        { heading: "Контакты", body: `${NEEDS_OWNER_INPUT}: контактный email для запросов, связанных с персональными данными.` },
      ],
    },
    terms: {
      title: "Условия использования",
      updated: "Последнее обновление: заполняется владельцем",
      intro: "Эти условия регулируют использование MMA Mastery. Владелец дополнит их юридическими данными перед запуском.",
      sections: [
        { heading: "Издатель сервиса", body: `${NEEDS_OWNER_INPUT}: название юридического лица, адрес и регистрационный номер — заполнить здесь перед публикацией.` },
        { heading: "Предмет", body: "MMA Mastery — приложение для отслеживания тренировок, прогресса навыков и управления клубом для практикующих единоборства." },
        { heading: "Учётная запись", body: "Для доступа требуется создать учётную запись. Вы несёте ответственность за конфиденциальность своих данных для входа и точность предоставленной информации." },
        { heading: "Пользовательский контент", body: "Вы остаётесь владельцем загружаемых данных и фото. Вы гарантируете наличие необходимых прав на публикуемые фото, включая фото с узнаваемыми третьими лицами." },
        { heading: "Допустимое использование", body: "Сервис нельзя использовать для публикации незаконного контента, нарушения прав третьих лиц или попыток обойти меры безопасности." },
        { heading: "Доступность", body: "Сервис предоставляется «как есть». Возможны перерывы на обслуживание или временная недоступность." },
        { heading: "Прекращение использования", body: "Вы можете прекратить использование сервиса в любое время. Владелец может приостановить аккаунт при злоупотреблении или нарушении настоящих условий." },
        { heading: "Применимое право", body: `${NEEDS_OWNER_INPUT}: применимое право и компетентная юрисдикция уточняются владельцем.` },
        { heading: "Контакты", body: `${NEEDS_OWNER_INPUT}: контактный email по вопросам настоящих условий.` },
      ],
    },
  },
  ja: {
    privacy: {
      title: "プライバシーポリシー",
      updated: "最終更新日：運営者が記入予定",
      intro: "このページはMMA Masteryが取り扱うデータの内容、目的、権利行使の方法を説明します。公開前に運営者が法的情報を補完します。",
      sections: [
        { heading: "管理者情報", body: `${NEEDS_OWNER_INPUT}：法人名、所在地、登録番号を公開前にここに記入してください。` },
        { heading: "収集するデータ", body: "アカウント情報（メールアドレス）、任意の選手プロフィール（氏名、年齢、身長、体重、種目、目標）、トレーニングおよびスパーリング記録、スキルカタログの進捗、クラブのイベントと出席状況、アップロードした写真、言語設定。" },
        { heading: "利用目的", body: "これらのデータはトレーニング記録、スキル進捗、コーチ機能、クラブ機能の提供のみに使用され、広告目的には使用されません。" },
        { heading: "委託先・提供先", body: "データはSupabase（データベースおよびストレージ）でホストされます。動画検索にはGoogleのYouTube Data APIを使用しますが、ユーザーのリクエスト時のみ照会され、個人データがGoogleに送信されることはありません。" },
        { heading: "保存期間", body: "データはアカウントが存在する限り保存されます。アカウント削除は下記の連絡先までご依頼ください。" },
        { heading: "Cookie", body: "本アプリは必要最小限のCookieのみを使用します：認証セッションと言語設定です。広告や第三者による分析用Cookieは使用しません。" },
        { heading: "利用者の権利", body: "データへのアクセス、訂正、削除、ポータビリティを求める権利があります。行使する場合は下記の連絡先まで運営者にご連絡ください。" },
        { heading: "セキュリティ", body: "データへのアクセスは認証および行レベルセキュリティ（Row Level Security）で保護されており、各ユーザーは自分のトレーニングデータのみ閲覧できます。" },
        { heading: "連絡先", body: `${NEEDS_OWNER_INPUT}：個人データに関する問い合わせ用の連絡先メールアドレス。` },
      ],
    },
    terms: {
      title: "利用規約",
      updated: "最終更新日：運営者が記入予定",
      intro: "本規約はMMA Masteryの利用条件を定めます。公開前に運営者が法的情報を補完します。",
      sections: [
        { heading: "サービス運営者", body: `${NEEDS_OWNER_INPUT}：法人名、所在地、登録番号を公開前にここに記入してください。` },
        { heading: "目的", body: "MMA Masteryは格闘技実践者向けのトレーニング記録・スキル進捗・クラブ管理アプリです。" },
        { heading: "利用者アカウント", body: "利用にはアカウント作成が必要です。ログイン情報の管理および入力情報の正確性については利用者の責任となります。" },
        { heading: "利用者コンテンツ", body: "アップロードしたデータおよび写真の所有権は利用者に帰属します。公開する写真（第三者が特定できるものを含む）について必要な権利を有することを保証するものとします。" },
        { heading: "禁止事項", body: "違法なコンテンツの公開、第三者の権利侵害、セキュリティ対策の回避を目的とした利用はできません。" },
        { heading: "提供状況", body: "本サービスは「現状有姿」で提供されます。メンテナンスによる中断や一時的な利用不可が発生する場合があります。" },
        { heading: "利用終了", body: "利用者はいつでも利用を停止できます。運営者は不正利用または規約違反があった場合、アカウントを停止できます。" },
        { heading: "準拠法", body: `${NEEDS_OWNER_INPUT}：準拠法および管轄裁判所は運営者が定めます。` },
        { heading: "連絡先", body: `${NEEDS_OWNER_INPUT}：本規約に関する問い合わせ用の連絡先メールアドレス。` },
      ],
    },
  },
};
