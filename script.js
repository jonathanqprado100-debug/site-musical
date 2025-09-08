window.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // Frequência para nota
  // ==========================
  function freqParaNota(freq) {
    if (!freq || freq <= 0) return '--';
    const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
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
  }
  function pararNota() {
    if (synth) synth.triggerRelease();
  }

  // ==========================
  // Gerar piano horizontal C2-B6
  // ==========================
  function gerarPiano() {
    const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
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
  }
  gerarPiano();

  // ==========================
  // Autocorrelação para pitch detection
  // ==========================
  function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < 0.02) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < 0.02) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE - i; j++)
        c[i] += buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    }

    return maxpos === 0 ? -1 : sampleRate / maxpos;
  }

  // ==========================
  // Microfone e pitch detection
  // ==========================
  let audioContext, analyser, dataArray, sourceNode, detectando = false, gainNode;

  document.getElementById("btnComecar").addEventListener("click", async () => {
    if (detectando) return;
    detectando = true;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32768;

    gainNode = audioContext.createGain();
    gainNode.gain.value = parseFloat(document.getElementById("gainKnob").value);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(gainNode).connect(analyser);

      dataArray = new Float32Array(analyser.fftSize);
      detectarFrequencia();
    } catch (err) {
      alert("Não foi possível acessar o microfone.");
    }
  });

  document.getElementById("btnParar").addEventListener("click", () => {
    detectando = false;
    if (sourceNode) sourceNode.disconnect();
    document.getElementById("notaCantada").innerText = 'Nota cantada: --';
    document.getElementById("nivelSinal").style.width = '0%';
  });

  document.getElementById("gainKnob").addEventListener("input", (e) => {
    if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
  });

  function detectarFrequencia() {
    if (!detectando) return;

    analyser.getFloatTimeDomainData(dataArray);
    const freq = autoCorrelate(dataArray, audioContext.sampleRate);

    if (freq > 65 && freq < 2000) {
      const nota = freqParaNota(freq);
      document.getElementById("notaCantada").innerText = 'Nota cantada: ' + nota;
      document.getElementById("nivelSinal").style.width = '100%';
    } else {
      document.getElementById("notaCantada").innerText = 'Nota cantada: --';
      document.getElementById("nivelSinal").style.width = '0%';
    }

    requestAnimationFrame(detectarFrequencia);
  }

  // ==========================
  // Músicas exemplo
  // ==========================
  const musicas = {
    "Música 1": "C4 – 'Exemplo letra 1...'\nD4 – 'Segunda linha...'",
    "Música 
