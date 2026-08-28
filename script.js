const SUPABASE_URL =
    "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_KEY =
    "SUA_PUBLISHABLE_KEY_AQUI";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ===============================
// ELEMENTOS DO SITE
// ===============================

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const analise = document.getElementById("analise");
const resultado = document.getElementById("resultado");
const mensagem = document.getElementById("mensagem");
const botaoSalvar = document.getElementById("salvar");

let arquivoSelecionado = null;


// ===============================
// CÂMERA E GALERIA
// ===============================

camera.addEventListener("change", processarImagem);
gallery.addEventListener("change", processarImagem);


// ===============================
// PROCESSAR IMAGEM
// ===============================

function processarImagem(event) {

    const arquivo = event.target.files[0];

    if (!arquivo) {
        return;
    }

    arquivoSelecionado = arquivo;

    const leitor = new FileReader();

    leitor.onload = function(evento) {

        preview.src = evento.target.result;

        preview.style.display = "block";

        analise.innerHTML =
            "Imagem carregada com sucesso.";

        resultado.style.display = "block";

        mensagem.innerHTML = "";
    };

    leitor.onerror = function() {

        analise.innerHTML =
            "Erro ao carregar a imagem.";

    };

    leitor.readAsDataURL(arquivo);
}


// ===============================
// SALVAR OBSERVAÇÃO
// ===============================

botaoSalvar.addEventListener(
    "click",
    salvarObservacao
);


async function salvarObservacao() {

    if (!arquivoSelecionado) {

        mensagem.innerHTML =
            "Escolha uma foto primeiro.";

        mensagem.className =
            "mensagem erro";

        return;
    }

    botaoSalvar.disabled = true;

    botaoSalvar.innerText =
        "Salvando...";

    mensagem.innerHTML =
        "🔄 Salvando observação...";

    mensagem.className =
        "mensagem";


    const { data, error } = await supabase

        .from("observations")

        .insert([
            {
                species: "Crotalus durissus",

                common_name: "Cascavel",

                image_url: null,

                latitude: null,

                longitude: null,

                location_name: "Teste ARKA Genesis",

                notes:
                    "Observação criada pelo ARKA Genesis."
            }
        ])

        .select();


    if (error) {

        console.error(
            "ERRO ARKA:",
            error
        );

        mensagem.innerHTML =
            "ERRO REAL: " + error.message;

        mensagem.className =
            "mensagem erro";

        botaoSalvar.disabled = false;

        botaoSalvar.innerText =
            "Tentar novamente";

        return;
    }


    console.log(
        "Observação salva:",
        data
    );


    mensagem.innerHTML =
        "✅ Observação salva com sucesso!";

    mensagem.className =
        "mensagem sucesso";


    botaoSalvar.disabled = true;

    botaoSalvar.innerText =
        "Observação salva";
}
