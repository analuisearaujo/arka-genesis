// ========================================
// ARKA GENESIS — SCRIPT PRINCIPAL
// ========================================


// ========================================
// CONFIGURAÇÃO SUPABASE
// ========================================

const SUPABASE_URL =
    "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";


// ========================================
// ELEMENTOS DA INTERFACE
// ========================================

const camera =
    document.getElementById("camera");

const gallery =
    document.getElementById("gallery");

const preview =
    document.getElementById("preview");

const analise =
    document.getElementById("analise");

const resultado =
    document.getElementById("resultado");

const mensagem =
    document.getElementById("mensagem");

const botaoSalvar =
    document.getElementById("salvar");


// ========================================
// VARIÁVEIS
// ========================================

let arquivoSelecionado = null;

let supabaseARKA = null;


// ========================================
// INICIALIZAR SUPABASE
// ========================================

function iniciarBanco() {

    try {

        if (
            window.supabase &&
            SUPABASE_URL &&
            SUPABASE_KEY &&
            SUPABASE_KEY !== "SUA_PUBLISHABLE_KEY_AQUI"
        ) {

            supabaseARKA =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );

            console.log(
                "ARKA: Supabase conectado."
            );

        } else {

            console.warn(
                "ARKA: Supabase não configurado."
            );

        }

    } catch (erro) {

        console.error(
            "ARKA: erro ao iniciar Supabase.",
            erro
        );

        supabaseARKA = null;

    }

}


// ========================================
// INICIAR BANCO
// ========================================

iniciarBanco();


// ========================================
// CÂMERA
// ========================================

if (camera) {

    camera.addEventListener(
        "change",
        processarImagem
    );

}


// ========================================
// GALERIA
// ========================================

if (gallery) {

    gallery.addEventListener(
        "change",
        processarImagem
    );

}


// ========================================
// PROCESSAR IMAGEM
// ========================================

function processarImagem(event) {

    const arquivo =
        event.target.files &&
        event.target.files[0];


    if (!arquivo) {

        return;

    }


    arquivoSelecionado =
        arquivo;


    // ------------------------------------
    // MOSTRAR A IMAGEM PRIMEIRO
    // ------------------------------------

    const leitor =
        new FileReader();


    leitor.onload =
        function(evento) {

            if (preview) {

                preview.src =
                    evento.target.result;

                preview.style.display =
                    "block";

            }


            if (analise) {

                analise.innerHTML =
                    "Imagem carregada com sucesso.";

            }


            if (resultado) {

                resultado.style.display =
                    "block";

            }


            if (mensagem) {

                mensagem.innerHTML =
                    "";

            }

        };


    leitor.onerror =
        function() {

            if (analise) {

                analise.innerHTML =
                    "Não foi possível carregar a imagem.";

            }

        };


    leitor.readAsDataURL(arquivo);

}


// ========================================
// BOTÃO SALVAR
// ========================================

if (botaoSalvar) {

    botaoSalvar.addEventListener(
        "click",
        salvarObservacao
    );

}


// ========================================
// SALVAR OBSERVAÇÃO
// ========================================

async function salvarObservacao() {

    if (!arquivoSelecionado) {

        mostrarMensagem(
            "Escolha uma foto primeiro.",
            "erro"
        );

        return;
    }

    if (!supabaseARKA) {

        mostrarMensagem(
            "Supabase não está conectado.",
            "erro"
        );

        return;
    }

    botaoSalvar.disabled = true;
    botaoSalvar.innerText = "Enviando...";

    mostrarMensagem(
        "📷 Testando envio da fotografia...",
        ""
    );

    try {

        const extensao =
            arquivoSelecionado.name
                .split(".")
                .pop()
                .toLowerCase();

        const nomeArquivo =
            "teste-" +
            Date.now() +
            "." +
            extensao;

        console.log(
            "ARKA: iniciando upload..."
        );

        console.log(
            "Arquivo:",
            arquivoSelecionado.name
        );

        console.log(
            "Tamanho:",
            arquivoSelecionado.size
        );

        const upload =
            await supabaseARKA
                .storage
                .from("animal - image")
                .upload(
                    nomeArquivo,
                    arquivoSelecionado,
                    {
                        cacheControl: "3600",
                        upsert: true,
                        contentType:
                            arquivoSelecionado.type
                    }
                );

        console.log(
            "ARKA: resposta do upload:",
            upload
        );

        if (upload.error) {

            throw upload.error;

        }

        const publicUrl =
            supabaseARKA
                .storage
                .from("animal - image")
                .getPublicUrl(
                    nomeArquivo
                );

        console.log(
            "URL da imagem:",
            publicUrl.data.publicUrl
        );

        mostrarMensagem(
            "✅ FOTO ENVIADA COM SUCESSO!",
            "sucesso"
        );

        botaoSalvar.disabled = true;

        botaoSalvar.innerText =
            "Foto enviada";

    } catch (erro) {

        console.error(
            "ARKA — erro no upload:",
            erro
        );

        mostrarMensagem(
            "ERRO NO UPLOAD: " +
            erro.message,
            "erro"
        );

        botaoSalvar.disabled = false;

        botaoSalvar.innerText =
            "Tentar novamente";
    }
}
