document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.querySelector(".burgerButton");
  const menu = document.querySelector(".menu");
  const menuLinks = document.querySelectorAll(".menu a"); // Alle Links im Menü

  // Öffnen und Schließen des Menüs beim Klicken auf den Burger-Button
  burgerButton.addEventListener("click", () => {
    menu.classList.toggle("active");
  });

  // Menü schließen, wenn auf einen Link geklickt wird
  menuLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Verhindert die Standardaktion (falls nötig)
      menu.classList.remove("active"); // Entfernt die 'active'-Klasse, um das Menü zu schließen
      const href = link.getAttribute("href"); // Holt den Ziel-Link
      if (href) {
        window.location.href = href; // Navigiert zur Zielseite, falls ein Link vorhanden ist
      }
    });
  });
});
/* Script für Freundesliste */
  // Array mit den Namen der Freunde
  const friends = [
    'Frieyxdfvfgsnd 1', 'Friend 2', 'Friend 3', 'Friend 4', 'Friend 5',
 
];

// Zugriff auf den Container
const container = document.getElementById('friends-container');

// Erstelle für jeden Freund ein Element
friends.forEach((friend, index) => {
    const friendDiv = document.createElement('div');
    friendDiv.classList.add('friend');
    friendDiv.id = `friend${index + 1}`;

    // Erstelle den Punkt für den Status
    const statusPoint = document.createElement('span');
    statusPoint.classList.add('status-point');
    statusPoint.id = `status${index + 1}`;

    // Erstelle den Namen des Freundes
    const friendName = document.createElement('span');
    friendName.classList.add('friend-name');
    friendName.textContent = friend;

    // Füge die Elemente zum div hinzu
    friendDiv.appendChild(statusPoint);
    friendDiv.appendChild(friendName);

    // Füge das div zum Container hinzu
    container.appendChild(friendDiv);
});

/* Ende Script für Freundesliste */