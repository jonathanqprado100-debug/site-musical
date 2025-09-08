document.addEventListener("DOMContentLoaded", () => {

  // ---------------- PIANO ----------------
  let synth = null;
  const piano = document.getElementById("piano");
  const notaTocada = document.getElementById("notaTocada");
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function criarPiano() {
    for (let oitava = 2; oitava <= 6; oitava++) {
      notas.forEach(n => {
        const nota = n + oitava;
        const key = document.createElement("div");
        key.classList.add("key");
        key.classList.add(n.includes("#") ? "black" : "white");
        key.dataset.nota = nota;
        key.textContent = nota;

        key.addEventListener("mousedown", () => iniciarNota(nota));
        key.addEventListener("mouseup", pararNota);
        key.addEventListener("mouseleave", pararNota);
        key.addEventListener("touchstart", () => iniciarNota(nota));
        key.addEventListener("touchend", pararNota);

        piano.appendChild(key);
      });
    }
  }

  function iniciarNota(nota) {
    if (!synth) synth = new Tone.Synth().toDestination();
    synth.triggerAttack(nota);
    notaTocada.innerText = `Nota tocada: ${nota}`;
  }

  function pararNota() {
    if (synth) synth.triggerRelease();
  }

  criarPiano();

  // ---------------- DETECÇÃO DE NOTA ----------------
  let pitch = null;
  let stream = null;
  let audioContext = null;
  let detector = null;
  let rafId = null;
  const notaCantada = document.getElementById("notaCantada");
  const nivel = document.getElementById("nivel");

  async function iniciarDeteccao() {
    if (!audioContext) audioContext = new AudioContext();

    if (!stream) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const source = audioContext.createMediaStreamSource(stream);

    detector = await ml5.pitchDetection('https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL/model.json', audioContext, source, () => {
      console.log("Modelo carregado");
      detectar();
    });
  }

  function detectar() {
    detector.getPitch((err, frequency) => {
      if (frequency) {
        const nota = freqParaNota(frequency);
        notaCantada.innerText = `Nota cantada: ${nota}`;
        nivel.style.width = Math.min(frequency / 1000 * 100, 100) + "%";
      } else {
        nivel.style.width = "0%";
      }
      rafId = requestAnimationFrame(detectar);
    });
  }

  function pararDeteccao() {
    if (rafId) cancelAnimationFrame(rafId);
    if (nivel) nivel.style.width = "0%";
    notaCantada.innerText = `Nota cantada: --`;
  }

  function freqParaNota(freq) {
    const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const A4 = 440;
    const semitons = Math.round(12 * Math.log2(freq / A4));
    const notaIndex = (semitons + 9) % 12;
    const oitava = 4 + Math.floor((semitons + 9) / 12);
    return notas[notaIndex] + oitava;
  }

  document.getElementById("start-detect")?.addEventListener("click", async () => {
    if (audioContext && audioContext.state === "suspended") await audioContext.resume();
    iniciarDeteccao();
  });

  document.getElementById("stop-detect")?.addEventListener("click", pararDeteccao);

  // ---------------- MÚSICAS ----------------
  let musicas = {
    "Música 1": "C4 – 'Exemplo 1...'\nD4 – 'Notas e letras...'",
    "Música 2": "E4 – 'Exemplo 2...'\nF4 – 'Mais notas...'"
  };

  function mostrarMenuMusicas() {
    const menu = document.getElementById("menu-musicas");
    if (!menu) return;
    menu.innerHTML = "";
    Object.keys(musicas).forEach(nome => {
      const btn = document.createElement("button");
      btn.textContent = nome;
      btn.onclick = () => mostrarMusica(nome);
      menu.appendChild(btn);
    });
  }

  function mostrarMusica(nome) {
    const div = document.getElementById("conteudo-musica");
    if (!div) return;
    div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
  }

  mostrarMenuMusicas();
});
