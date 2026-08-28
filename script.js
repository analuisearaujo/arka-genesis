const SUPABASE_URL = "https://haoqywnqxeydylfzxqzz.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_JFc8Bh6QZyFx5iO-7izQ4g_jx8SjxS7";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const camera = document.getElementById("camera");
const gallery = document.getElementById("gallery");

camera.addEventListener("change", processarImagem);
gallery.addEventListener("change", processarImagem);

let imagemSelecionada = null;

function processarImagem(event) {

    const arquivo = event.target.files[0];

    if (!arquivo) return;

    imagemSelecionada = arquivo;

    const preview = document.getElementById("preview");
    const analise = document.getElementById("analise");
    const resultado = document.getElementById("resultado");

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";

    resultado.style.display = "none";

    analise.innerHTML = "🧠 Preparando análise...";

    setTimeout(() => {

        analise.innerHTML = "";

        resultado.style.display = "block";

    }, 1500);
}

document.querySelector(".salvar").addEventListener("click", salvarObservacao);

async function salvarObservacao() {

    if (!imagemSelecionada) {
        alert("Selecione uma imagem primeiro.");
        return;
    }

    const { data, error } = await supabase
        .from("observations")
        .insert([
            {
                species: "Crotalus durissus",
                common_name: "Cascavel",
                location_name: "Teste ARKA Genesis",
                notes: "Observação criada pelo site."
            }
        ])
        .select();

    if (error) {
        console.error("Erro ao salvar:", error);
        alert("Não foi possível salvar a observação.");
        return;
    }

    console.log("Observação salva:", data);

    alert("✅ Observação salva com sucesso!");
}
