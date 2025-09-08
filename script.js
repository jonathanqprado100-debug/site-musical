// Piano interativo
let synth;

// Iniciar nota tocada no piano
function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}

// Parar nota tocada
function pararNota() {
  if (synth) synth.triggerRelease();
}

// Função para tocar nota rápida (opcional)
function tocarNota(nota) {
  const s = new Tone.Synth().toDestination();
  s.triggerAttackRelease(nota, "1s");
}

// Variáveis para nota cantada
let audioContext;
let analyserNode;
let pitchDetector;
let input;
let stream;

// Lista de microfones disponíveis
async function listarMicrofones() {
  const dispositivos = await navigator.mediaDevices.enumerateDevices();
  const microfones = dispositivos.filter(d => d.kind === "audioinput");
  
  const container = document.getElementById("microfones");
  container.innerHTML = "";

  microfones.forEach((mic, i) => {
    const btn = document.createElement("button");
    btn.textContent = mic.label || `Microfone ${i + 1}`;
    btn.onclick = () => iniciarDeteccao(mic.deviceId);
    container.appendChild(btn);
  });

  if (microfones.length === 0) {
    container.textContent = "Nenhum microfone encontrado.";
  }
}

// Iniciar detecção de nota cantada
async function iniciarDeteccao(deviceId) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({ 
    audio: { 
      deviceId: deviceId ? { exact: deviceId } : undefined,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    } 
  });
  
  const source = audioContext.createMediaStreamSource(stream);

  // Aumentando ganho do microfone
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 3; // valor ajustável para aumentar sensibilidade
  source.connect(gainNode);

  analyserNode = audioContext.createAnalyser();
  gainNode.connect(analyserNode);

  pitchDetector = Pitchy.createPitchDetector(analyserNode.fftSize, audioContext.sampleRate);
  input = new Float32Array(analyserNode.fftSize);

  atualizarNota();
}

// Atualizar nota cantada
function atualizarNota() {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = pitchDetector.findPitch(input);

  if (clarity > 0.7 && pitch > 0) { // clareza menor para aumentar sensibilidade
    const nota = freqParaNota(pitch);
    document.getElementById("notaCantada").innerText = `Nota cantada: ${nota}`;
  } else {
    document.getElementById("notaCantada").innerText = `Nota cantada: --`;
  }

  requestAnimationFrame(atualizarNota);
}

// Converter frequência para nota musical
function freqParaNota(freq) {
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}

// Gerar piano de C1 até B6
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
      key.classList.add(n.includes("#") ? "black" : "white");
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

// Lista de músicas
let musicas = {
  "Música 1": "C4 – 'A luz que vem do céu...'\nD4 – '...brilha em mim sem véu...'",
  "Música 2": "G4 – 'No palco da emoção...'\nB4 – '...canto com o coração...'"
};

// Gerar menu de músicas
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

// Mostrar música selecionada
function mostrarMusica(nome) {
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

// Inicialização
gerarPiano();
mostrarMenuMusicas();
listarMicrofones();
