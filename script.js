const SHAKE_THRESHOLD = 80;
let lastTime = 0;
let lastX = 0,
  lastY = 0,
  lastZ = 0;
let isListening = false;
let eventCount = 0;

let tt = 1.0;
let qq = 0.0;

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
});

// ─── Détection du shake avec fallback sur acceleration (sans gravité) ─────────

function detectShake(event) {
  eventCount++;

  // Essayer d'abord accelerationIncludingGravity, puis acceleration
  const current =
    event.accelerationIncludingGravity?.x != null
      ? event.accelerationIncludingGravity
      : event.acceleration?.x != null
        ? event.acceleration
        : null;

  // Log des données brutes au premier événement et tous les 20 événements
  if (eventCount <= 3 || eventCount % 20 === 0) {
    console.log(
      `[#${eventCount}] aIG: ${JSON.stringify({
        x: event.accelerationIncludingGravity?.x,
        y: event.accelerationIncludingGravity?.y,
        z: event.accelerationIncludingGravity?.z,
      })} | a: ${JSON.stringify({
        x: event.acceleration?.x,
        y: event.acceleration?.y,
        z: event.acceleration?.z,
      })} | interval: ${event.interval}`,
    );
  }

  if (!current) {
    if (eventCount <= 3)
      console.log("⚠️ Aucune donnée d'accélération disponible");
    return;
  }

  const currentTime = Date.now();

  if (currentTime - lastTime > 100) {
    const timeDiff = currentTime - lastTime;
    lastTime = currentTime;

    const x = current.x ?? 0;
    const y = current.y ?? 0;
    const z = current.z ?? 0;

    const speed =
      (Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff) * 10000;

    if (eventCount % 20 === 0) console.log(`Speed: ${speed.toFixed(1)}`);

    if (speed > SHAKE_THRESHOLD) {
      handleShake();
    }

    lastX = x;
    lastY = y;
    lastZ = z;
  }
}

// ─── Détection plateforme ─────────────────────────────────────────────────────

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// ─── Activation ───────────────────────────────────────────────────────────────

function startListening() {
  console.log("🎧 Démarrage écoute devicemotion...");

  // Test rapide : est-ce que l'événement se déclenche du tout ?
  const testListener = (e) => {
    console.log(`✅ devicemotion reçu ! interval=${e.interval}`);
    console.log(
      `   accelerationIncludingGravity: x=${e.accelerationIncludingGravity?.x}`,
    );
    console.log(`   acceleration: x=${e.acceleration?.x}`);
    window.removeEventListener("devicemotion", testListener);
  };
  window.addEventListener("devicemotion", testListener);

  setTimeout(() => {
    window.addEventListener("devicemotion", detectShake);
    isListening = true;
    console.log("✅ Détection active");
  }, 200);
}

document.getElementById("activateBtn").addEventListener("click", async () => {
  console.log("👆 Bouton cliqué");
  console.log(`UA: ${navigator.userAgent.slice(0, 80)}`);
  console.log(`DeviceMotionEvent: ${typeof DeviceMotionEvent}`);
  console.log(
    `requestPermission: ${typeof DeviceMotionEvent?.requestPermission}`,
  );

  if (typeof DeviceMotionEvent === "undefined") {
    console.log("❌ DeviceMotionEvent non supporté");
    document.getElementById("popup").style.display = "none";
    document.getElementById("container").style.display = "block";
    return;
  }

  if (isIOS() && typeof DeviceMotionEvent.requestPermission === "function") {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      console.log(`Permission iOS: ${permission}`);
      if (permission === "granted") {
        startListening();
        document.getElementById("popup").style.display = "none";
        document.getElementById("container").style.display = "block";
      }
    } catch (error) {
      console.log(`❌ Erreur iOS: ${error}`);
    }
  } else {
    // Android + autres
    startListening();
    document.getElementById("popup").style.display = "none";
    document.getElementById("container").style.display = "block";
  }
});
