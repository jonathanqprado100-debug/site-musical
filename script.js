// Função para tocar uma nota rápida
function tocarNota(nota) {
  const synth = new Tone.Synth().toDestination();
  synth.triggerAttackRelease(nota, "1s");
}

// Variáveis globais
let audioContext;
let analyserNode;
let pitchDetector;
let input;
let stream;
let synth;

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

// Iniciar detecção com microfone selecionado
async function iniciarDeteccao(deviceId) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  audioContext = new AudioContext();
  stream = await navigator.mediaDevices.getUserMedia({ 
    audio: { deviceId: deviceId ? { exact: deviceId } : undefined } 
  });
  
  const source = audioContext.createMediaStreamSource(stream);
  analyserNode = audioContext.createAnalyser();
  source.connect(analyserNode);

  pitchDetector = Pitchy.createPitchDetector(analyserNode.fftSize, audioContext.sampleRate);
  input = new Float32Array(analyserNode.fftSize);

  atualizarNota();
}

// Atualizar nota detectada
function atualizarNota() {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = pitchDetector.findPitch(input);

  if (clarity > 0.9 && pitch > 0) {
    const nota = freqParaNota(pitch);
    document.getElementById("notaAtual").innerText = `Nota atual: ${nota}`;
  }

  requestAnimationFrame(atualizarNota);
}

// Converter frequência para nota musical
function freqParaNota(freq) {
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12; // A = index 9
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}

// Piano interativo
function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaAtual").innerText = `Nota atual: ${nota}`;
}

function pararNota() {
  if (synth) synth.triggerRelease();
}

// Gerar piano automaticamente de C1 até B6
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
