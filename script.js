const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");

function testarArquivo(event) {

    alert("ARKA recebeu o arquivo!");

}

camera.addEventListener("change", testarArquivo);
gallery.addEventListener("change", testarArquivo);
