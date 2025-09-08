let synth;
let pitch;
let audioContext;
let micStream;
let detectarAtivo = false;

// Piano horizontal C2 - B6
function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for(let oitava=2; oitava<=6; oitava++){
    notas.forEach(n=>{
      const nota = n + oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      key.classList.add(n.includes("#") ? "black" : "white");
      key.dataset.nota = nota;
      key.textContent = nota;
      key.addEventListener("mousedown", ()=>iniciarNota(nota));
      key.addEventListener("mouseup", pararNota);
      key.addEventListener("mouseleave", pararNota);
      key.addEventListener("touchstart", ()=>iniciarNota(nota));
      key.addEventListener("touchend", pararNota);
      piano.appendChild(key);
    });
  }
}

// Funções de tocar piano
function iniciarNota(nota){
  if(!synth) synth = new Tone.Synth().toDestination();
  synth.triggerAttack(nota);
  document.getElementById("notaTocada").innerText = `Nota tocada: ${nota}`;
}

function pararNota(){
  if(synth) synth.triggerRelease();
}

// Inicializar piano
gerarPiano();

// Lista de músicas
let musicas = {
  "Música 1": "C4 – 'A luz que vem do céu...'\nD4 – '...brilha em mim sem véu...'",
  "Música 2": "G4 – 'No palco da emoção...'\nB4 – '...canto com o coração...'"
};

// Menu de músicas
function mostrarMenuMusicas(){
  const menu = document.getElementById("menu-musicas");
  menu.innerHTML = "";
  Object.keys(musicas).forEach(nome=>{
    const btn = document.createElement("button");
    btn.textContent = nome;
    btn.onclick = ()=>mostrarMusica(nome);
    menu.appendChild(btn);
  });
}

function mostrarMusica(nome){
  const div = document.getElementById("conteudo-musica");
  div.innerHTML = `<h3>${nome}</h3><pre>${musicas[nome]}</pre>`;
}

mostrarMenuMusicas();

// ML5 Pitch Detection CREPE
async function iniciarDeteccao(){
  if(detectarAtivo) return;
  detectarAtivo = true;

  if(!audioContext) audioContext = new AudioContext();
  if(audioContext.state === "suspended") await audioContext.resume();

  micStream = await navigator.mediaDevices.getUserMedia({audio:true});
  const source = audioContext.createMediaStreamSource(micStream);

  pitch = await ml5.pitchDetection(
    "https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/",
    audioContext,
    source,
    modelLoaded
  );
}

function modelLoaded(){
  console.log("Modelo CREPE carregado!");
  detectar();
}

// Detectar nota cantada
function detectar(){
  if(!detectarAtivo) return;
  pitch.getPitch((err, frequency)=>{
    const barra = document.getElementById("barra");
    if(frequency){
      const nota = freqParaNota(frequency);
      document.getElementById("notaCantada").innerText = `Nota cantada: ${nota}`;
      barra.style.width = Math.min(frequency/2000*100, 100) + "%";
    } else {
      document.getElementById("notaCantada").innerText = "Nota cantada: --";
      barra.style.width = "0%";
    }
    requestAnimationFrame(detectar);
  });
}

// Converter frequência para nota
function freqParaNota(freq){
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12 * Math.log2(freq / A4));
  const notaIndex = (semitons + 9) % 12;
  const oitava = 4 + Math.floor((semitons + 9)/12);
  return notas[notaIndex] + oitava;
}

// Parar detecção
function pararDeteccao(){
  detectarAtivo = false;
  document.getElementById("notaCantada").innerText = "Nota cantada: --";
  document.getElementById("barra").style.width = "0%";
  if(micStream){
    micStream.getTracks().forEach(track=>track.stop());
  }
}

// Botões
document.getElementById("btn-start").addEventListener("click", iniciarDeteccao);
document.getElementById("btn-stop").addEventListener("click", pararDeteccao);
