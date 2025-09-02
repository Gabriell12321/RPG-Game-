// Criar pasta para sons de lanterna se não existir
if (!fs.existsSync('./audio')) {
    fs.mkdirSync('./audio');
}

// Informações sobre os arquivos de áudio da lanterna
const arquivosAudio = [
    {
        nome: 'lanterna_on.mp3',
        url: 'https://freesound.org/data/previews/274/274553_5312765-lq.mp3'
    },
    {
        nome: 'lanterna_off.mp3',
        url: 'https://freesound.org/data/previews/274/274554_5312765-lq.mp3'
    },
    {
        nome: 'lanterna_bateria_baixa.mp3',
        url: 'https://freesound.org/data/previews/257/257652_4205536-lq.mp3'
    }
];

// Função para baixar os arquivos de áudio
async function baixarArquivosAudio() {
    for (const arquivo of arquivosAudio) {
        try {
            const response = await fetch(arquivo.url);
            if (!response.ok) {
                throw new Error(`Erro ao baixar o arquivo ${arquivo.nome}: ${response.statusText}`);
            }
            
            const buffer = await response.arrayBuffer();
            const dadosAudio = Buffer.from(buffer);
            
            fs.writeFileSync(`./audio/${arquivo.nome}`, dadosAudio);
            console.log(`Arquivo ${arquivo.nome} baixado com sucesso!`);
        } catch (erro) {
            console.error(`Erro ao baixar o arquivo ${arquivo.nome}:`, erro);
        }
    }
}

// Executar o download
baixarArquivosAudio().then(() => {
    console.log('Download de áudios da lanterna concluído!');
});
