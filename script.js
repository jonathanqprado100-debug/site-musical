// Função para tocar uma nota rápida
function tocarNota(nota) {
  const synth = new Tone.Synth().toDestination();
  synth.triggerAttackRelease(nota, "1s");
}

// Detectar frequência e converter para nota
async function detectarNota() {
  const audioContext = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  const analyserNode = audioContext.createAnalyser();
  source.connect(analyserNode);

  const pitchDetector = Pitchy.createPitchDetector(analyserNode.fftSize, audioContext.sampleRate);
  const input = new Float32Array(analyserNode.fftSize);

  function atualizarNota() {
    analyserNode.getFloatTimeDomainData(input);
    const [pitch, clarity] = pitchDetector.findPitch(input);

    if (clarity > 0.9 && pitch > 0) {
      const nota = freqParaNota(pitch);
      document.getElementById("notaAtual").innerText = `Nota detectada: ${nota}`;
    }

    requestAnimationFrame(atualizarNota);
  }

  atualizarNota();
}

// Converter frequência (Hz) para nota musical
function freqParaNota(freq) {
  const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12; // A = index 9
  const oitava = 4 + Math.floor((semitons + 9) / 12);
  return notas[notaIndex] + oitava;
}

// Piano interativo
let synth;

function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaAtual").innerText = `Nota atual: ${nota}`;
}

function pararNota() {
  if (synth) {
    synth.triggerRelease();
  }
}

// Gerar piano automaticamente de A1 até A6
function gerarPiano() {
  const notas = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
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
      if (n.includes("#")) {
        key.classList.add("black");
      } else {
        key.classList.add("white");
      }
      key.dataset.nota = nota;
      key.textContent = nota;

      // Eventos de interação
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

// Lista de músicas (adicione aqui suas músicas)
let musicas = {
  "Música 1": "A4 – 'A luz que vem do céu...'\nC5 – '...brilha em mim sem véu...'",
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

// Inicializar
mostrarMenuMusicas();
