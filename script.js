// ==========================
// Piano e notas tocadas
// ==========================
let synth;

function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}

function pararNota() {
  if (synth) {
    synth.triggerRelease();
  }
}

// ==========================
// Gerar piano C1 até B6
// ==========================
function gerarPiano() {
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const piano = document.getElementById("piano");

  for (let oitava = 1; oitava <= 6; oitava++) {
    const container = document.createElement("div");
    container.classList.add("oitava");
    const titulo = document.createElement("h4");
    titulo.textContent = `Oitava ${oitava}`;
    container.appendChild(titulo);

    const teclas = document.createElement("div");
    teclas.classList.add("teclas");

    notas.forEach(n => {
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      if (n.includes("#")) key.classList.add("black");
      else key.classList.add("white");
      key.dataset.nota = nota;
      key.textContent = nota;

      key.addEventListener("mousedown", () => iniciarNota(nota));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", () => iniciarNota(nota));
      key.addEventListener("touchend", pararNota);

      teclas.appendChild(key);
    });

    container.appendChild(teclas);
    piano.appendChild(container);
  }
}

gerarPiano();

// ==========================
// Detectar nota cantada
// ==========================
let audioContext;
let pitchDetector;
let analyserNode;
let input;

async function iniciarDeteccao() {
  await Tone.start(); // Libera AudioContext

  if (!audioContext) audioContext = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  analyserNode = audioContext.createAnalyser();

  // Ganho extra
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 3;
  source.connect(gainNode);
  gainNode.connect(analyserNode);

  pitchDetector = Pitchy.createPitchDetector(2048, audioContext.sampleRate);
  input = new Float32Array(analyserNode.fftSize);

  function atualizarNota() {
    analyserNode.getFloatTimeDomainData(input);

    // Medidor RMS
    let soma = 0;
    for (let i = 0; i < input.length; i++) soma += input[i] * input[i];
    const rms = Math.sqrt(soma / input.length);
    document.getElementById("nivelSinal").style.width = `${Math.min(rms * 500, 100)}%`;

    // Detectar pitch
    const [pitch, clarity] = pitchDetector.findPitch(input);
    if (pitch > 0 && clarity > 0.1) { // qualquer som falado
      const nota = freqParaNota(pitch);
      document.getElementById("notaCantada").innerText = `Nota cantada: ${nota}`;
    } else {
      document.getElementById("notaCantada").innerText = `Nota cantada: --`;
    }

    requestAnimationFrame(atualizarNota);
  }

  atualizarNota();
}

// ==========================
// Converter frequência em nota
// ==========================
function freqParaNota(freq) {
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}

// ==========================
// Botão iniciar detecção
// ==========================
document.getElementById("btnComecar").addEventListener("click", iniciarDeteccao);

// ==========================
// Músicas exemplo
// ==========================
let musicas = {
  "Música 1": "C4 – 'Exemplo de letra 1...'\nD4 – 'Segunda linha...'",
  "Música 2": "E4 – 'Exemplo de letra 2...'\nF4 – 'Segunda linha...'"
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
}

function mostrarMusica(nome) {
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

mostrarMenuMusicas();
