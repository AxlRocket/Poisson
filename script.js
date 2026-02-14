const SHAKE_THRESHOLD = 80;
let lastTime = 0;
let lastX = 0,
  lastY = 0,
  lastZ = 0;
let isListening = false;

let tt = 1.0;
let qq = 0.0;

//document.getElementById("test").addEventListener("click", handleShake);

function handleShake() {
  console.log("Téléphone secoué !");
  tt = tt - 0.05;
  qq = qq + 0.05;

  if (tt >= 0) document.getElementById("op").style.opacity = tt;
  if (qq <= 1) document.getElementById("question").style.opacity = qq;
}

document.getElementById("container").addEventListener("click", () => {
  if (tt <= 0.15) {
    document.getElementById("container").classList.toggle("flipped");
  }
  //document.getElementById("container").classList.toggle("flipped");
});

function detectShake(event) {
  const current = event.accelerationIncludingGravity;

  // Vérifier que les données sont valides
  if (
    !current ||
    (current.x === null && current.y === null && current.z === null)
  ) {
    console.log("Pas de données d'accélération");
    return;
  }

  const currentTime = new Date().getTime();

  if (currentTime - lastTime > 100) {
    const timeDiff = currentTime - lastTime;
    lastTime = currentTime;

    const x = current.x || 0;
    const y = current.y || 0;
    const z = current.z || 0;

    const speed =
      (Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff) * 10000;

    console.log("Speed:", speed); // Pour déboguer

    if (speed > SHAKE_THRESHOLD) {
      handleShake();
    }

    lastX = x;
    lastY = y;
    lastZ = z;
  }
}

// Fonction pour "réveiller" les capteurs
function wakeUpSensors() {
  console.log("Réveil des capteurs...");
  // Créer un faux événement tactile pour réveiller les capteurs
  const dummyListener = (e) => {
    console.log("Capteur réveillé", e.accelerationIncludingGravity);
  };

  window.addEventListener("devicemotion", dummyListener, { once: true });

  // Attendre un peu puis activer le vrai listener
  setTimeout(() => {
    window.removeEventListener("devicemotion", dummyListener);
    window.addEventListener("devicemotion", detectShake);
    isListening = true;
    console.log("Détection active");
  }, 100);
}

document.getElementById("activateBtn").addEventListener("click", async () => {
  console.log("Bouton cliqué");
  wakeUpSensors(); // Utiliser la fonction de réveil
  document.getElementById("popup").style.display = "none";
  document.getElementById("container").style.display = "block";
});
