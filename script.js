// =========================================
// Piano horizontal C2 a B6
// =========================================
let synth;

function iniciarNota(nota) {
  synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("nota-tocada").innerText = nota;
}

function pararNota() {
  if (synth) synth.triggerRelease();
}

function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for(let oitava=2; oitava<=6; oitava++){
    notas.forEach(n=>{
      const notaCompleta = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      key.classList.add(n.includes("#") ? "black" : "white");
      key.dataset.nota = notaCompleta;
      key.textContent = notaCompleta;

      key.addEventListener("mousedown", ()=> iniciarNota(notaCompleta));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", ()=> iniciarNota(notaCompleta));
      key.addEventListener("touchend", pararNota);

      piano.appendChild(key);
    });
  }
}

gerarPiano();

// =========================================
// Músicas (texto com notas dentro)
let musicas = {
  "Música 1": "C4 – 'A luz que vem do céu...'\nE4 – '...brilha em mim sem véu...'",
  "Música 2": "G4 – 'No palco da emoção...'\nB4 – '...canto com o coração...'"
};

function mostrarMenuMusicas(){
  const menu = document.getElementById("menu-musicas");
  menu.innerHTML = "";
  Object.keys(musicas).forEach(nome=>{
    const btn = document.createElement("button");
    btn.textContent = nome;
    btn.onclick = ()=> mostrarMusica(nome);
    menu.appendChild(btn);
  });
}

function mostrarMusica(nome){
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

mostrarMenuMusicas();

// =========================================
// Detecção de nota cantada com ml5.js + CREPE
// =========================================
let pitch, audioContext, micStream, detectInterval;

async function iniciarDeteccao(){
  // Criar contexto de áudio após interação do usuário
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  micStream = audioContext.createMediaStreamSource(stream);

  pitch = ml5.pitchDetection(
    'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/',
    audioContext,
    micStream.stream,
    modelCarregado
  );
}

function modelCarregado(){
  console.log("Modelo CREPE carregado!");
  detectarNota();
}

function detectarNota(){
  if(!pitch) return;

  detectInterval = setInterval(()=>{
    pitch.getPitch(function(err, frequency){
      const notaElem = document.getElementById("nota-cantada");
      const medidor = document.getElementById("medidor");
      if(frequency){
        const nota = freqParaNota(frequency);
        notaElem.innerText = nota;
        medidor.value = Math.min(frequency/1000, 1);
      } else {
        notaElem.innerText = "--";
        medidor.value = 0;
      }
    });
  }, 100); // atualiza 10x por segundo
}

function pararDeteccao(){
  clearInterval(detectInterval);
  document.getElementById("nota-cantada").innerText = "--";
  document.getElementById("medidor").value = 0;
}

function freqParaNota(freq){
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9)/12);
  return notas[notaIndex] + oitava;
}

// Botões
document.getElementById("start-detect").addEventListener("click", iniciarDeteccao);
document.getElementById("stop-detect").addEventListener("click", pararDeteccao);
