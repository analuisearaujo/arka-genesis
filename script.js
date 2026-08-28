const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const analise = document.getElementById("analise");
const resultado = document.getElementById("resultado");

function processarImagem(event) {

    const arquivo = event.target.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function(e) {

        preview.src = e.target.result;

        preview.style.display = "block";

        analise.innerHTML =
            "Imagem carregada com sucesso.";

        resultado.style.display = "block";
    };

    leitor.onerror = function() {

        analise.innerHTML =
            "Erro ao carregar a imagem.";

    };

    leitor.readAsDataURL(arquivo);
}

camera.addEventListener("change", processarImagem);
gallery.addEventListener("change", processarImagem);
