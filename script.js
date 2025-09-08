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
  if (synth) synth.triggerRelease();
}

// ==========================
// Gerar piano horizontal C2-B6
// ==========================
function gerarPiano() {
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const piano = document.getElementById("piano");

  for(let oitava=2; oitava<=6; oitava++){
    notas.forEach((n, i)=>{
      const nota = n+oitava;
      const key = document.createElement("div");
      key.classList.add("key");
      if(n.includes("#")) key.classList.add("black"); else key.classList.add("white");
      key.dataset.nota = nota;
      key.textContent = n;

      key.addEventListener("mousedown",()=>iniciarNota(nota));
      key.addEventListener("mouseup",pararNota);
      key.addEventListener("mouseleave",pararNota);
      key.addEventListener("touchstart",()=>iniciarNota(nota));
      key.addEventListener("touchend",pararNota);

      piano.appendChild(key);
    });
  }

  // Posicionar pretas
  const whiteKeys = Array.from(document.querySelectorAll('.white'));
  const blackKeys = Array.from(document.querySelectorAll('.black'));
  blackKeys.forEach((black, idx)=>{
    const leftWhite = whiteKeys[idx];
    if(leftWhite) black.style.left = `${leftWhite.offsetLeft + 30}px`;
  });
}

gerarPiano();

// ==========================
// Microfone e pitch detection ml5.js CREPE
// ==========================
let mic, pitch;
let detectando = false;

document.getElementById("btnComecar").addEventListener("click", async () => {
  if(detectando) return;
  detectando = true;

  await Tone.start();
  mic = new p5.AudioIn();
  mic.start(async ()=>{
    pitch = await ml5.pitchDetection('https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/pitch-detection/crepe/', mic.stream, modelLoaded);
  });
});

document.getElementById("btnParar").addEventListener("click", ()=>{
  detectando = false;
  if(mic) mic.stop();
  document.getElementById("notaCantada").innerText = 'Nota cantada: --';
  document.getElementById("nivelSinal").style.width = '0%';
});

function modelLoaded(){
  detectar();
}

function detectar(){
  if(!detectando) return;
  pitch.getPitch((err, freq)=>{
    if(freq){
      document.getElementById("notaCantada").innerText = 'Nota cantada: ' + freqParaNota(freq);
      document.getElementById("nivelSinal").style.width = '100%';
    } else {
      document.getElementById("notaCantada").innerText = 'Nota cantada: --';
      document.getElementById("nivelSinal").style.width = '0%';
    }
    requestAnimationFrame(detectar);
  });
}

// ==========================
// Frequência para nota
// ==========================
function freqParaNota(freq){
  if(!freq || freq<=0) return '--';
  const notas = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;
  const semitons = Math.round(12*Math.log2(freq/A4));
  const notaIndex = (semitons+9)%12;
  const oitava = 4+Math.floor((semitons+9)/12);
  return notas[notaIndex]+oitava;
}

// ==========================
// Músicas exemplo
// ==========================
let musicas = {
  "Música 1": "C4 – 'Exemplo letra 1...'\nD4 – 'Segunda linha...'",
  "Música 2": "E4 – 'Exemplo letra 2...'\nF4 – 'Segunda linha...'"
};

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
