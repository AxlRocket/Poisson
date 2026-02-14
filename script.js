const SHAKE_THRESHOLD = 80;
let lastTime = 0;
let lastX = 0,
  lastY = 0,
  lastZ = 0;

let tt = 1.0;
let qq = 0.0;

function handleShake() {
  tt = Math.max(0, tt - 0.05);
  qq = Math.min(1, qq + 0.05);
  document.getElementById("op").style.opacity = tt;
  document.getElementById("question").style.opacity = qq;
}

document.getElementById("container").addEventListener("click", () => {
  if (tt <= 0.15) {
    document.getElementById("container").classList.toggle("flipped");
  }
});

// ─── Tentative avec l'API Sensor (plus moderne, meilleur support Android) ─────

function tryModernSensor() {
  if (typeof Accelerometer === "undefined") {
    console.log("⚠️ Accelerometer API non disponible, fallback devicemotion");
    startDeviceMotion();
    return;
  }

  try {
    console.log("🔬 Tentative Accelerometer API...");
    const sensor = new Accelerometer({ frequency: 30 });

    sensor.addEventListener("error", (e) => {
      console.log(
        `❌ Accelerometer erreur: ${e.error.name} - ${e.error.message}`,
      );
      console.log("→ Fallback sur devicemotion");
      startDeviceMotion();
    });

    sensor.addEventListener("reading", () => {
      const currentTime = Date.now();
      if (currentTime - lastTime > 100) {
        const timeDiff = currentTime - lastTime || 1;
        lastTime = currentTime;

        const x = sensor.x ?? 0;
        const y = sensor.y ?? 0;
        const z = sensor.z ?? 0;

        const speed =
          (Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff) * 10000;

        if (speed > SHAKE_THRESHOLD) handleShake();

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    sensor.start();
    console.log("✅ Accelerometer API démarré");
  } catch (err) {
    console.log(`❌ Accelerometer exception: ${err.name} - ${err.message}`);
    startDeviceMotion();
  }
}

// ─── Fallback classique devicemotion ─────────────────────────────────────────

function startDeviceMotion() {
  let eventCount = 0;

  window.addEventListener("devicemotion", (event) => {
    eventCount++;

    // Chercher une source de données valide
    let current = null;
    if (event.accelerationIncludingGravity?.x != null) {
      current = event.accelerationIncludingGravity;
    } else if (event.acceleration?.x != null) {
      current = event.acceleration;
    }

    if (eventCount <= 5) {
      console.log(
        `[devicemotion #${eventCount}] aIG.x=${event.accelerationIncludingGravity?.x} a.x=${event.acceleration?.x}`,
      );
    }

    if (!current) return;

    const currentTime = Date.now();
    if (currentTime - lastTime > 100) {
      const timeDiff = currentTime - lastTime || 1;
      lastTime = currentTime;

      const x = current.x ?? 0;
      const y = current.y ?? 0;
      const z = current.z ?? 0;

      const speed =
        (Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff) * 10000;

      if (speed > SHAKE_THRESHOLD) handleShake();

      lastX = x;
      lastY = y;
      lastZ = z;
    }
  });

  console.log("✅ devicemotion écouté");
}

// ─── Vérification permission via Permissions API ──────────────────────────────

async function checkSensorPermission() {
  if (!navigator.permissions) {
    console.log("ℹ️ Permissions API non disponible");
    return null;
  }

  try {
    const result = await navigator.permissions.query({ name: "accelerometer" });
    console.log(`🔐 Permission accelerometer: ${result.state}`);
    // "granted" | "denied" | "prompt"
    return result.state;
  } catch (e) {
    console.log(`ℹ️ Permissions.query non supporté: ${e.message}`);
    return null;
  }
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

document.getElementById("activateBtn").addEventListener("click", async () => {
  console.log(
    `Chrome: ${/Chrome\/(\d+)/.exec(navigator.userAgent)?.[1] ?? "?"}`,
  );

  document.getElementById("popup").style.display = "none";
  document.getElementById("container").style.display = "block";

  if (isIOS() && typeof DeviceMotionEvent.requestPermission === "function") {
    // iOS 13+
    const permission = await DeviceMotionEvent.requestPermission().catch(
      (e) => {
        console.log(`❌ iOS permission erreur: ${e}`);
        return "denied";
      },
    );
    console.log(`Permission iOS: ${permission}`);
    if (permission === "granted") startDeviceMotion();
    return;
  }

  // Android / autres
  const permState = await checkSensorPermission();

  if (permState === "denied") {
    console.log(
      "🚫 Permission refusée — va dans Paramètres Chrome → Paramètres du site → Capteurs de mouvement",
    );
    alert(
      "Permission capteurs refusée.\n\nVa dans : Paramètres Chrome → Paramètres du site → Capteurs de mouvement → Autoriser",
    );
    return;
  }

  // "granted", "prompt" ou null → on tente
  tryModernSensor();
});
