const languageMap = {
    deutsch: "de",
    english: "en",
    français: "fr",
    español: "es",
    italiano: "it",
};

document.addEventListener('DOMContentLoaded', () => {
    // Sprachbuttons auslesen
    const languageButtons = document.querySelectorAll('.menu li a');

    // Elemente, die übersetzt werden sollen
    const elementsToTranslate = {
        // Header-Elemente
        languageText: document.getElementById('language-text'),
        headerTitle: document.getElementById('header-title'),
        searchTitle: document.getElementById('searchTitle'),
        postAd: document.getElementById('post-ad'),
        createAccount: document.getElementById('create-account'),
        joinCommunity: document.getElementById('join-community'),
        navHome: document.getElementById('nav-home'),
        navMarketplace: document.getElementById('nav-marketplace'),
        navGroups: document.getElementById('nav-groups'),
        navEvents: document.getElementById('nav-events'),
        navAds: document.getElementById('nav-ads'),
        navLogin: document.getElementById('nav-login'),

        // Main-Bereich
        adBannerMain: document.getElementById('ad-banner-main'),
        mainHeaderTitle: document.getElementById('main-header-title'),
        mainHeaderSubtitle: document.getElementById('main-header-subtitle'),
        mainHeaderDescription: document.getElementById('main-header-description'),
        announcementsTitle: document.getElementById('announcements-title'),
        announcementsSubtitle: document.getElementById('announcements-subtitle'),
        announcementsDescription: document.getElementById('announcements-description'),
        eventsTitle: document.getElementById('events-title'),
        eventsSubtitle: document.getElementById('events-subtitle'),
        eventsDescription: document.getElementById('events-description'),
        communityTitle: document.getElementById('community-title'),
        communitySubtitle: document.getElementById('community-subtitle'),
        communityDescription: document.getElementById('community-description'),
        mainBenefitsTitle: document.getElementById('main-benefits-title'),
        mainBenefit1: document.getElementById('main-benefit-1'),
        mainBenefit2: document.getElementById('main-benefit-2'),
        mainBenefit3: document.getElementById('main-benefit-3'),
        mainJoinCommunity: document.getElementById('main-join-community'),
        adBannerBottom: document.getElementById('ad-banner-bottom'),
        mainBackToHome: document.getElementById('main-back-to-home'),

        // Footer-Elemente
        footerHome: document.getElementById('accueil-footer'),
        footerAds: document.getElementById('annonces-footer'),
        footerEvents: document.getElementById('evenements-footer'),
        footerContact: document.getElementById('contact-footer'),
        footerTerms: document.getElementById('footer-cgu'),
        footerLegal: document.getElementById('footer-mentions'),
        footerPrivacy: document.getElementById('footer-privacy'),
        footerFacebook: document.getElementById('footer-facebook'),
        footerTwitter: document.getElementById('footer-twitter'),
        footerInstagram: document.getElementById('footer-instagram'),
        footerLinkedin: document.getElementById('footer-linkedin'),
        footerContactInfo: document.getElementById('footer-contact-info'),
        footerEmail: document.getElementById('footer-email'),
        footerPhone: document.getElementById('footer-phone'),
        footerAddress: document.getElementById('footer-address'),
        footerCopyright: document.getElementById('footer-copyright'),
        footerCredits: document.getElementById('footer-credits'),
        footerCreditsLink: document.getElementById('footer-credits-link'),

        // Main Inscription
        h1InscriptionTitle: document.getElementById('h1-inscription-title'),
        pInscriptionSubtitle: document.getElementById('p-inscription-subtitle'),
        labelNameInscription: document.getElementById('label-name-inscription'),
        labelEmailInscription: document.getElementById('label-email-inscription'),
        formTitlePasswordInscription: document.getElementById('form-title-password-inscription'),
        formDescriptionPasswordInscription: document.getElementById('form-description-password-inscription'),
        labelPasswordInscription: document.getElementById('label-password-inscription'),
        formdescriptionconfirmpasswordinscription: document.getElementById('form-description-confirm-password-inscription'),
        labelRepeatPasswordInscription: document.getElementById('label-repeat-password-inscription'),
        conditionsutilisationtext: document.getElementById('conditions-utilisation-text'),
        btnCreerComptIncription: document.getElementById('btn-creer-compt-incription'),
        vousAvezDejaUnCompteText: document.getElementById('vousAvezDejaUnCompteText'),
        linkVousAvezDejaUnCompte: document.getElementById('linkVousAvezDejaUnCompte'),
        besoinAideInscription: document.getElementById('besoin-aide-text'),

        linkContactezNousInscription: document.getElementById('link-contactez-nous-inscription'),
        linkRetourAccueilIncription: document.getElementById('link-retour-accueil-incription'),

        // Placeholder-Element hinzufügen
        inputNameInscription: document.getElementById('input-name-inscription'),
        inputEmailInscription: document.getElementById('input-email-inscription'),
        inputPassmotInscription: document.getElementById('input-password-inscription'),
        inputRepetezInscription: document.getElementById('input-repeat-password-inscription'),

        // Main Dashboard
        textDashboardApercuRapide: document.getElementById('text-dashboard-apercu-rapide'),
        messageTextDashboard: document.getElementById('message-text-dashboard'),
        annonceTextDashboard: document.getElementById('annonce-text-dashboard'),
        groupesTextDashboard: document.getElementById('groupes-text-dashboard'),
        dashboardLinkMessages: document.getElementById('dashboard-link-messages'),
        dashboardLinkNotifications: document.getElementById('dashboard-link-notifications'),
        dashboardLinkAnnonces: document.getElementById('dashboard-link-annonces'),
        dashboardLinkGroupes: document.getElementById('dashboard-link-groupes'),
        dashboardLinkFavoris: document.getElementById('dashboard-link-favoris'),
        dashboardLinkSettings: document.getElementById('dashboard-link-settings'),
        containerRechtsTextOben: document.getElementById('container-rechts-text-oben'),



    };



    // Funktion zum Laden der Sprachdatei
    function loadLanguage(language) {
        const langCode = languageMap[language.toLowerCase()] || "en";
        const url = `../src/lang/${langCode}.json`;

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Übersetzungen anwenden
                Object.keys(elementsToTranslate).forEach((key) => {
                    const element = elementsToTranslate[key];
                    if (element) {
                        if (key.startsWith("input") && data[key]) {
                            // Setzt den Placeholder
                            element.placeholder = data[key];
                        } else if (data[key]) {
                            // Setzt den textContent für normale Elemente
                            element.textContent = data[key];
                        }
                    }
                });

                // Main Inscription spezifisch zuweisen
                if (data.inscription) {
                    Object.keys(data.inscription).forEach((key) => {
                        if (elementsToTranslate[key]) {
                            if (key.startsWith("input") && data.inscription[key]) {
                                elementsToTranslate[key].placeholder = data.inscription[key];
                            } else {
                                elementsToTranslate[key].textContent = data.inscription[key];
                            }
                        }
                    });
                }
                if (data.dashboard) {
                    Object.keys(data.dashboard).forEach((key) => {
                        if (elementsToTranslate[key]) {
                            if (key.startsWith("input") && data.dashboard[key]) {
                                elementsToTranslate[key].placeholder = data.dashboard[key];
                            } else {
                                elementsToTranslate[key].textContent = data.dashboard[key];
                            }
                        }
                    });
                }
            

                // Spezielle Übersetzungen für Footer-Objekt
                if (data.footer) {
                    Object.keys(data.footer).forEach((key) => {
                        const footerKey = `footer${key.charAt(0).toUpperCase()}${key.slice(1)}`;
                        if (elementsToTranslate[footerKey]) {
                            elementsToTranslate[footerKey].textContent = data.footer[key];
                        }
                    });
                }
            })
            .catch((error) => {
                console.error("Error loading language:", error);
            });
    }


    // Sprachumschaltung über Buttons
    languageButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const language = button.getAttribute('data-lang');
            loadLanguage(language);
        });
    });

    // Standardmäßig Englisch laden
    loadLanguage("english");
});
