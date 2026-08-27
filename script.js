const camera=document.getElementById("camera");

const gallery=document.getElementById("gallery");

camera.addEventListener("change",processarImagem);

gallery.addEventListener("change",processarImagem);

function processarImagem(event){

const arquivo=event.target.files[0];

if(!arquivo)return;

const preview=document.getElementById("preview");

const analise=document.getElementById("analise");

const resultado=document.getElementById("resultado");

preview.src=URL.createObjectURL(arquivo);

preview.style.display="block";

resultado.style.display="none";

analise.innerHTML="🧠 Preparando análise...";

setTimeout(()=>{

analise.innerHTML="";

resultado.style.display="block";

},1500);

}

document.querySelector(".salvar").addEventListener("click",()=>{

alert("Na próxima versão esta observação será salva automaticamente no banco da ARKA.");

});
