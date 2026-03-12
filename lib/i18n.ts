/**
 * VegSage i18n — FR / DE / EN
 * Cookie-based locale detection, no URL prefix.
 */

export type Locale = "fr" | "de" | "en";
export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["fr", "de", "en"];
export const LOCALE_COOKIE = "vegsage-locale";

// ---------- Dictionary type ----------
export interface Dict {
  common: {
    appName: string;
    tagline: string;
    notMedicalAdvice: string;
    backToHome: string;
    save: string;
    cancel: string;
    loading: string;
    error: string;
    success: string;
    learnMore: string;
    dismiss: string;
    delete: string;
    confirm: string;
    or: string;
  };
  nav: {
    dashboard: string;
    addFood: string;
    score: string;
    settings: string;
    pricing: string;
    signOut: string;
    signIn: string;
    signUp: string;
    home: string;
    legal: string;
  };
  auth: {
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    signInTitle: string;
    signUpTitle: string;
    signInCTA: string;
    signUpCTA: string;
    signupCheckEmail: string;
    alreadyHaveAccount: string;
    noAccount: string;
    showPassword: string;
    hidePassword: string;
    backToHome: string;
    agreePrefix: string;
    agreeSuffix: string;
    terms: string;
    and: string;
    privacy: string;
    forgotPasswordLink: string;
    forgotPasswordTitle: string;
    forgotPasswordDesc: string;
    forgotPasswordCTA: string;
    forgotPasswordSent: string;
    forgotPasswordError: string;
    resetPasswordTitle: string;
    newPasswordLabel: string;
    resetPasswordCTA: string;
    resetPasswordSuccess: string;
    resetPasswordError: string;
    invalidResetLink: string;
    backToLogin: string;
    errors: {
      invalid: string;
      emailTaken: string;
      weakPassword: string;
      network: string;
      generic: string;
      emailNotConfirmed: string;
    };
  };
  dashboard: {
    title: string;
    todayScore: string;
    weeklyScore: string;
    noData: string;
    noDataCTA: string;
    todayTitle: string;
    historyTitle: string;
    addFood: string;
    calories: string;
    totalToday: string;
    upgradePrompt: string;
    lastNDays: string;
    freeLimitNote: string;
    scoreOnTrack: string;
    scoreModerate: string;
    scoreNeedsAttention: string;
    scoreExplainer: string;
    historyPending: string;
    scoreBuilding: string;
    scoreBuildingHint: string;
    scoreInsufficient: string;
    scoreInsufficientHint: string;
    diagnosisTitle: string;
    diagnosisOkSuffix: string;
    diagnosisFailSuffix: string;
    suggestionTitle: string;
    suggestionIntro: string;
    upgradeFeatures: string[];
    deleteEntry: string;
  };
  addFood: {
    title: string;
    searchLabel: string;
    searchPlaceholder: string;
    searching: string;
    noResults: string;
    recentTitle: string;
    mealTypeLabel: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    unitG: string;
    addToLog: string;
    addingToLog: string;
    perHundredG: string;
    back: string;
    notFound: string;
    source: string;
    caloriesPreview: string;
    nutrientsPreview: string;
    mealBreakfast: string;
    mealLunch: string;
    mealDinner: string;
    mealSnack: string;
    addError: string;
  };
  score: {
    title: string;
    explanation: string;
    weeklyAvgTitle: string;
    breakdownTitle: string;
    noData: string;
    tipsTitle: string;
    globalScore: string;
    notEnoughData: string;
  };
  settings: {
    title: string;
    accountSection: string;
    emailLabel: string;
    localeLabel: string;
    localeOptions: { en: string; fr: string; de: string };
    vegTypeLabel: string;
    vegTypeOptions: {
      ovo_lacto: string;
      lacto: string;
      ovo: string;
      vegan: string;
    };
    dataSourceSection: string;
    dataSourceDesc: string;
    premiumSection: string;
    premiumActive: string;
    premiumPlan: string;
    premiumExpires: string;
    signOut: string;
    legalSection: string;
    dangerSection: string;
    deleteAccount: string;
    saveSuccess: string;
    goalsSection: string;
    goalsSaveBtn: string;
    goalsSaved: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthlyLabel: string;
    yearlyLabel: string;
    monthlyPrice: string;
    yearlyPrice: string;
    perMonth: string;
    perYear: string;
    savePercent: string;
    mostPopular: string;
    upgradeBtn: string;
    processingBtn: string;
    alreadyPremium: string;
    features: string[];
    paddleNote: string;
    cancelAnytime: string;
    freeTitle: string;
    freeFeatures: string[];
  };
  nutrients: {
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
    fiber: string;
    sugar: string;
    sodium: string;
    b12: string;
    iron: string;
    calcium: string;
    omega3: string;
    zinc: string;
    vitaminD: string;
    vitaminC: string;
    kcal: string;
    g: string;
    mg: string;
    mcg: string;
    dailyTarget: string;
    weeklyAvg: string;
    premiumVitaminsTitle: string;
  };
  insights: {
    b12: string;
    iron: string;
    protein: string;
    calcium: string;
    omega3: string;
    zinc: string;
    fiber: string;
  };
  suggestions: {
    b12: string[];
    iron: string[];
    protein: string[];
    calcium: string[];
    omega3: string[];
    zinc: string[];
    fiber: string[];
  };
  footer: {
    terms: string;
    privacy: string;
    refunds: string;
    contact: string;
    dataSources: string;
    rights: string;
    notMedical: string;
    dataBy: string;
    pricing: string;
  };
  errors: {
    network: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
    foodNotFound: string;
    tryAgain: string;
  };
  legal: {
    lastUpdated: string;
    terms: {
      title: string;
      intro: string;
      acceptanceTitle: string;
      acceptance: string;
      serviceTitle: string;
      service: string;
      healthTitle: string;
      health: string;
      paymentTitle: string;
      payment: string;
      ipTitle: string;
      ip: string;
      liabilityTitle: string;
      liability: string;
      liabilityData: string;
      terminationTitle: string;
      termination: string;
      lawTitle: string;
      law: string;
      contactTitle: string;
    };
    privacy: {
      title: string;
      intro: string;
      controllerTitle: string;
      dataTitle: string;
      data: string;
      purposeTitle: string;
      purpose: string;
      recipientsTitle: string;
      hosting: string;
      rightsTitle: string;
      rights: string;
      deletion: string;
      retentionTitle: string;
      retention: string;
      cookiesTitle: string;
      cookies: string;
      contactTitle: string;
    };
    refunds: {
      title: string;
      intro: string;
      eligibilityTitle: string;
      eligibility: string;
      howTitle: string;
      how: string;
      cancelTitle: string;
      cancel: string;
    };
    contact: {
      title: string;
      generalTitle: string;
      general: string;
      legalTitle: string;
      legal: string;
      billingTitle: string;
      billing: string;
      operatorTitle: string;
    };
    dataSources: {
      title: string;
      offTitle: string;
      offDesc: string;
      licenseTitle: string;
      usageTitle: string;
      usage: string;
      fdcTitle: string;
      fdc: string;
    };
  };
}

// ============================================================
// ENGLISH
// ============================================================
const en: Dict = {
  common: {
    appName: "VegSage",
    tagline: "Feel confident about your vegetarian nutrition.",
    notMedicalAdvice: "Not medical advice.",
    backToHome: "Back to home",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading…",
    error: "Error",
    success: "Success",
    learnMore: "Learn more",
    dismiss: "Dismiss",
    delete: "Delete",
    confirm: "Confirm",
    or: "or",
  },
  nav: {
    dashboard: "Dashboard",
    addFood: "Add food",
    score: "Score",
    settings: "Settings",
    pricing: "Pricing",
    signOut: "Sign out",
    signIn: "Sign in",
    signUp: "Sign up",
    home: "Home",
    legal: "Legal",
  },
  auth: {
    emailLabel: "Email",
    passwordLabel: "Password",
    confirmPasswordLabel: "Confirm password",
    signInTitle: "Sign in to VegSage",
    signUpTitle: "Create your account",
    signInCTA: "Sign in",
    signUpCTA: "Create account",
    signupCheckEmail: "Account created! Check your email to confirm your address before signing in.",
    alreadyHaveAccount: "Already have an account?",
    noAccount: "No account yet?",
    showPassword: "Show password",
    hidePassword: "Hide password",
    backToHome: "← Back to home",
    agreePrefix: "By signing up, you agree to our",
    agreeSuffix: ".",
    terms: "Terms",
    and: "and",
    privacy: "Privacy Policy",
    forgotPasswordLink: "Forgot password?",
    forgotPasswordTitle: "Reset your password",
    forgotPasswordDesc: "Enter your email and we'll send you a reset link.",
    forgotPasswordCTA: "Send reset link",
    forgotPasswordSent: "Check your inbox! We sent you a password reset link.",
    forgotPasswordError: "Could not send reset email. Please try again.",
    resetPasswordTitle: "Set new password",
    newPasswordLabel: "New password",
    resetPasswordCTA: "Update password",
    resetPasswordSuccess: "Password updated! Redirecting…",
    resetPasswordError: "Could not update password. The link may have expired.",
    invalidResetLink: "Invalid or expired reset link. Please request a new one.",
    backToLogin: "Back to sign in",
    errors: {
      invalid: "Invalid email or password.",
      emailTaken: "An account with this email already exists.",
      weakPassword: "Password must be at least 8 characters.",
      network: "Network error. Please check your connection.",
      generic: "Something went wrong. Please try again.",
      emailNotConfirmed: "Please confirm your email before signing in. Check your inbox for a confirmation link.",
    },
  },
  dashboard: {
    title: "Today",
    todayScore: "Today's Score",
    weeklyScore: "7-day Score",
    noData: "No meals logged yet.",
    noDataCTA: "Log your first food →",
    todayTitle: "Today's intake",
    historyTitle: "History",
    addFood: "+ Add food",
    calories: "Calories",
    totalToday: "Total today",
    upgradePrompt: "Upgrade to Premium for full history & insights.",
    lastNDays: "Last 7 days",
    freeLimitNote: "Free plan: last 7 days shown.",
    scoreOnTrack: "On track",
    scoreModerate: "Moderate",
    scoreNeedsAttention: "Needs attention",
    scoreExplainer: "Based on your 7-day rolling average",
    historyPending: "Calculating score…",
    scoreBuilding: "Score in progress",
    scoreBuildingHint: "Add a few more meals to analyse your nutrition.",
    scoreInsufficient: "Insufficient nutritional data",
    scoreInsufficientHint: "Add more foods to get a reliable score.",
    diagnosisTitle: "Quick diagnosis",
    diagnosisOkSuffix: "adequate",
    diagnosisFailSuffix: "insufficient",
    suggestionTitle: "VegSage suggestion",
    suggestionIntro: "To improve your score today:",
    upgradeFeatures: [
      "Complete nutritional analysis",
      "Automatic deficiency detection",
      "30-day score trend",
      "Full food history",
    ],
    deleteEntry: "Remove",
  },
  addFood: {
    title: "Add food",
    searchLabel: "Search food",
    searchPlaceholder: "e.g. lentils, tofu, spinach…",
    searching: "Searching…",
    noResults: "No results found.",
    recentTitle: "Recently used",
    mealTypeLabel: "Meal",
    quantityLabel: "Quantity (grams)",
    quantityPlaceholder: "e.g. 150",
    unitG: "g",
    addToLog: "Add to today",
    addingToLog: "Adding…",
    perHundredG: "per 100g",
    back: "← Back",
    notFound: "Product not found.",
    source: "USDA FoodData Central",
    caloriesPreview: "Calories",
    nutrientsPreview: "Nutrients",
    mealBreakfast: "Breakfast",
    mealLunch: "Lunch",
    mealDinner: "Dinner",
    mealSnack: "Snack",
    addError: "Unable to add this food right now. Please try again.",
  },
  score: {
    title: "Score detail",
    explanation:
      "Your Vegetarian Confidence Score is based on a 7-day rolling average of 6 key nutrients: B12, Iron, Protein, Calcium, Omega-3, and Zinc. Each is compared to a daily reference value. The global score is a weighted combination — B12 and Iron carry the most weight as they are the most common gaps in vegetarian diets.",
    weeklyAvgTitle: "Weekly average",
    breakdownTitle: "Nutrient breakdown",
    noData: "Log meals to see your score.",
    tipsTitle: "Sources",
    globalScore: "Vegetarian Confidence Score",
    notEnoughData: "Not enough data yet. Log meals for at least 1 day to see your score.",
  },
  settings: {
    title: "Settings",
    accountSection: "Account",
    emailLabel: "Email",
    localeLabel: "Language",
    localeOptions: { en: "English", fr: "Français", de: "Deutsch" },
    vegTypeLabel: "Vegetarian type",
    vegTypeOptions: {
      ovo_lacto: "Ovo-lacto vegetarian",
      lacto: "Lacto-vegetarian",
      ovo: "Ovo-vegetarian",
      vegan: "Vegan",
    },
    dataSourceSection: "Data sources",
    dataSourceDesc:
      "Food data from USDA FoodData Central (public domain). VegSage caches only the foods you search.",
    premiumSection: "Premium",
    premiumActive: "Premium active ✓",
    premiumPlan: "Plan:",
    premiumExpires: "Renews:",
    signOut: "Sign out",
    legalSection: "Legal",
    dangerSection: "Account",
    deleteAccount: "Delete account",
    saveSuccess: "Saved successfully.",
    goalsSection: "Daily Goals",
    goalsSaveBtn: "Save goals",
    goalsSaved: "Goals saved!",
  },
  pricing: {
    title: "Upgrade to VegSage Premium",
    subtitle: "Unlock advanced insights, full history and CSV export.",
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly",
    monthlyPrice: "€5.90",
    yearlyPrice: "€49",
    perMonth: "/ month",
    perYear: "/ year",
    savePercent: "Save 31%",
    mostPopular: "Most popular",
    upgradeBtn: "Upgrade now",
    processingBtn: "Processing…",
    alreadyPremium: "You are already a Premium member ✓",
    features: [
      "Unlimited history",
      "Advanced insights",
      "CSV export",
      "Priority support",
    ],
    paddleNote: "Payments handled securely by Paddle (Merchant of Record). Cancel anytime.",
    cancelAnytime: "Cancel anytime.",
    freeTitle: "Free",
    freeFeatures: [
      "7-day history",
      "Daily score",
      "3 insights",
      "Food search (USDA catalog)",
    ],
  },
  nutrients: {
    calories: "Calories",
    protein: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    fiber: "Fiber",
    sugar: "Sugar",
    sodium: "Sodium",
    b12: "Vitamin B12",
    iron: "Iron",
    calcium: "Calcium",
    omega3: "Omega-3",
    zinc: "Zinc",
    vitaminD: "Vitamin D",
    vitaminC: "Vitamin C",
    kcal: "kcal",
    g: "g",
    mg: "mg",
    mcg: "µg",
    dailyTarget: "Daily target",
    weeklyAvg: "7-day avg",
    premiumVitaminsTitle: "Premium vitamins",
  },
  insights: {
    b12: "Your B12 looks low this week. Consider fortified foods, and if needed discuss supplementation with a professional.",
    iron: "Iron intake seems low. Add lentils, beans, and pair iron-rich foods with vitamin C.",
    protein: "Protein is a bit low. Add legumes, tofu, tempeh, dairy or eggs.",
    calcium: "Calcium looks low. Consider fortified plant milks, dairy, tofu (calcium-set), or calcium-rich greens.",
    omega3: "Omega-3 is low. Add chia, flax, walnuts or algae-based options.",
    zinc: "Zinc seems low. Add pumpkin seeds, legumes, and whole grains.",
    fiber: "Fiber is low. Add vegetables, legumes, whole grains, and fruits.",
  },
  suggestions: {
    b12: ["nutritional yeast", "fortified plant milk", "tempeh"],
    iron: ["lentils", "spinach", "tofu"],
    protein: ["tofu", "chickpeas", "edamame"],
    calcium: ["almonds", "broccoli", "fortified plant milk"],
    omega3: ["chia seeds", "walnuts", "flaxseed"],
    zinc: ["pumpkin seeds", "chickpeas", "oats"],
    fiber: ["lentils", "oats", "broccoli"],
  },
  footer: {
    terms: "Terms",
    privacy: "Privacy",
    refunds: "Refunds",
    contact: "Contact",
    dataSources: "Data Sources",
    rights: "All rights reserved.",
    notMedical: "Not medical advice.",
    dataBy: "Food data: USDA FoodData Central (public domain)",
    pricing: "Pricing",
  },
  errors: {
    network: "Network error. Check your connection.",
    unauthorized: "You must be signed in.",
    notFound: "Page not found.",
    serverError: "Server error. Please try again.",
    foodNotFound: "Product not found.",
    tryAgain: "Try again",
  },
  legal: {
    lastUpdated: "Last updated",
    terms: {
      title: "Terms of Service",
      intro: "These Terms govern your use of VegSage. By creating an account, you agree to these Terms.",
      acceptanceTitle: "1. Acceptance",
      acceptance: "By using VegSage, you confirm you are at least 16 years old and agree to be bound by these Terms.",
      serviceTitle: "2. Service Description",
      service: "VegSage is a nutritional tracking tool for vegetarians. It uses a curated internal food catalog (nutritional values sourced from USDA FoodData Central) and does not generate, store or share personal health records with third parties beyond those listed in our Privacy Policy.",
      healthTitle: "3. Health Disclaimer",
      health: "VegSage provides general nutritional information for personal tracking only. It is NOT medical advice and does NOT replace guidance from a qualified health professional. Always consult a dietitian or physician for personalised medical guidance.",
      paymentTitle: "4. Payments",
      payment: "Premium features are available via subscription processed by Paddle (Merchant of Record). By subscribing you also accept Paddle's Buyer Terms. Refunds are governed by our Refund Policy.",
      ipTitle: "5. Intellectual Property",
      ip: "All code, design and content of VegSage (excluding USDA FoodData Central data and third-party assets) is owned by the Operator.",
      liabilityTitle: "6. Limitation of Liability",
      liability: "To the maximum extent permitted by law, the Operator is not liable for indirect, incidental or consequential damages. The service is provided 'as is'.",
      liabilityData: "Nutritional values are sourced from public databases and provided for informational purposes only. They may contain inaccuracies.",
      terminationTitle: "7. Termination",
      termination: "You may delete your account at any time. We may suspend accounts that violate these Terms.",
      lawTitle: "8. Governing Law",
      law: "These Terms are governed by the laws of Switzerland.",
      contactTitle: "9. Contact",
    },
    privacy: {
      title: "Privacy Policy",
      intro: "This policy describes how VegSage collects and uses your personal data.",
      controllerTitle: "1. Controller",
      dataTitle: "2. Data We Collect",
      data: "Account data (email, hashed password via Supabase), food & nutrition entries, profile preferences, payment status from Paddle, and standard technical logs.",
      purposeTitle: "3. Purposes & Legal Bases",
      purpose: "We process your data to provide the Service (contract), for security (legitimate interest), and to comply with legal obligations.",
      recipientsTitle: "4. Sub-processors",
      hosting: "Data is hosted on Supabase's secure infrastructure.",
      rightsTitle: "5. Your Rights",
      rights: "You have the right to access, rectify, erase, restrict, and port your data. Contact us to exercise your rights.",
      deletion: "Users may request complete deletion of their personal data by contacting support.",
      retentionTitle: "6. Data Retention",
      retention: "Account data is retained for as long as the user account remains active. Technical logs may be retained for up to 30 days for security and maintenance purposes. Data may be deleted upon user request.",
      cookiesTitle: "7. Cookies",
      cookies: "VegSage uses a single session cookie set by Supabase Auth. No third-party analytics cookies by default.",
      contactTitle: "8. Contact",
    },
    refunds: {
      title: "Refund Policy",
      intro: "VegSage Premium subscriptions are processed by Paddle.com Market Ltd. (Merchant of Record).",
      eligibilityTitle: "Eligibility",
      eligibility: "EU/EEA/UK consumers may exercise a 14-day right of withdrawal from the date of purchase, provided premium features have not been actively used. Billing errors or technical issues on our side are refunded in full.",
      howTitle: "How to Request",
      how: "Email contact.vegsage@gmail.com with subject 'Refund Request' and your account email. We respond within 5 business days.",
      cancelTitle: "Cancellation",
      cancel: "You may cancel anytime. You retain access until the end of your current billing period. Cancellation does not automatically trigger a refund for the current period.",
    },
    contact: {
      title: "Contact",
      generalTitle: "General support",
      general: "For questions about the app or your account:",
      legalTitle: "Legal / Privacy",
      legal: "To exercise data rights or for legal enquiries, email us with subject 'Data Request' or 'Legal Enquiry'.",
      billingTitle: "Billing",
      billing: "For subscription or payment issues, email with subject 'Billing'.",
      operatorTitle: "Operator",
    },
    dataSources: {
      title: "Data Sources & Attribution",
      offTitle: "",
      offDesc: "VegSage uses nutritional values from USDA FoodData Central. These data are in the public domain (U.S. government work). VegSage acknowledges USDA as the nutritional reference source.",
      licenseTitle: "",
      usageTitle: "",
      usage: "During food searches, only the search term may be transmitted to the database. No personal data is sent.",
      fdcTitle: "USDA FoodData Central",
      fdc: "",
    },
  },
};

// ============================================================
// FRENCH
// ============================================================
const fr: Dict = {
  common: {
    appName: "VegSage",
    tagline: "Soyez serein·e avec votre nutrition végétarienne.",
    notMedicalAdvice: "Pas un avis médical.",
    backToHome: "Retour à l'accueil",
    save: "Enregistrer",
    cancel: "Annuler",
    loading: "Chargement…",
    error: "Erreur",
    success: "Succès",
    learnMore: "En savoir plus",
    dismiss: "Ignorer",
    delete: "Supprimer",
    confirm: "Confirmer",
    or: "ou",
  },
  nav: {
    dashboard: "Tableau de bord",
    addFood: "Ajouter",
    score: "Score",
    settings: "Paramètres",
    pricing: "Tarifs",
    signOut: "Se déconnecter",
    signIn: "Connexion",
    signUp: "Inscription",
    home: "Accueil",
    legal: "Mentions légales",
  },
  auth: {
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    signInTitle: "Connexion à VegSage",
    signUpTitle: "Créer un compte",
    signInCTA: "Se connecter",
    signUpCTA: "Créer un compte",
    signupCheckEmail: "Compte créé ! Vérifiez votre e-mail pour confirmer votre adresse avant de vous connecter.",
    alreadyHaveAccount: "Déjà un compte ?",
    noAccount: "Pas encore de compte ?",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    backToHome: "← Retour à l'accueil",
    agreePrefix: "En vous inscrivant, vous acceptez nos",
    agreeSuffix: ".",
    terms: "Conditions d'utilisation",
    and: "et la",
    privacy: "Politique de confidentialité",
    forgotPasswordLink: "Mot de passe oublié ?",
    forgotPasswordTitle: "Réinitialiser votre mot de passe",
    forgotPasswordDesc: "Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.",
    forgotPasswordCTA: "Envoyer le lien",
    forgotPasswordSent: "Vérifiez votre boîte mail ! Nous vous avons envoyé un lien de réinitialisation.",
    forgotPasswordError: "Impossible d'envoyer l'e-mail. Veuillez réessayer.",
    resetPasswordTitle: "Définir un nouveau mot de passe",
    newPasswordLabel: "Nouveau mot de passe",
    resetPasswordCTA: "Mettre à jour le mot de passe",
    resetPasswordSuccess: "Mot de passe mis à jour ! Redirection…",
    resetPasswordError: "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.",
    invalidResetLink: "Lien invalide ou expiré. Veuillez en demander un nouveau.",
    backToLogin: "Retour à la connexion",
    errors: {
      invalid: "E-mail ou mot de passe invalide.",
      emailTaken: "Un compte avec cet e-mail existe déjà.",
      weakPassword: "Le mot de passe doit contenir au moins 8 caractères.",
      network: "Erreur réseau. Vérifiez votre connexion.",
      generic: "Une erreur est survenue. Veuillez réessayer.",
      emailNotConfirmed: "Veuillez confirmer votre e-mail avant de vous connecter. Vérifiez votre boîte de réception.",
    },
  },
  dashboard: {
    title: "Aujourd'hui",
    todayScore: "Score du jour",
    weeklyScore: "Score 7 jours",
    noData: "Aucun aliment enregistré aujourd'hui.",
    noDataCTA: "Enregistrer votre premier aliment →",
    todayTitle: "Apports du jour",
    historyTitle: "Historique",
    addFood: "+ Ajouter un aliment",
    calories: "Calories",
    totalToday: "Total aujourd'hui",
    upgradePrompt: "Passez en Premium pour l'historique complet et les insights.",
    lastNDays: "7 derniers jours",
    freeLimitNote: "Forfait gratuit : 7 derniers jours affichés.",
    scoreOnTrack: "En bonne voie",
    scoreModerate: "Modéré",
    scoreNeedsAttention: "À améliorer",
    scoreExplainer: "Basé sur votre moyenne glissante sur 7 jours",
    historyPending: "Score en cours de calcul…",
    scoreBuilding: "Score en construction",
    scoreBuildingHint: "Ajoutez quelques repas pour analyser votre nutrition.",
    scoreInsufficient: "Données nutritionnelles insuffisantes",
    scoreInsufficientHint: "Ajoutez plus d'aliments pour obtenir un score fiable.",
    diagnosisTitle: "Diagnostic rapide",
    diagnosisOkSuffix: "suffisant",
    diagnosisFailSuffix: "insuffisant",
    suggestionTitle: "Suggestion VegSage",
    suggestionIntro: "Pour améliorer votre score aujourd'hui :",
    upgradeFeatures: [
      "Analyse nutritionnelle complète",
      "Détection automatique des carences",
      "Évolution de votre score sur 30 jours",
      "Historique alimentaire complet",
    ],
    deleteEntry: "Supprimer",
  },
  addFood: {
    title: "Ajouter un aliment",
    searchLabel: "Rechercher un aliment",
    searchPlaceholder: "ex. lentilles, tofu, épinards…",
    searching: "Recherche…",
    noResults: "Aucun résultat trouvé.",
    recentTitle: "Récemment utilisés",
    mealTypeLabel: "Repas",
    quantityLabel: "Quantité (grammes)",
    quantityPlaceholder: "ex. 150",
    unitG: "g",
    addToLog: "Ajouter au journal",
    addingToLog: "Ajout…",
    perHundredG: "pour 100g",
    back: "← Retour",
    notFound: "Produit introuvable.",
    source: "USDA FoodData Central",
    caloriesPreview: "Calories",
    nutrientsPreview: "Nutriments",
    mealBreakfast: "Petit-déjeuner",
    mealLunch: "Déjeuner",
    mealDinner: "Dîner",
    mealSnack: "Collation",
    addError: "Impossible d'ajouter cet aliment pour le moment. Veuillez réessayer.",
  },
  score: {
    title: "Détail du score",
    explanation:
      "Le Score de Confiance Végétarien est basé sur une moyenne glissante de 7 jours pour 6 nutriments clés : B12, Fer, Protéines, Calcium, Oméga-3 et Zinc. Chacun est comparé à une valeur de référence journalière.",
    weeklyAvgTitle: "Moyenne hebdomadaire",
    breakdownTitle: "Détail par nutriment",
    noData: "Enregistrez des repas pour voir votre score.",
    tipsTitle: "Sources alimentaires",
    globalScore: "Score de Confiance Végétarien",
    notEnoughData: "Pas encore assez de données. Enregistrez au moins une journée.",
  },
  settings: {
    title: "Paramètres",
    accountSection: "Compte",
    emailLabel: "E-mail",
    localeLabel: "Langue",
    localeOptions: { en: "English", fr: "Français", de: "Deutsch" },
    vegTypeLabel: "Type de végétarisme",
    vegTypeOptions: {
      ovo_lacto: "Ovo-lacto-végétarien·ne",
      lacto: "Lacto-végétarien·ne",
      ovo: "Ovo-végétarien·ne",
      vegan: "Végane",
    },
    dataSourceSection: "Sources de données",
    dataSourceDesc:
      "Données alimentaires issues de USDA FoodData Central (domaine public). VegSage ne met en cache que les aliments que vous recherchez.",
    premiumSection: "Premium",
    premiumActive: "Premium actif ✓",
    premiumPlan: "Formule :",
    premiumExpires: "Renouvellement :",
    signOut: "Se déconnecter",
    legalSection: "Mentions légales",
    dangerSection: "Compte",
    deleteAccount: "Supprimer mon compte",
    saveSuccess: "Enregistré avec succès.",
    goalsSection: "Objectifs journaliers",
    goalsSaveBtn: "Enregistrer",
    goalsSaved: "Objectifs enregistrés !",
  },
  pricing: {
    title: "Passer à VegSage Premium",
    subtitle: "Débloquez les insights avancés, l'historique complet et l'export CSV.",
    monthlyLabel: "Mensuel",
    yearlyLabel: "Annuel",
    monthlyPrice: "5,90 €",
    yearlyPrice: "49 €",
    perMonth: "/ mois",
    perYear: "/ an",
    savePercent: "Économisez 31 %",
    mostPopular: "Le plus choisi",
    upgradeBtn: "Passer en Premium",
    processingBtn: "Traitement…",
    alreadyPremium: "Vous êtes déjà membre Premium ✓",
    features: [
      "Historique illimité",
      "Insights avancés",
      "Export CSV",
      "Support prioritaire",
    ],
    paddleNote: "Paiements sécurisés par Paddle (Marchand officiel). Annulable à tout moment.",
    cancelAnytime: "Annulable à tout moment.",
    freeTitle: "Gratuit",
    freeFeatures: [
      "Historique 7 jours",
      "Score journalier",
      "3 insights",
      "Recherche alimentaire (catalogue USDA)",
    ],
  },
  nutrients: {
    calories: "Calories",
    protein: "Protéines",
    fat: "Lipides",
    carbs: "Glucides",
    fiber: "Fibres",
    sugar: "Sucres",
    sodium: "Sodium",
    b12: "Vitamine B12",
    iron: "Fer",
    calcium: "Calcium",
    omega3: "Oméga-3",
    zinc: "Zinc",
    vitaminD: "Vitamine D",
    vitaminC: "Vitamine C",
    kcal: "kcal",
    g: "g",
    mg: "mg",
    mcg: "µg",
    dailyTarget: "Objectif journalier",
    weeklyAvg: "Moy. 7 jours",
    premiumVitaminsTitle: "Vitamines Premium",
  },
  insights: {
    b12: "Votre B12 est bas cette semaine. Pensez aux aliments enrichis et consultez un professionnel si nécessaire.",
    iron: "L'apport en fer semble faible. Ajoutez lentilles, haricots, et associez-les à de la vitamine C.",
    protein: "Les protéines sont un peu basses. Ajoutez légumineuses, tofu, tempeh, produits laitiers ou œufs.",
    calcium: "Le calcium est faible. Pensez aux laits végétaux enrichis, produits laitiers, tofu (au sulfate de calcium), ou légumes verts riches.",
    omega3: "L'Oméga-3 est bas. Ajoutez graines de chia, lin, noix ou sources d'algues.",
    zinc: "Le zinc semble faible. Ajoutez graines de courge, légumineuses et céréales complètes.",
    fiber: "Les fibres sont faibles. Ajoutez des légumes, légumineuses, céréales complètes et fruits.",
  },
  suggestions: {
    b12: ["levure nutritionnelle", "lait végétal enrichi", "tempeh"],
    iron: ["lentilles", "épinards", "tofu"],
    protein: ["tofu", "pois chiches", "edamame"],
    calcium: ["amandes", "brocoli", "lait végétal enrichi"],
    omega3: ["graines de chia", "noix", "graines de lin"],
    zinc: ["graines de courge", "pois chiches", "flocons d'avoine"],
    fiber: ["lentilles", "flocons d'avoine", "brocoli"],
  },
  footer: {
    terms: "CGU",
    privacy: "Confidentialité",
    refunds: "Remboursements",
    contact: "Contact",
    dataSources: "Sources de données",
    rights: "Tous droits réservés.",
    notMedical: "Pas un avis médical.",
    dataBy: "Données alimentaires : USDA FoodData Central (domaine public)",
    pricing: "Tarifs",
  },
  errors: {
    network: "Erreur réseau. Vérifiez votre connexion.",
    unauthorized: "Vous devez être connecté·e.",
    notFound: "Page introuvable.",
    serverError: "Erreur serveur. Veuillez réessayer.",
    foodNotFound: "Produit introuvable.",
    tryAgain: "Réessayer",
  },
  legal: {
    lastUpdated: "Dernière mise à jour",
    terms: {
      title: "Conditions d'utilisation",
      intro: "Ces conditions régissent votre utilisation de VegSage. En créant un compte, vous les acceptez.",
      acceptanceTitle: "1. Acceptation",
      acceptance: "En utilisant VegSage, vous confirmez avoir au moins 16 ans et acceptez ces conditions.",
      serviceTitle: "2. Description du service",
      service: "VegSage est un outil de suivi nutritionnel pour végétariens. Il utilise un catalogue interne d'aliments (valeurs nutritionnelles issues de USDA FoodData Central) et ne partage pas vos données personnelles de santé avec des tiers non mentionnés dans notre politique de confidentialité.",
      healthTitle: "3. Avertissement santé",
      health: "VegSage fournit des informations nutritionnelles générales à titre indicatif uniquement. Il ne s'agit PAS d'un avis médical. Consultez toujours un professionnel de santé qualifié.",
      paymentTitle: "4. Paiements",
      payment: "Les fonctionnalités Premium sont disponibles via abonnement traité par Paddle (Marchand officiel). En souscrivant, vous acceptez également les Conditions acheteur de Paddle.",
      ipTitle: "5. Propriété intellectuelle",
      ip: "Tout le code, le design et le contenu de VegSage (hors données USDA FoodData Central et actifs tiers) appartient à l'Opérateur.",
      liabilityTitle: "6. Limitation de responsabilité",
      liability: "Dans les limites permises par la loi, l'Opérateur n'est pas responsable des dommages indirects, accessoires ou consécutifs.",
      liabilityData: "Les valeurs nutritionnelles proviennent de bases de données publiques et sont fournies à titre indicatif uniquement. Elles peuvent contenir des imprécisions.",
      terminationTitle: "7. Résiliation",
      termination: "Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre les comptes enfreignant ces conditions.",
      lawTitle: "8. Droit applicable",
      law: "Ces conditions sont régies par le droit suisse.",
      contactTitle: "9. Contact",
    },
    privacy: {
      title: "Politique de confidentialité",
      intro: "Cette politique décrit comment VegSage collecte et utilise vos données personnelles.",
      controllerTitle: "1. Responsable du traitement",
      dataTitle: "2. Données collectées",
      data: "Données de compte (e-mail, mot de passe haché via Supabase), entrées alimentaires et nutritionnelles, préférences de profil, statut de paiement via Paddle, journaux techniques standards.",
      purposeTitle: "3. Finalités et bases légales",
      purpose: "Nous traitons vos données pour fournir le service (contrat), pour la sécurité (intérêt légitime) et pour respecter nos obligations légales.",
      recipientsTitle: "4. Sous-traitants",
      hosting: "Les données sont hébergées via l'infrastructure sécurisée de Supabase.",
      rightsTitle: "5. Vos droits",
      rights: "Vous disposez des droits d'accès, de rectification, d'effacement, de limitation et de portabilité. Contactez-nous pour exercer vos droits.",
      deletion: "Les utilisateurs peuvent demander la suppression complète de leurs données personnelles en contactant le support.",
      retentionTitle: "6. Conservation des données",
      retention: "Les données de compte sont conservées tant que le compte utilisateur reste actif. Les journaux techniques peuvent être conservés jusqu'à 30 jours pour des raisons de sécurité et de maintenance. Les données peuvent être supprimées à la demande de l'utilisateur.",
      cookiesTitle: "7. Cookies",
      cookies: "VegSage utilise un seul cookie de session défini par Supabase Auth. Aucun cookie d'analyse tiers par défaut.",
      contactTitle: "8. Contact",
    },
    refunds: {
      title: "Politique de remboursement",
      intro: "Les abonnements VegSage Premium sont traités par Paddle.com Market Ltd. (Marchand officiel).",
      eligibilityTitle: "Éligibilité",
      eligibility: "Les consommateurs UE/EEE/Royaume-Uni disposent d'un droit de rétractation de 14 jours à compter de la date d'achat, sous réserve de ne pas avoir utilisé les fonctionnalités Premium. Les erreurs de facturation sont intégralement remboursées.",
      howTitle: "Comment demander un remboursement",
      how: "Envoyez un e-mail à contact.vegsage@gmail.com avec le sujet 'Demande de remboursement' et l'e-mail de votre compte. Nous répondons sous 5 jours ouvrés.",
      cancelTitle: "Résiliation",
      cancel: "Vous pouvez annuler à tout moment. Vous conservez l'accès jusqu'à la fin de la période en cours.",
    },
    contact: {
      title: "Contact",
      generalTitle: "Support général",
      general: "Pour toute question sur l'application ou votre compte :",
      legalTitle: "Juridique / Confidentialité",
      legal: "Pour exercer vos droits sur les données ou pour des demandes juridiques, écrivez avec le sujet 'Demande de données' ou 'Demande juridique'.",
      billingTitle: "Facturation",
      billing: "Pour les problèmes d'abonnement ou de paiement, écrivez avec le sujet 'Facturation'.",
      operatorTitle: "Opérateur",
    },
    dataSources: {
      title: "Sources de données & attribution",
      offTitle: "",
      offDesc: "VegSage utilise des valeurs nutritionnelles provenant de USDA FoodData Central. Ces données sont dans le domaine public (œuvre du gouvernement américain). VegSage reconnaît USDA comme source de référence nutritionnelle.",
      licenseTitle: "",
      usageTitle: "",
      usage: "Lors des recherches alimentaires, seul le terme de recherche peut être transmis à la base de données. Aucune donnée personnelle n'est envoyée.",
      fdcTitle: "USDA FoodData Central",
      fdc: "",
    },
  },
};

// ============================================================
// GERMAN
// ============================================================
const de: Dict = {
  common: {
    appName: "VegSage",
    tagline: "Sicher in Ihrer vegetarischen Ernährung.",
    notMedicalAdvice: "Kein medizinischer Rat.",
    backToHome: "Zurück zur Startseite",
    save: "Speichern",
    cancel: "Abbrechen",
    loading: "Laden…",
    error: "Fehler",
    success: "Erfolg",
    learnMore: "Mehr erfahren",
    dismiss: "Schließen",
    delete: "Löschen",
    confirm: "Bestätigen",
    or: "oder",
  },
  nav: {
    dashboard: "Dashboard",
    addFood: "Hinzufügen",
    score: "Score",
    settings: "Einstellungen",
    pricing: "Preise",
    signOut: "Abmelden",
    signIn: "Anmelden",
    signUp: "Registrieren",
    home: "Startseite",
    legal: "Rechtliches",
  },
  auth: {
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    confirmPasswordLabel: "Passwort bestätigen",
    signInTitle: "Bei VegSage anmelden",
    signUpTitle: "Konto erstellen",
    signInCTA: "Anmelden",
    signUpCTA: "Konto erstellen",
    signupCheckEmail: "Konto erstellt! Überprüfen Sie Ihre E-Mail, um Ihre Adresse vor der Anmeldung zu bestätigen.",
    alreadyHaveAccount: "Bereits ein Konto?",
    noAccount: "Noch kein Konto?",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
    backToHome: "← Zurück zur Startseite",
    agreePrefix: "Mit der Registrierung stimmen Sie unseren",
    agreeSuffix: "zu.",
    terms: "Nutzungsbedingungen",
    and: "und der",
    privacy: "Datenschutzerklärung",
    forgotPasswordLink: "Passwort vergessen?",
    forgotPasswordTitle: "Passwort zurücksetzen",
    forgotPasswordDesc: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.",
    forgotPasswordCTA: "Link senden",
    forgotPasswordSent: "Überprüfen Sie Ihren Posteingang! Wir haben Ihnen einen Link zum Zurücksetzen gesendet.",
    forgotPasswordError: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    resetPasswordTitle: "Neues Passwort festlegen",
    newPasswordLabel: "Neues Passwort",
    resetPasswordCTA: "Passwort aktualisieren",
    resetPasswordSuccess: "Passwort aktualisiert! Weiterleitung…",
    resetPasswordError: "Passwort konnte nicht aktualisiert werden. Der Link ist möglicherweise abgelaufen.",
    invalidResetLink: "Ungültiger oder abgelaufener Link. Bitte fordern Sie einen neuen an.",
    backToLogin: "Zurück zur Anmeldung",
    errors: {
      invalid: "Ungültige E-Mail oder ungültiges Passwort.",
      emailTaken: "Ein Konto mit dieser E-Mail-Adresse existiert bereits.",
      weakPassword: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      network: "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.",
      generic: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
      emailNotConfirmed: "Bitte bestätigen Sie Ihre E-Mail vor der Anmeldung. Überprüfen Sie Ihren Posteingang.",
    },
  },
  dashboard: {
    title: "Heute",
    todayScore: "Score heute",
    weeklyScore: "7-Tage-Score",
    noData: "Noch keine Mahlzeiten eingetragen.",
    noDataCTA: "Erste Mahlzeit eintragen →",
    todayTitle: "Heutige Aufnahme",
    historyTitle: "Verlauf",
    addFood: "+ Lebensmittel hinzufügen",
    calories: "Kalorien",
    totalToday: "Gesamt heute",
    upgradePrompt: "Premium für vollständigen Verlauf und Insights upgraden.",
    lastNDays: "Letzte 7 Tage",
    freeLimitNote: "Kostenloser Plan: Letzte 7 Tage angezeigt.",
    scoreOnTrack: "Auf Kurs",
    scoreModerate: "Mäßig",
    scoreNeedsAttention: "Verbesserungsbedarf",
    scoreExplainer: "Basierend auf Ihrem gleitenden 7-Tage-Durchschnitt",
    historyPending: "Score wird berechnet…",
    scoreBuilding: "Score im Aufbau",
    scoreBuildingHint: "Fügen Sie einige Mahlzeiten hinzu, um Ihre Ernährung zu analysieren.",
    scoreInsufficient: "Unzureichende Nährstoffdaten",
    scoreInsufficientHint: "Fügen Sie mehr Lebensmittel hinzu für einen zuverlässigen Score.",
    diagnosisTitle: "Schnelldiagnose",
    diagnosisOkSuffix: "ausreichend",
    diagnosisFailSuffix: "unzureichend",
    suggestionTitle: "VegSage-Tipp",
    suggestionIntro: "Um Ihren heutigen Score zu verbessern:",
    upgradeFeatures: [
      "Vollständige Nährwertanalyse",
      "Automatische Mangelerkennung",
      "Score-Entwicklung über 30 Tage",
      "Vollständige Ernährungshistorie",
    ],
    deleteEntry: "Entfernen",
  },
  addFood: {
    title: "Lebensmittel hinzufügen",
    searchLabel: "Lebensmittel suchen",
    searchPlaceholder: "z. B. Linsen, Tofu, Spinat…",
    searching: "Suche…",
    noResults: "Keine Ergebnisse gefunden.",
    recentTitle: "Zuletzt verwendet",
    mealTypeLabel: "Mahlzeit",
    quantityLabel: "Menge (Gramm)",
    quantityPlaceholder: "z. B. 150",
    unitG: "g",
    addToLog: "Zum Tagesprotokoll hinzufügen",
    addingToLog: "Wird hinzugefügt…",
    perHundredG: "pro 100g",
    back: "← Zurück",
    notFound: "Produkt nicht gefunden.",
    source: "USDA FoodData Central",
    caloriesPreview: "Kalorien",
    nutrientsPreview: "Nährstoffe",
    mealBreakfast: "Frühstück",
    mealLunch: "Mittagessen",
    mealDinner: "Abendessen",
    mealSnack: "Snack",
    addError: "Dieses Lebensmittel kann gerade nicht hinzugefügt werden. Bitte versuchen Sie es erneut.",
  },
  score: {
    title: "Score-Details",
    explanation:
      "Ihr Vegetarischer Vertrauens-Score basiert auf einem gleitenden 7-Tage-Durchschnitt von 6 Schlüsselnährstoffen: B12, Eisen, Protein, Kalzium, Omega-3 und Zink. Jeder wird mit einem täglichen Referenzwert verglichen.",
    weeklyAvgTitle: "Wochendurchschnitt",
    breakdownTitle: "Nährstoffaufschlüsselung",
    noData: "Tragen Sie Mahlzeiten ein, um Ihren Score zu sehen.",
    tipsTitle: "Nahrungsquellen",
    globalScore: "Vegetarischer Vertrauens-Score",
    notEnoughData: "Noch nicht genug Daten. Tragen Sie mindestens einen Tag ein.",
  },
  settings: {
    title: "Einstellungen",
    accountSection: "Konto",
    emailLabel: "E-Mail",
    localeLabel: "Sprache",
    localeOptions: { en: "English", fr: "Français", de: "Deutsch" },
    vegTypeLabel: "Vegetarischer Typ",
    vegTypeOptions: {
      ovo_lacto: "Ovo-lacto-vegetarisch",
      lacto: "Lacto-vegetarisch",
      ovo: "Ovo-vegetarisch",
      vegan: "Vegan",
    },
    dataSourceSection: "Datenquellen",
    dataSourceDesc:
      "Lebensmitteldaten von USDA FoodData Central (gemeinfrei). VegSage speichert nur die von Ihnen gesuchten Lebensmittel.",
    premiumSection: "Premium",
    premiumActive: "Premium aktiv ✓",
    premiumPlan: "Plan:",
    premiumExpires: "Erneuerung:",
    signOut: "Abmelden",
    legalSection: "Rechtliches",
    dangerSection: "Konto",
    deleteAccount: "Konto löschen",
    saveSuccess: "Erfolgreich gespeichert.",
    goalsSection: "Tagesziele",
    goalsSaveBtn: "Ziele speichern",
    goalsSaved: "Ziele gespeichert!",
  },
  pricing: {
    title: "Upgrade auf VegSage Premium",
    subtitle: "Erweiterte Insights, vollständiger Verlauf und CSV-Export.",
    monthlyLabel: "Monatlich",
    yearlyLabel: "Jährlich",
    monthlyPrice: "5,90 €",
    yearlyPrice: "49 €",
    perMonth: "/ Monat",
    perYear: "/ Jahr",
    savePercent: "31 % sparen",
    mostPopular: "Beliebteste Option",
    upgradeBtn: "Jetzt upgraden",
    processingBtn: "Wird verarbeitet…",
    alreadyPremium: "Sie sind bereits Premium-Mitglied ✓",
    features: [
      "Unbegrenzter Verlauf",
      "Erweiterte Insights",
      "CSV-Export",
      "Prioritäts-Support",
    ],
    paddleNote: "Sichere Zahlungsabwicklung durch Paddle (Merchant of Record). Jederzeit kündbar.",
    cancelAnytime: "Jederzeit kündbar.",
    freeTitle: "Kostenlos",
    freeFeatures: [
      "7-Tage-Verlauf",
      "Täglicher Score",
      "3 Insights",
      "Lebensmittelsuche (USDA-Katalog)",
    ],
  },
  nutrients: {
    calories: "Kalorien",
    protein: "Protein",
    fat: "Fett",
    carbs: "Kohlenhydrate",
    fiber: "Ballaststoffe",
    sugar: "Zucker",
    sodium: "Natrium",
    b12: "Vitamin B12",
    iron: "Eisen",
    calcium: "Kalzium",
    omega3: "Omega-3",
    zinc: "Zink",
    vitaminD: "Vitamin D",
    vitaminC: "Vitamin C",
    kcal: "kcal",
    g: "g",
    mg: "mg",
    mcg: "µg",
    dailyTarget: "Tagesziel",
    weeklyAvg: "7-Tage-Ø",
    premiumVitaminsTitle: "Premium-Vitamine",
  },
  insights: {
    b12: "Ihr B12 ist diese Woche niedrig. Erwägen Sie angereicherte Lebensmittel und besprechen Sie ggf. eine Supplementierung mit einem Fachmann.",
    iron: "Die Eisenzufuhr scheint niedrig. Fügen Sie Linsen, Bohnen hinzu und kombinieren Sie eisenreiche Lebensmittel mit Vitamin C.",
    protein: "Protein ist etwas niedrig. Fügen Sie Hülsenfrüchte, Tofu, Tempeh, Milchprodukte oder Eier hinzu.",
    calcium: "Kalzium ist niedrig. Denken Sie an angereicherte Pflanzenmilch, Milchprodukte, Kalzium-Tofu oder kalziumreiche Grünpflanzen.",
    omega3: "Omega-3 ist niedrig. Fügen Sie Chia, Leinsamen, Walnüsse oder Algenquellen hinzu.",
    zinc: "Zink scheint niedrig. Fügen Sie Kürbiskerne, Hülsenfrüchte und Vollkorn hinzu.",
    fiber: "Ballaststoffe sind niedrig. Fügen Sie Gemüse, Hülsenfrüchte, Vollkorn und Obst hinzu.",
  },
  suggestions: {
    b12: ["Hefeflocken", "angereichertes Pflanzenmilch", "Tempeh"],
    iron: ["Linsen", "Spinat", "Tofu"],
    protein: ["Tofu", "Kichererbsen", "Edamame"],
    calcium: ["Mandeln", "Brokkoli", "angereichertes Pflanzenmilch"],
    omega3: ["Chiasamen", "Walnüsse", "Leinsamen"],
    zinc: ["Kürbiskerne", "Kichererbsen", "Haferflocken"],
    fiber: ["Linsen", "Haferflocken", "Brokkoli"],
  },
  footer: {
    terms: "AGB",
    privacy: "Datenschutz",
    refunds: "Rückerstattungen",
    contact: "Kontakt",
    dataSources: "Datenquellen",
    rights: "Alle Rechte vorbehalten.",
    notMedical: "Kein medizinischer Rat.",
    dataBy: "Lebensmitteldaten: USDA FoodData Central (gemeinfrei)",
    pricing: "Preise",
  },
  errors: {
    network: "Netzwerkfehler. Überprüfen Sie Ihre Verbindung.",
    unauthorized: "Sie müssen angemeldet sein.",
    notFound: "Seite nicht gefunden.",
    serverError: "Serverfehler. Bitte versuchen Sie es erneut.",
    foodNotFound: "Produkt nicht gefunden.",
    tryAgain: "Erneut versuchen",
  },
  legal: {
    lastUpdated: "Letzte Aktualisierung",
    terms: {
      title: "Nutzungsbedingungen",
      intro: "Diese Bedingungen regeln Ihre Nutzung von VegSage. Mit der Kontoerstellung akzeptieren Sie diese Bedingungen.",
      acceptanceTitle: "1. Akzeptanz",
      acceptance: "Durch die Nutzung von VegSage bestätigen Sie, mindestens 16 Jahre alt zu sein und diese Bedingungen zu akzeptieren.",
      serviceTitle: "2. Leistungsbeschreibung",
      service: "VegSage ist ein Ernährungstracker für Vegetarier. Er nutzt einen internen Lebensmittelkatalog (Nährwerte aus USDA FoodData Central) und gibt keine persönlichen Gesundheitsdaten an Dritte weiter, die nicht in unserer Datenschutzrichtlinie aufgeführt sind.",
      healthTitle: "3. Gesundheitshinweis",
      health: "VegSage liefert allgemeine Ernährungsinformationen nur zur persönlichen Orientierung. Es handelt sich NICHT um medizinischen Rat. Konsultieren Sie stets einen qualifizierten Gesundheitsfachmann.",
      paymentTitle: "4. Zahlungen",
      payment: "Premium-Funktionen sind über ein Abonnement verfügbar, das von Paddle (Merchant of Record) abgewickelt wird. Mit dem Abonnement akzeptieren Sie auch die Käuferbedingungen von Paddle.",
      ipTitle: "5. Geistiges Eigentum",
      ip: "Code, Design und Inhalte von VegSage (ausgenommen USDA FoodData Central-Daten und Drittanbieter-Assets) sind Eigentum des Betreibers.",
      liabilityTitle: "6. Haftungsbeschränkung",
      liability: "Soweit gesetzlich zulässig, haftet der Betreiber nicht für indirekte, zufällige oder Folgeschäden.",
      liabilityData: "Nährwerte stammen aus öffentlichen Datenbanken und werden nur zu Informationszwecken bereitgestellt. Sie können Ungenauigkeiten enthalten.",
      terminationTitle: "7. Kündigung",
      termination: "Sie können Ihr Konto jederzeit löschen. Wir können Konten sperren, die gegen diese Bedingungen verstoßen.",
      lawTitle: "8. Anwendbares Recht",
      law: "Diese Bedingungen unterliegen dem Schweizer Recht.",
      contactTitle: "9. Kontakt",
    },
    privacy: {
      title: "Datenschutzerklärung",
      intro: "Diese Richtlinie beschreibt, wie VegSage Ihre personenbezogenen Daten erhebt und verwendet.",
      controllerTitle: "1. Verantwortlicher",
      dataTitle: "2. Erhobene Daten",
      data: "Kontodaten (E-Mail, gehashtes Passwort über Supabase), Lebensmittel- und Ernährungseinträge, Profilpräferenzen, Zahlungsstatus über Paddle, Standard-Technikprotokolle.",
      purposeTitle: "3. Zwecke und Rechtsgrundlagen",
      purpose: "Wir verarbeiten Ihre Daten zur Erbringung des Dienstes (Vertrag), für Sicherheitszwecke (berechtigtes Interesse) und zur Erfüllung gesetzlicher Verpflichtungen.",
      recipientsTitle: "4. Unterauftragsverarbeiter",
      hosting: "Die Daten werden über die sichere Infrastruktur von Supabase gehostet.",
      rightsTitle: "5. Ihre Rechte",
      rights: "Sie haben das Recht auf Zugang, Berichtigung, Löschung, Einschränkung und Übertragbarkeit Ihrer Daten. Kontaktieren Sie uns zur Ausübung Ihrer Rechte.",
      deletion: "Benutzer können die vollständige Löschung ihrer personenbezogenen Daten durch Kontaktaufnahme mit dem Support beantragen.",
      retentionTitle: "6. Datenspeicherung",
      retention: "Kontodaten werden gespeichert, solange das Benutzerkonto aktiv ist. Technische Protokolle können aus Sicherheits- und Wartungsgründen bis zu 30 Tage aufbewahrt werden. Daten können auf Anfrage des Benutzers gelöscht werden.",
      cookiesTitle: "7. Cookies",
      cookies: "VegSage verwendet nur ein Session-Cookie, das von Supabase Auth gesetzt wird. Standardmäßig keine Analyse-Cookies von Drittanbietern.",
      contactTitle: "8. Kontakt",
    },
    refunds: {
      title: "Rückerstattungsrichtlinie",
      intro: "VegSage Premium-Abonnements werden von Paddle.com Market Ltd. (Merchant of Record) abgewickelt.",
      eligibilityTitle: "Berechtigung",
      eligibility: "Verbraucher in der EU/EWR/UK haben ab Kaufdatum ein 14-tägiges Widerrufsrecht, sofern die Premium-Funktionen nicht aktiv genutzt wurden. Abrechnungsfehler werden vollständig erstattet.",
      howTitle: "Antrag auf Rückerstattung",
      how: "Senden Sie eine E-Mail an contact.vegsage@gmail.com mit dem Betreff 'Erstattungsantrag' und Ihrer Konto-E-Mail. Wir antworten innerhalb von 5 Werktagen.",
      cancelTitle: "Kündigung",
      cancel: "Sie können jederzeit kündigen. Der Zugang bleibt bis zum Ende des laufenden Abrechnungszeitraums erhalten.",
    },
    contact: {
      title: "Kontakt",
      generalTitle: "Allgemeiner Support",
      general: "Für Fragen zur App oder Ihrem Konto:",
      legalTitle: "Rechtliches / Datenschutz",
      legal: "Für Datenschutzanfragen oder rechtliche Anfragen schreiben Sie mit dem Betreff 'Datenanfrage' oder 'Rechtliche Anfrage'.",
      billingTitle: "Abrechnung",
      billing: "Bei Abonnement- oder Zahlungsproblemen schreiben Sie mit dem Betreff 'Abrechnung'.",
      operatorTitle: "Betreiber",
    },
    dataSources: {
      title: "Datenquellen & Namensnennung",
      offTitle: "",
      offDesc: "VegSage verwendet Nährwerte aus USDA FoodData Central. Diese Daten sind gemeinfrei (Werk der US-Bundesregierung). VegSage erkennt USDA als nutritive Referenzquelle an.",
      licenseTitle: "",
      usageTitle: "",
      usage: "Bei Lebensmittelsuchen wird nur der Suchbegriff an die Datenbank übermittelt. Es werden keine personenbezogenen Daten gesendet.",
      fdcTitle: "USDA FoodData Central",
      fdc: "",
    },
  },
};

// ============================================================
// Exports
// ============================================================
export const dictionaries: Record<Locale, Dict> = { en, fr, de };

export function getT(locale: Locale): Dict {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getLocaleFromCookie(value?: string | null): Locale {
  if (value === "fr" || value === "de" || value === "en") return value;
  return defaultLocale;
}
