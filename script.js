// ========================================
// ARKA GENESIS — SCRIPT PRINCIPAL
// ========================================

// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL =
    "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_KEY =
    "SUA_PUBLISHABLE_KEY_AQUI";


// Criar cliente somente uma vez
const supabaseARKA =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ========================================
// ELEMENTOS
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


    // Mostrar a imagem imediatamente
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


    botaoSalvar.disabled = true;

    botaoSalvar.innerText =
        "Enviando fotografia...";


    mostrarMensagem(
        "📷 Enviando fotografia...",
        ""
    );


    try {

        // ====================================
        // CRIAR NOME ÚNICO
        // ====================================

        const extensao =
            arquivoSelecionado.name
                .split(".")
                .pop()
                .toLowerCase();


        const nomeArquivo =
            "observacao-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2) +
            "." +
            extensao;


        // ====================================
        // UPLOAD PARA O STORAGE
        // ====================================

        const upload =
            await supabaseARKA
                .storage
                .from("animal - image")
                .upload(
                    nomeArquivo,
                    arquivoSelecionado,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            arquivoSelecionado.type
                    }
                );


        if (upload.error) {

            throw upload.error;

        }


        // ====================================
        // URL PÚBLICA
        // ====================================

        const publicUrl =
            supabaseARKA
                .storage
                .from("animal - image")
                .getPublicUrl(
                    nomeArquivo
                );


        const imageUrl =
            publicUrl.data.publicUrl;


        console.log(
            "ARKA — imagem enviada:",
            imageUrl
        );


        // ====================================
        // SALVAR OBSERVAÇÃO
        // ====================================

        botaoSalvar.innerText =
            "Salvando observação...";


        mostrarMensagem(
            "💾 Salvando observação...",
            ""
        );


        const resultadoBanco =
            await supabaseARKA
                .from("observations")
                .insert([
                    {

                        species:
                            "Crotalus durissus",

                        common_name:
                            "Cascavel",

                        image_url:
                            imageUrl,

                        latitude:
                            null,

                        longitude:
                            null,

                        location_name:
                            "Teste ARKA Genesis",

                        notes:
                            "Observação criada pelo ARKA Genesis."

                    }
                ])
                .select();


        if (resultadoBanco.error) {

            throw resultadoBanco.error;

        }


        // ====================================
        // SUCESSO
        // ====================================

        console.log(
            "ARKA — observação salva:",
            resultadoBanco.data
        );


        mostrarMensagem(
            "✅ Fotografia e observação salvas com sucesso!",
            "sucesso"
        );


        botaoSalvar.innerText =
            "Observação salva";


        botaoSalvar.disabled =
            true;

    }


    catch (erro) {

        console.error(
            "ARKA — erro:",
            erro
        );


        mostrarMensagem(
            "ERRO REAL: " +
            erro.message,
            "erro"
        );


        botaoSalvar.disabled =
            false;


        botaoSalvar.innerText =
            "Tentar novamente";

    }

}


// ========================================
// MENSAGENS
// ========================================

function mostrarMensagem(
    texto,
    tipo
) {

    if (!mensagem) {
        return;
    }


    mensagem.innerHTML =
        texto;


    mensagem.className =
        "mensagem";


    if (tipo) {

        mensagem.classList.add(
            tipo
        );

    }

}
