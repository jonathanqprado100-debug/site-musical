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
  // Piano e notas tocadas
  // ==========================
  let synth;
  async function iniciarNota(nota) {
    await Tone.start();
    synth = new Tone.Synth().toDestination();
    synth.triggerAttack(nota);
    document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
    console.log(`🎹 Nota tocada: ${nota}`);
  }

  function pararNota() {
    if (synth) synth.triggerRelease();
  }

  // ==========================
  // Gerar piano horizontal C2-B6
  // ==========================
  function gerarPiano() {
    const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const piano = document.getElementById("piano");

    for (let oitava = 2; oitava <= 6; oitava++) {
      notas.forEach((n) => {
        const nota = n + oitava;
        const key = document.createElement("div");
        key.classList.add("key");
        key.classList.add(n.includes("#") ? "black" : "white");
        key.dataset.nota = nota;
        key.textContent = n;

        key.addEventListener("mousedown", () => iniciarNota(nota));
        key.addEventListener("mouseup", pararNota);
        key.addEventListener("mouseleave", pararNota);
        key.addEventListener("touchstart", () => iniciarNota(nota));
        key.addEventListener("touchend", pararNota);

        piano.appendChild(key);
      });
    }

    const whiteKeys = Array.from(document.querySelectorAll('.white'));
    const blackKeys = Array.from(document.querySelectorAll('.black'));
    blackKeys.forEach((black, idx) => {
      const leftWhite = whiteKeys[idx];
      if (leftWhite) black.style.left = `${leftWhite.offsetLeft + 30}px`;
    });

    console.log("🎹 Piano gerado");
  }

  gerarPiano();

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

  // ==========================
  // Músicas exemplo
  // ==========================
  const musicas = {
    "Música 1": "C4 – 'Exemplo letra 1...'\nD4 – 'Segunda linha...'",
    "Música 2": "E4 – 'Exemplo letra 2...'\nF4 – 'Segunda linha...'",
    "Música 3": "G4 – 'Mais uma linha...'\nA4 – 'Finalizando exemplo...'"
  };

  function mostrarMenuMusicas() {
    const menu = document.getElementById("menu-musicas");
    menu.innerHTML = "";
    Object.keys(musicas).forEach(nome => {
      const btn = document.createElement("button");
      btn.textContent = nome;
      btn.onclick = () => mostrarMusica(nome);
      menu.appendChild(btn);
    });
    console.log("🎵 Menu de músicas carregado");
  }

  function mostrarMusica(nome) {
    const div = document.getElementById("conteudo-musica");
    div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
    console.log(`🎼 Música exibida: ${nome}`);
  }

  mostrarMenuMusicas();
});

