const PitchDetector = window.PitchDetector;

window.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 DOM carregado");

  // ==========================
  // Frequência para nota
  // ==========================
  function freqParaNota(freq) {
    if (!freq || freq <= 0) return '--';
    const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const A4 = 440;
    const semitons = Math.round(12 * Math.log2(freq / A4));
    const notaIndex = (semitons + 9) % 12;
    const oitava = 4 + Math.floor((semitons + 9) / 12);
    return notas[notaIndex] + oitava;
  }

  // ==========================
  // Microfone e Pitchy
  // ==========================
  let audioContext, analyser, dataArray, sourceNode, gainNode, detector, detectando = false;

  document.getElementById("btnComecar").addEventListener("click", async () => {
    if (detectando) return;
    detectando = true;
    console.log("🎤 Iniciando detecção...");

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    gainNode = audioContext.createGain();
    gainNode.gain.value = parseFloat(document.getElementById("gainKnob").value);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(gainNode).connect(analyser);

      dataArray = new Float32Array(analyser.fftSize);
      detector = PitchDetector.forFloat32Array(analyser.fftSize);

      detectarPitch();
    } catch (err) {
      alert("Não foi possível acessar o microfone.");
      console.error("🚫 Erro ao acessar microfone:", err);
    }
  });

  document.getElementById("btnParar").addEventListener("click", () => {
    detectando = false;
    if (sourceNode) sourceNode.disconnect();
    if (audioContext) audioContext.close();
    document.getElementById("notaCantada").innerText = 'Nota cantada: --';
    document.getElementById("nivelSinal").style.width = '0%';
    console.log("🛑 Detecção encerrada");
  });

  document.getElementById("gainKnob").addEventListener("input", (e) => {
    if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
    console.log(`🎚️ Ganho ajustado: ${e.target.value}`);
  });

  function detectarPitch() {
    if (!detectando) return;

    analyser.getFloatTimeDomainData(dataArray);
    const [pitch, clarity] = detector.findPitch(dataArray, audioContext.sampleRate);

    const nivelSinal = document.getElementById("nivelSinal");
    const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
    nivelSinal.style.width = `${Math.min(rms * 300, 100)}%`;

    if (clarity > 0.9 && pitch > 65 && pitch < 2000) {
      const nota = freqParaNota(pitch);
      document.getElementById("notaCantada").innerText = `Nota cantada: ${nota} (${pitch.toFixed(1)} Hz)`;
      console.log(`🎶 Pitch detectado: ${pitch.toFixed(1)} Hz | Nota: ${nota} | Clareza: ${clarity.toFixed(2)}`);
    } else {
      document.getElementById("notaCantada").innerText = 'Nota cantada: --';
    }

    requestAnimationFrame(detectarPitch);
  }
});
