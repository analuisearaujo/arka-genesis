"use strict";

// ======================================================
// ARKA GENESIS — SCRIPT PRINCIPAL
// ======================================================

// SUPABASE
const SUPABASE_URL =
  "https://haoqywnqxeydylfzxqzz.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

if (!window.supabase) {
  throw new Error(
    "ARKA: a biblioteca do Supabase não foi carregada."
  );
}

const supabaseARKA = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ELEMENTOS
const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const btnRegistrar = document.getElementById("btnRegistrar");
const especie = document.getElementById("species");
const observacao = document.getElementById("notes");
const resultadoIA = document.getElementById("resultadoIA");
const mensagemRegistro = document.getElementById("mensagemRegistro");

// ESTADO
let imagemSelecionada = null;
let localizacao = null;
let identificacaoAtual = null;
let urlPreviaAtual = null;


// ======================================================
// MENSAGENS NA PÁGINA
// ======================================================

function mostrarMensagem(mensagem, tipo = "info") {
  console.log("ARKA:", mensagem);

  if (mensagemRegistro) {
    mensagemRegistro.textContent = mensagem;
    mensagemRegistro.dataset.tipo = tipo;
  }
}

function mostrarResultado(dados) {
  if (!resultadoIA) return;

  resultadoIA.hidden = false;

  const nomeComum =
    dados.common_name || "Não identificado";

  const nomeCientifico =
    dados.scientific_name || "Não identificado";

  const confianca =
    dados.confidence === null ||
    dados.confidence === undefined
      ? "Não informada"
      : `${Math.round(Number(dados.confidence) * 100)}%`;

  const local =
    dados.location_name || "Não disponível";

  resultadoIA.replaceChildren();

  const titulo = document.createElement("h3");
  titulo.textContent = "Resultado da identificação";

  const comum = document.createElement("p");
  comum.textContent = `Nome comum: ${nomeComum}`;

  const cientifico = document.createElement("p");
  cientifico.textContent = `Nome científico: ${nomeCientifico}`;

  const confiancaTexto = document.createElement("p");
  confiancaTexto.textContent = `Confiança informada pela IA: ${confianca}`;

  const localTexto = document.createElement("p");
  localTexto.textContent = `Localização: ${local}`;

  resultadoIA.append(
    titulo,
    comum,
    cientifico,
    confiancaTexto,
    localTexto
  );
}


// ======================================================
// PRÉVIA DA IMAGEM
// ======================================================

function mostrarImagem(file) {
  if (!file) return;

  if (!file.type || !file.type.startsWith("image/")) {
    mostrarMensagem("Selecione um arquivo de imagem válido.", "erro");
    return;
  }

  if (!preview) {
    mostrarMensagem("Não foi encontrado o espaço da prévia no HTML.", "erro");
    return;
  }

  imagemSelecionada = file;
  identificacaoAtual = null;

  if (urlPreviaAtual) {
    URL.revokeObjectURL(urlPreviaAtual);
  }

  urlPreviaAtual = URL.createObjectURL(file);

  preview.onload = () => {
    preview.style.display = "block";
  };

  preview.onerror = () => {
    mostrarMensagem("Não foi possível exibir esta imagem. Escolha outra foto.", "erro");
  };

  preview.src = urlPreviaAtual;
  preview.style.display = "block";

  if (resultadoIA) {
    resultadoIA.hidden = true;
    resultadoIA.replaceChildren();
  }

  mostrarMensagem(`Imagem selecionada: ${file.name}`, "sucesso");
}

camera?.addEventListener("change", (event) => {
  mostrarImagem(event.target.files?.[0]);
});

gallery?.addEventListener("change", (event) => {
  mostrarImagem(event.target.files?.[0]);
});


// ======================================================
// LOCALIZAÇÃO GPS
// ======================================================

async function obterLocalizacao() {
  if (!navigator.geolocation) {
    console.warn("ARKA: este navegador não oferece geolocalização.");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dados = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };

        console.log("ARKA: coordenadas obtidas.");
        resolve(dados);
      },
      (erro) => {
        console.warn(
          "ARKA: GPS indisponível ou permissão negada:",
          erro.message
        );
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}


// ======================================================
// IDENTIFICAÇÃO POR IA
// ======================================================

async function identificarEspecie(file, coordenadas) {
  const formData = new FormData();

  formData.append("image", file);

  if (
    coordenadas &&
    Number.isFinite(coordenadas.lat) &&
    Number.isFinite(coordenadas.lon)
  ) {
    formData.append("latitude", String(coordenadas.lat));
    formData.append("longitude", String(coordenadas.lon));
  }

  mostrarMensagem("Enviando a imagem para a inteligência artificial...");

  const resposta = await fetch(
    `${SUPABASE_URL}/functions/v1/identify-species`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY
      },
      body: formData
    }
  );

  const texto = await resposta.text();

  console.log("ARKA: status da Edge Function:", resposta.status);
  console.log("ARKA: resposta da Edge Function:", texto);

  let dados;

  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(
      `A função de IA retornou uma resposta inválida (HTTP ${resposta.status}).`
    );
  }

  if (!resposta.ok) {
    const detalhe =
      dados.error ||
      dados.message ||
      dados.msg ||
      texto ||
      "Erro sem detalhes.";

    throw new Error(
      `Edge Function HTTP ${resposta.status}: ${detalhe}`
    );
  }

  if (dados.error) {
    throw new Error(dados.error);
  }

  return {
    scientific_name: dados.scientific_name || null,
    common_name: dados.common_name || null,
    confidence: dados.confidence ?? null,
    location_name: dados.location_name || null,
    latitude: dados.latitude ?? coordenadas?.lat ?? null,
    longitude: dados.longitude ?? coordenadas?.lon ?? null
  };
}


// ======================================================
// ENVIAR IMAGEM PARA O SUPABASE STORAGE
// ======================================================

async function enviarImagem(file) {
  const nomeOriginal = file.name || "imagem.jpg";

  const nomeSeguro = nomeOriginal.replace(/[^\w.-]/g, "_");

  const caminho =
    `observacoes/${Date.now()}-${nomeSeguro}`;

  const { data, error } = await supabaseARKA
    .storage
    .from("animal - image")
    .upload(caminho, file, {
      upsert: false,
      contentType: file.type || "image/jpeg"
    });

  if (error) {
    console.error("ARKA: erro ao enviar imagem:", error);
    throw new Error(`Erro no upload da imagem: ${error.message}`);
  }

  const { data: urlData } = supabaseARKA
    .storage
    .from("animal - image")
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw new Error("Não foi possível obter a URL pública da imagem.");
  }

  return urlData.publicUrl;
}


// ======================================================
// SALVAR OBSERVAÇÃO NO BANCO
// ======================================================

async function salvarNoBanco(dadosObservacao) {
  const { error } = await supabaseARKA
    .from("observations")
    .insert(dadosObservacao);

  if (error) {
    console.error("ARKA: erro no banco:", error);

    throw new Error(
      `Erro ao salvar no banco: ${error.message}`
    );
  }
}


// ======================================================
// REGISTRAR OBSERVAÇÃO
// ======================================================

async function registrarObservacao() {
  if (!imagemSelecionada) {
    mostrarMensagem("Escolha ou tire uma foto antes de continuar.", "erro");
    alert("Escolha uma imagem primeiro.");
    return;
  }

  if (btnRegistrar) {
    btnRegistrar.disabled = true;
  }

  try {
    mostrarMensagem("Obtendo localização...");

    localizacao = await obterLocalizacao();

    if (btnRegistrar) {
      btnRegistrar.textContent = "Identificando espécie...";
    }

    // Identificação por IA
    identificacaoAtual = await identificarEspecie(
      imagemSelecionada,
      localizacao
    );

    console.log("ARKA: identificação recebida:", identificacaoAtual);

    if (
      especie &&
      identificacaoAtual.scientific_name
    ) {
      especie.value = identificacaoAtual.scientific_name;
    }

    mostrarResultado(identificacaoAtual);

    if (btnRegistrar) {
      btnRegistrar.textContent = "Enviando imagem...";
    }

    const imagemUrl = await enviarImagem(imagemSelecionada);

    if (btnRegistrar) {
      btnRegistrar.textContent = "Salvando observação...";
    }

    const dadosObservacao = {
      species:
        identificacaoAtual.scientific_name ||
        especie?.value?.trim() ||
        "Não identificado",

      common_name:
        identificacaoAtual.common_name,

      confidence:
        identificacaoAtual.confidence,

      image_url:
        imagemUrl,

      latitude:
        identificacaoAtual.latitude,

      longitude:
        identificacaoAtual.longitude,

      location_name:
        identificacaoAtual.location_name,

      notes:
        observacao?.value?.trim() || null
    };

    console.log("ARKA: salvando observação:", dadosObservacao);

    await salvarNoBanco(dadosObservacao);

    mostrarMensagem("Observação registrada com sucesso!", "sucesso");

    let mensagem = "Observação registrada com sucesso!";

    if (identificacaoAtual.common_name) {
      mensagem += `\nNome comum: ${identificacaoAtual.common_name}`;
    }

    if (identificacaoAtual.scientific_name) {
      mensagem += `\nNome científico: ${identificacaoAtual.scientific_name}`;
    }

    if (identificacaoAtual.confidence !== null) {
      const porcentagem = Math.round(
        Number(identificacaoAtual.confidence) * 100
      );
      mensagem += `\nConfiança informada pela IA: ${porcentagem}%`;
    }

    if (identificacaoAtual.location_name) {
      mensagem += `\nLocalização: ${identificacaoAtual.location_name}`;
    }

    alert(mensagem);

    // Limpar formulário após sucesso
    imagemSelecionada = null;
    localizacao = null;
    identificacaoAtual = null;

    if (urlPreviaAtual) {
      URL.revokeObjectURL(urlPreviaAtual);
      urlPreviaAtual = null;
    }

    if (preview) {
      preview.removeAttribute("src");
      preview.style.display = "none";
    }

    if (especie) especie.value = "";
    if (observacao) observacao.value = "";
    if (camera) camera.value = "";
    if (gallery) gallery.value = "";

    if (resultadoIA) {
      resultadoIA.hidden = true;
      resultadoIA.replaceChildren();
    }

  } catch (erro) {
    console.error("ARKA: erro ao registrar:", erro);

    const mensagem =
      erro instanceof Error
        ? erro.message
        : String(erro);

    mostrarMensagem(mensagem, "erro");
    alert(`Erro ao registrar observação:\n\n${mensagem}`);

  } finally {
    if (btnRegistrar) {
      btnRegistrar.disabled = false;
      btnRegistrar.textContent = "Identificar e salvar observação";
    }
  }
}


// ======================================================
// EVENTO DO BOTÃO
// ======================================================

btnRegistrar?.addEventListener(
  "click",
  registrarObservacao
);


// ======================================================
// INICIALIZAÇÃO
// ======================================================

console.log("ARKA Genesis: script carregado.");
