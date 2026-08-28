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


    // ------------------------------------
    // VERIFICAR FOTO
    // ------------------------------------

    if (!arquivoSelecionado) {

        mostrarMensagem(
            "Escolha uma foto primeiro.",
            "erro"
        );

        return;

    }


    // ------------------------------------
    // VERIFICAR SUPABASE
    // ------------------------------------

    if (!supabaseARKA) {

        mostrarMensagem(
            "A imagem está pronta, mas o banco ainda não está conectado.",
            "erro"
        );

        return;

    }


    // ------------------------------------
    // ALTERAR BOTÃO
    // ------------------------------------

    if (botaoSalvar) {

        botaoSalvar.disabled =
            true;

        botaoSalvar.innerText =
            "Salvando...";

    }


    mostrarMensagem(
        "🔄 Salvando observação...",
        ""
    );


    // ------------------------------------
    // REGISTRO NO BANCO
    // ------------------------------------

    try {

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
                            null,

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


        // --------------------------------
        // ERRO DO SUPABASE
        // --------------------------------

        if (resultadoBanco.error) {

            console.error(
                "ARKA — erro Supabase:",
                resultadoBanco.error
            );


            mostrarMensagem(
                "ERRO REAL: " +
                resultadoBanco.error.message,
                "erro"
            );


            if (botaoSalvar) {

                botaoSalvar.disabled =
                    false;

                botaoSalvar.innerText =
                    "Tentar novamente";

            }

            return;

        }


        // --------------------------------
        // SUCESSO
        // --------------------------------

        console.log(
            "ARKA — observação salva:",
            resultadoBanco.data
        );


        mostrarMensagem(
            "✅ Observação salva com sucesso!",
            "sucesso"
        );


        if (botaoSalvar) {

            botaoSalvar.disabled =
                true;

            botaoSalvar.innerText =
                "Observação salva";

        }


    } catch (erro) {


        console.error(
            "ARKA — erro inesperado:",
            erro
        );


        mostrarMensagem(
            "ERRO REAL: " +
            erro.message,
            "erro"
        );


        if (botaoSalvar) {

            botaoSalvar.disabled =
                false;

            botaoSalvar.innerText =
                "Tentar novamente";

        }

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
