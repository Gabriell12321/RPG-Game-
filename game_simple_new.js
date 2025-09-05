// RPG de Terror - Versão Simplificada e Robusta
console.log("Iniciando jogo...");

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, iniciando jogo...");
    
    // Constantes do jogo
    const BASE_W = 320, BASE_H = 180, SCALE = 3;
    const SCREEN_W = BASE_W * SCALE, SCREEN_H = BASE_H * SCALE;
    
    const MENU_OPTIONS = ["Novo Jogo", "Continuar", "Opções", "Segredos", "Desistir"];
    const GAME_VERSION = "Pesadelo v0.2";
    
    // Sistema de Save/Load
    const SAVE_KEY = 'pesadelo_pixelado_save';
    let temSaveDisponivel = false;
    
    // Verificar se existe save ao inicializar
    function verificarSaveDisponivel() {
        const saveData = localStorage.getItem(SAVE_KEY);
        temSaveDisponivel = saveData !== null;
        console.log("Save disponível:", temSaveDisponivel);
        return temSaveDisponivel;
    }
    
    // Salvar o jogo
    function salvarJogo() {
        const saveData = {
            versao: GAME_VERSION,
            timestamp: Date.now(),
            jogador: {
                posicao: { ...jogador.posicao },
                vida: jogador.vida,
                vidaMaxima: jogador.vidaMaxima,
                sanidade: jogador.sanidade,
                sanidadeMaxima: jogador.sanidadeMaxima,
                velocidade: jogador.velocidade,
                lanterna: jogador.lanterna,
                efeitos: { ...jogador.efeitos }
            },
            ambiente: ambiente,
            mundoOffset: { ...mundoOffset },
            inimigosAtivos: inimigosAtivos.map(inimigo => ({
                tipo: inimigo.tipo,
                posicao: { ...inimigo.posicao },
                vida: inimigo.vida,
                vidaMaxima: inimigo.vidaMaxima,
                alerta: inimigo.alerta
            })),
            estatisticas: {
                tempoJogado: tick,
                inimigosEliminados: 0,
                mortesJogador: 0
            }
        };
        
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            console.log("Jogo salvo com sucesso!");
            
            // Atualizar status de save disponível
            verificarSaveDisponivel();
            
            // Efeito visual de save
            if (window.EfeitosVisuais) {
                window.EfeitosVisuais.criarFlash('#00ff00', 500, 0.2);
                window.EfeitosVisuais.criarExplosao(jogador.posicao.x, jogador.posicao.y, '#00ff00', 15, 4, 1000);
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao salvar:", error);
            return false;
        }
    }
    
    // Carregar o jogo
    function carregarJogo() {
        try {
            const saveData = localStorage.getItem(SAVE_KEY);
            if (!saveData) {
                console.log("Nenhum save encontrado");
                return false;
            }
            
            const dados = JSON.parse(saveData);
            
            // Verificar versão (opcional - para compatibilidade futura)
            if (dados.versao !== GAME_VERSION) {
                console.warn("Save de versão diferente:", dados.versao);
                // Aqui poderia ter migração de dados se necessário
            }
            
            // Restaurar estado do jogador
            jogador.posicao = { ...dados.jogador.posicao };
            jogador.vida = dados.jogador.vida;
            jogador.vidaMaxima = dados.jogador.vidaMaxima;
            jogador.sanidade = dados.jogador.sanidade;
            jogador.sanidadeMaxima = dados.jogador.sanidadeMaxima;
            jogador.velocidade = dados.jogador.velocidade;
            jogador.lanterna = dados.jogador.lanterna || false;
            jogador.efeitos = { ...dados.jogador.efeitos };
            
            // Restaurar ambiente
            ambiente = dados.ambiente;
            if (dados.mundoOffset) {
                mundoOffset = { ...dados.mundoOffset };
            }
            
            // Restaurar inimigos
            inimigosAtivos = [];
            if (dados.inimigosAtivos) {
                dados.inimigosAtivos.forEach(inimigoData => {
                    const inimigo = criarInimigo(inimigoData.tipo, inimigoData.posicao.x, inimigoData.posicao.y);
                    if (inimigo) {
                        inimigo.vida = inimigoData.vida;
                        inimigo.vidaMaxima = inimigoData.vidaMaxima;
                        inimigo.alerta = inimigoData.alerta;
                        inimigosAtivos.push(inimigo);
                    }
                });
            }
            
            // Restaurar tick (tempo de jogo)
            if (dados.estatisticas && dados.estatisticas.tempoJogado) {
                tick = dados.estatisticas.tempoJogado;
            }
            
            console.log("Jogo carregado com sucesso!");
            
            // Efeito visual de load
            if (window.EfeitosVisuais) {
                window.EfeitosVisuais.criarFlash('#0080ff', 500, 0.2);
                window.EfeitosVisuais.criarExplosao(jogador.posicao.x, jogador.posicao.y, '#0080ff', 20, 5, 1200);
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao carregar:", error);
            return false;
        }
    }
    
    // Deletar save
    function deletarSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
            temSaveDisponivel = false;
            console.log("Save deletado");
            return true;
        } catch (error) {
            console.error("Erro ao deletar save:", error);
            return false;
        }
    }
    
    // Inicializar verificação de save
    verificarSaveDisponivel();
    
    // Verificar se o canvas existe
    const canvas = document.getElementById('screen');
    if (!canvas) {
        console.error("Canvas não encontrado!");
        return;
    }
    
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Canvas offscreen para pixel art
    const base = document.createElement('canvas');
    base.width = BASE_W;
    base.height = BASE_H;
    const bctx = base.getContext('2d');
    
    // Estado do jogo
    let selected = 0;
    let tick = 0;
    let menuState = 'main';
    let gameState = 'menu'; // menu, game, options, credits, quit
    let ambiente = 'casa'; // casa, quintal, mundo
    
    // Sistema de personagens
    let gerenciadorPersonagens = null;
    let jogoInicializado = false;
    
    // Personagem principal (simplificado para integração)
    const jogador = {
        posicao: { x: BASE_W / 2, y: BASE_H / 2 },
        vida: 100,
        vidaMaxima: 100,
        sanidade: 100,
        sanidadeMaxima: 100,
        velocidade: 2,
        sprite: { width: 14, height: 18 }, // Sprite ligeiramente maior para o novo visual
        animacao: {
            frame: 0,
            direcao: 'down', // up, down, left, right
            andando: false,
            tempoFrame: 0
        },
        // Propriedades para efeitos visuais
        ultimoDano: 0,
        ultimoAtaque: 0,
        ultimaCura: 0,
        lanterna: false, // Adicionado para rastrear o estado da lanterna
        // Propriedades de aparência
        aparencia: {
            corCabelo: '#8B4513', // Marrom
            corPele: '#FFD1B7',   // Tom de pele
            corRoupa: '#4169E1',  // Azul royal
            corOlhos: '#0066ff',  // Azul
            // Estilos adicionais para diferentes ambientes
            equipamentos: {
                casa: { nome: 'Roupas Normais' },
                quintal: { nome: 'Equipamento de Explorador' }
            }
        },
        // Efeitos visuais especiais
        efeitos: {
            ultimoSuspiro: 0,     // Tempo do último suspiro de cansaço
            piscarOlhos: 0,       // Tempo para piscar os olhos
            passosTomados: 0      // Contagem de passos (para cansaço)
        }
    };
    
    // Lista de inimigos ativos
    let inimigosAtivos = [];
    
    // Sistema básico de mobs
    const tiposMobs = {
        sombra: {
            nome: "Sombra",
            vida: 30,
            dano: 10,
            velocidade: 1,
            cor: 'rgba(50, 0, 50, 0.8)',
            tamanho: 6
        },
        fantasma: {
            nome: "Fantasma",
            vida: 20,
            dano: 15,
            velocidade: 1.5,
            cor: 'rgba(200, 200, 255, 0.6)',
            tamanho: 8
        }
    };
    
    // Mensagens para diferentes estados
    const stateMessages = {
        game: "INICIANDO PESADELO...\n\nVocê acorda em um quarto escuro.\nUm trovão ilumina brevemente o ambiente.\nA porta está entreaberta. Algo se move nas sombras...\n\nUse WASD para mover\nESPAÇO para atacar\n1,2,3 para tipos de ataque\nE para navegar entre ambientes\n(Casa → Quintal → Mundo Aberto)\nESC para menu",
        options: "OPÇÕES\n\nUse as setas para navegar\nPressione ESC para voltar",
        credits: "SEGREDOS OCULTOS\n\nEste jogo foi desenvolvido por Gabriell12321\n\nAlguns segredos estão escondidos nas sombras...\nNem tudo é o que parece...\n\nPressione ESC para voltar",
        quit: "VOCÊ TENTA FUGIR...\n\n...mas o pesadelo sempre volta.\n\nNão há escapatória."
    };
    
    // Configurações de áudio
    let audioConfig = {
        musicEnabled: true,
        sfxEnabled: true,
        musicVolume: 0.3,
        sfxVolume: 0.5
    };
    
    // Sistema de áudio sintético
    let audioContext = null;
    let backgroundMusicOscillator = null;
    let whisperNoiseNode = null;
    
    // Inicializar contexto de áudio
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Sistema de áudio inicializado");
            
            // Preparar o node para o efeito de sussurro
            whisperNoiseNode = audioContext.createBiquadFilter();
            whisperNoiseNode.type = "bandpass";
            whisperNoiseNode.frequency.value = 2000;
            whisperNoiseNode.Q.value = 0.5;
            
            // Adicionar sistema de áudio ao objeto global GameSystem
            window.GameSystem = window.GameSystem || {};
            window.GameSystem.audio = {
                playSound: playSound
            };
            
            return true;
        } catch (e) {
            console.log("Áudio não suportado:", e);
            return false;
        }
    }
    
    // Reproduzir sons diversos
    function playSound(soundId) {
        if (!audioContext || !audioConfig.sfxEnabled) return;
        
        try {
            // Configurações específicas para cada tipo de som
            let oscillatorType = 'sine';
            let frequency = 440;
            let duration = 0.3;
            let volume = audioConfig.sfxVolume;
            
            // Configurar som baseado no ID
            switch(soundId) {
                case 'lanterna_on':
                    oscillatorType = 'sine';
                    frequency = 650;
                    duration = 0.2;
                    volume = 0.3;
                    break;
                    
                case 'lanterna_off':
                    oscillatorType = 'sine';
                    frequency = 450;
                    duration = 0.3;
                    volume = 0.25;
                    break;
                    
                case 'lanterna_empty':
                    oscillatorType = 'triangle';
                    frequency = 150;
                    duration = 0.6;
                    volume = 0.4;
                    break;
                    
                default:
                    // Som padrão
                    break;
            }
            
            // Criar oscilador
            const oscillator = audioContext.createOscillator();
            oscillator.type = oscillatorType;
            oscillator.frequency.value = frequency;
            
            // Criar gain node para controlar o volume
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            
            // Conectar nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Tempo atual
            const now = audioContext.currentTime;
            
            // Configurar envelope ADSR simples
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(volume * 0.6, now + duration * 0.5);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);
            
            // Iniciar e parar o oscilador
            oscillator.start(now);
            oscillator.stop(now + duration);
            
        } catch(e) {
            console.error("Erro ao reproduzir som:", soundId, e);
        }
    }
    
    // Função para reproduzir som de sussurro
    function playWhisper(text) {
        if (!audioContext || !audioConfig.sfxEnabled) return;
        
        try {
            // Criar fonte de ruído branco para o sussurro
            const bufferSize = 2 * audioContext.sampleRate;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            // Preencher com ruído com variação baseada no texto
            const textLength = text.length;
            const intensity = Math.min(0.05 + (textLength / 500), 0.15); // Ajusta intensidade baseada no tamanho do texto
            
            for (let i = 0; i < bufferSize; i++) {
                // Ruído branco com baixa intensidade
                output[i] = (Math.random() * 2 - 1) * intensity;
            }
            
            // Modular o ruído para parecer sussurro
            const whisperSource = audioContext.createBufferSource();
            whisperSource.buffer = noiseBuffer;
            
            // Ajustar o filtro para o sussurro
            const whisperFilter = audioContext.createBiquadFilter();
            whisperFilter.type = "bandpass";
            whisperFilter.frequency.value = 1000 + (Math.random() * 1000);
            whisperFilter.Q.value = 0.5;
            
            // Criar envelope para modulação do sussurro
            const whisperGain = audioContext.createGain();
            whisperGain.gain.value = 0;
            
            // Conectar os nós
            whisperSource.connect(whisperFilter);
            whisperFilter.connect(whisperGain);
            whisperGain.connect(audioContext.destination);
            
            // Modular o volume para simular as palavras do sussurro
            const now = audioContext.currentTime;
            const duration = Math.min(0.5 + (textLength / 100), 3.0); // Duração baseada no texto
            
            // Início do sussurro (fade in)
            whisperGain.gain.setValueAtTime(0, now);
            whisperGain.gain.linearRampToValueAtTime(intensity * 3, now + 0.1);
            
            // Modulação (simula as sílabas)
            let time = now + 0.1;
            const syllableTime = duration / Math.max(textLength / 2, 4);
            
            for (let i = 0; i < textLength / 2; i++) {
                const val1 = intensity * (2 + Math.random());
                const val2 = intensity * (1 + Math.random());
                whisperGain.gain.linearRampToValueAtTime(val1, time + (syllableTime * 0.3));
                whisperGain.gain.linearRampToValueAtTime(val2, time + (syllableTime * 0.7));
                time += syllableTime;
            }
            
            // Fim do sussurro (fade out)
            whisperGain.gain.linearRampToValueAtTime(0, now + duration);
            
            // Iniciar e parar
            whisperSource.start(now);
            whisperSource.stop(now + duration);
            
            console.log(`Reproduzindo sussurro para: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`);
            
        } catch(e) {
            console.error("Erro ao reproduzir sussurro:", e);
        }
    }
    
    // Tocar som sintético
    function playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!audioContext || !audioConfig.sfxEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * audioConfig.sfxVolume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    // Música de fundo ambiente
    function startBackgroundMusic() {
        console.log('Tentando iniciar música de fundo...', {
            audioContext: !!audioContext,
            musicEnabled: audioConfig.musicEnabled,
            oscillatorExists: !!backgroundMusicOscillator
        });
        
        if (!audioContext || !audioConfig.musicEnabled || backgroundMusicOscillator) {
            console.log('Música não iniciada devido a condições:', {
                noAudioContext: !audioContext,
                musicDisabled: !audioConfig.musicEnabled,
                oscillatorAlreadyExists: !!backgroundMusicOscillator
            });
            return;
        }
        
        try {
            // Tom baixo e sombrio para música ambiente
            backgroundMusicOscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            backgroundMusicOscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            backgroundMusicOscillator.frequency.value = 55; // Nota A baixa
            backgroundMusicOscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(audioConfig.musicVolume * 0.1, audioContext.currentTime + 2);
            
            backgroundMusicOscillator.start();
            console.log('Música de fundo iniciada com sucesso!');
        } catch (error) {
            console.error('Erro ao iniciar música de fundo:', error);
        }
    }
    
    // Parar música de fundo
    function stopBackgroundMusic() {
        if (backgroundMusicOscillator) {
            backgroundMusicOscillator.stop();
            backgroundMusicOscillator = null;
        }
    }
    
    // Sons específicos do jogo
    function playSoundEffect(type) {
        switch(type) {
            case 'menuMove':
                playTone(800, 0.1, 'square', 0.05);
                break;
            case 'menuSelect':
                playTone(1200, 0.2, 'sine', 0.1);
                playTone(1600, 0.15, 'sine', 0.08);
                break;
            case 'damage':
                playTone(200, 0.3, 'sawtooth', 0.15);
                break;
            case 'attack':
                playTone(600, 0.1, 'square', 0.1);
                playTone(400, 0.1, 'square', 0.08);
                break;
            case 'footstep':
                playTone(150, 0.05, 'square', 0.03);
                break;
        }
    }
    
    // Partículas de chuva
    const particles = [];
    for(let i = 0; i < 80; i++) {
        particles.push({
            x: Math.random() * BASE_W,
            y: Math.random() * BASE_H,
            vx: (Math.random() - 0.5) * 0.2,
            vy: 2 + Math.random() * 3,
            size: Math.random() * 2.5 + 0.5,
            opacity: 0.4 + Math.random() * 0.6,
            length: 5 + Math.random() * 10
        });
    }
    
    // Controles de jogador
    let teclaE = false;
    let atacando = false;
    let tipoAtaque = 'rapido'; // 'rapido', 'medio', 'forte'
    let ultimoAtaque = 0;
    let tecla1 = false;
    let tecla2 = false;
    let tecla3 = false;
    
    // Função para desenhar o fundo animado
    function drawAnimatedBackground(ctx, t) {
        // Escolher o cenário baseado no ambiente atual
        if (ambiente === 'casa') {
            drawCasaInterior(ctx, t);
        } else if (ambiente === 'quintal') {
            drawQuintal(ctx, t);
        } else if (ambiente === 'mundo') {
            drawMundoAberto(ctx, t);
        }
    }
    
    // Desenhar interior da casa
    function drawCasaInterior(ctx, t) {
        // Fundo básico - piso de madeira com tonalidade mais escura e rica
        const floorGradient = ctx.createLinearGradient(0, 0, BASE_W, BASE_H);
        floorGradient.addColorStop(0, '#2a1f18');
        floorGradient.addColorStop(0.5, '#3d2f22');
        floorGradient.addColorStop(1, '#2f2318');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Padrão do piso de madeira aprimorado
        ctx.strokeStyle = 'rgba(15, 10, 5, 0.4)';
        ctx.lineWidth = 0.5;
        for(let y = 0; y < BASE_H; y += 12) {
            ctx.beginPath();
            ctx.moveTo(0, y + Math.sin(y * 0.1) * 1);
            ctx.lineTo(BASE_W, y + Math.sin(y * 0.1) * 1);
            ctx.stroke();
        }
        
        // Padrão vertical do piso com variação
        ctx.strokeStyle = 'rgba(40, 25, 15, 0.3)';
        for(let x = 0; x < BASE_W; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x + Math.sin(x * 0.05) * 2, 0);
            ctx.lineTo(x + Math.sin(x * 0.05) * 2, BASE_H);
            ctx.stroke();
        }
        
        // Paredes com textura e gradiente
        const wallGradient = ctx.createLinearGradient(0, 0, 0, 30);
        wallGradient.addColorStop(0, '#1a0f08');
        wallGradient.addColorStop(1, '#2f1f12');
        ctx.fillStyle = wallGradient;
        
        // Parede superior
        ctx.fillRect(0, 0, BASE_W, 30);
        // Parede esquerda
        ctx.fillRect(0, 0, 30, BASE_H);
        // Parede direita
        ctx.fillRect(BASE_W - 30, 0, 30, BASE_H);
        // Parede inferior
        ctx.fillRect(0, BASE_H - 30, BASE_W, 30);
        
        // Textura das paredes
        ctx.fillStyle = 'rgba(60, 40, 20, 0.2)';
        for(let i = 0; i < 50; i++) {
            const x = Math.random() * BASE_W;
            const y = Math.random() * 30;
            ctx.fillRect(x, y, 1, 2);
            if(x < 30) ctx.fillRect(x, Math.random() * BASE_H, 1, 2);
            if(x > BASE_W - 30) ctx.fillRect(x, Math.random() * BASE_H, 1, 2);
            ctx.fillRect(Math.random() * BASE_W, BASE_H - 30 + Math.random() * 30, 2, 1);
        }
        
        // Porta para o quintal (parede inferior) - melhorada
        const doorGradient = ctx.createLinearGradient(BASE_W/2 - 15, BASE_H - 30, BASE_W/2 + 15, BASE_H);
        doorGradient.addColorStop(0, '#4a3428');
        doorGradient.addColorStop(0.5, '#5d412f');
        doorGradient.addColorStop(1, '#4a3428');
        ctx.fillStyle = doorGradient;
        ctx.fillRect(BASE_W/2 - 15, BASE_H - 30, 30, 30);
        
        // Detalhes da porta
        ctx.strokeStyle = '#6b4a35';
        ctx.lineWidth = 1;
        ctx.strokeRect(BASE_W/2 - 13, BASE_H - 28, 26, 26);
        ctx.strokeRect(BASE_W/2 - 10, BASE_H - 25, 20, 20);
        
        // Maçaneta da porta com brilho
        const knobGradient = ctx.createRadialGradient(BASE_W/2 + 10, BASE_H - 13, 1, BASE_W/2 + 10, BASE_H - 13, 3);
        knobGradient.addColorStop(0, '#e6c090');
        knobGradient.addColorStop(1, '#b8956b');
        ctx.fillStyle = knobGradient;
        ctx.beginPath();
        ctx.arc(BASE_W/2 + 10, BASE_H - 13, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Móveis aprimorados
        
        // Mesa com detalhes
        const tableGradient = ctx.createLinearGradient(50, 50, 110, 90);
        tableGradient.addColorStop(0, '#704030');
        tableGradient.addColorStop(1, '#5a3020');
        ctx.fillStyle = tableGradient;
        ctx.fillRect(50, 50, 60, 40);
        
        // Bordas da mesa
        ctx.strokeStyle = '#4a2818';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, 60, 40);
        
        // Pernas da mesa
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(52, 88, 4, 8);
        ctx.fillRect(104, 88, 4, 8);
        ctx.fillRect(52, 52, 4, 8);
        ctx.fillRect(104, 52, 4, 8);
        
        // Sombra da mesa aprimorada
        const shadowGradient = ctx.createRadialGradient(80, 95, 5, 80, 100, 30);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(45, 90, 70, 15);
        
        // Cadeiras melhoradas
        ctx.fillStyle = '#5a3828';
        // Cadeira 1
        ctx.fillRect(38, 58, 12, 12);
        ctx.fillRect(40, 50, 8, 8); // Encosto
        // Cadeira 2
        ctx.fillRect(112, 58, 12, 12);
        ctx.fillRect(114, 50, 8, 8); // Encosto
        
        // Armário com detalhes aprimorados
        const cabinetGradient = ctx.createLinearGradient(BASE_W - 75, 40, BASE_W - 40, 120);
        cabinetGradient.addColorStop(0, '#453020');
        cabinetGradient.addColorStop(1, '#352010');
        ctx.fillStyle = cabinetGradient;
        ctx.fillRect(BASE_W - 75, 40, 35, 80);
        
        // Bordas do armário
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 1;
        ctx.strokeRect(BASE_W - 75, 40, 35, 80);
        
        // Portas do armário
        ctx.fillStyle = '#6b4030';
        ctx.fillRect(BASE_W - 72, 45, 14, 30);
        ctx.fillRect(BASE_W - 72, 80, 14, 30);
        ctx.fillRect(BASE_W - 55, 45, 14, 30);
        ctx.fillRect(BASE_W - 55, 80, 14, 30);
        
        // Puxadores
        ctx.fillStyle = '#c0a080';
        ctx.fillRect(BASE_W - 60, 58, 1, 3);
        ctx.fillRect(BASE_W - 60, 93, 1, 3);
        ctx.fillRect(BASE_W - 47, 58, 1, 3);
        ctx.fillRect(BASE_W - 47, 93, 1, 3);
        
        // Cama mais detalhada
        const bedGradient = ctx.createLinearGradient(40, BASE_H - 80, 90, BASE_H - 40);
        bedGradient.addColorStop(0, '#654040');
        bedGradient.addColorStop(1, '#4a2828');
        ctx.fillStyle = bedGradient;
        ctx.fillRect(40, BASE_H - 80, 50, 40);
        
        // Estrutura da cama
        ctx.strokeStyle = '#3a1f1f';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, BASE_H - 80, 50, 40);
        
        // Travesseiro aprimorado
        const pillowGradient = ctx.createRadialGradient(52, BASE_H - 70, 2, 52, BASE_H - 70, 8);
        pillowGradient.addColorStop(0, '#f5f5f5');
        pillowGradient.addColorStop(1, '#d5d5d5');
        ctx.fillStyle = pillowGradient;
        ctx.fillRect(45, BASE_H - 75, 15, 10);
        
        // Cobertor com padrão
        ctx.fillStyle = '#8a4040';
        ctx.fillRect(45, BASE_H - 65, 40, 25);
        // Padrão do cobertor
        ctx.strokeStyle = '#6a2a2a';
        ctx.lineWidth = 0.5;
        for(let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(45 + i * 10, BASE_H - 65);
            ctx.lineTo(45 + i * 10, BASE_H - 40);
            ctx.stroke();
        }
        
        // Tapete com padrão mais detalhado
        const rugGradient = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 10, BASE_W/2, BASE_H/2, 35);
        rugGradient.addColorStop(0, '#b07050');
        rugGradient.addColorStop(1, '#8a5030');
        ctx.fillStyle = rugGradient;
        ctx.fillRect(BASE_W/2 - 35, BASE_H/2 - 25, 70, 50);
        
        // Padrão do tapete
        ctx.strokeStyle = '#6a3020';
        ctx.lineWidth = 1;
        ctx.strokeRect(BASE_W/2 - 30, BASE_H/2 - 20, 60, 40);
        ctx.strokeRect(BASE_W/2 - 25, BASE_H/2 - 15, 50, 30);
        
        // Estante de livros melhorada
        ctx.fillStyle = '#5a3828';
        ctx.fillRect(BASE_W - 70, BASE_H - 100, 45, 65);
        
        // Prateleiras
        ctx.fillStyle = '#4a2818';
        ctx.fillRect(BASE_W - 68, BASE_H - 85, 41, 2);
        ctx.fillRect(BASE_W - 68, BASE_H - 65, 41, 2);
        ctx.fillRect(BASE_W - 68, BASE_H - 45, 41, 2);
        
        // Livros na estante com cores variadas
        const bookColors = ['#c05040', '#d09030', '#5060c0', '#60a040', '#a040c0', '#c04060'];
        for(let shelf = 0; shelf < 3; shelf++) {
            for(let book = 0; book < 4; book++) {
                const bookColor = bookColors[Math.floor(((shelf * 4 + book) * 17) % bookColors.length)];
                ctx.fillStyle = bookColor;
                const bookX = BASE_W - 65 + book * 9;
                const bookY = BASE_H - 95 + shelf * 20;
                const bookHeight = 12 + ((shelf * 4 + book) % 4);
                ctx.fillRect(bookX, bookY, 7, bookHeight);
                
                // Detalhes dos livros
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(bookX + 1, bookY + 1, 5, 1);
            }
        }
        
        // Janela na parede aprimorada
        const windowGradient = ctx.createLinearGradient(30, 5, 70, 20);
        windowGradient.addColorStop(0, '#0f1a2a');
        windowGradient.addColorStop(0.5, '#1a2a3a');
        windowGradient.addColorStop(1, '#0f1a2a');
        ctx.fillStyle = windowGradient;
        ctx.fillRect(30, 5, 40, 18);
        
        // Moldura da janela
        ctx.strokeStyle = '#6a5040';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 5, 40, 18);
        
        // Grade da janela
        ctx.strokeStyle = '#8a7060';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, 5);
        ctx.lineTo(50, 23);
        ctx.moveTo(30, 14);
        ctx.lineTo(70, 14);
        ctx.stroke();
        
        // Reflexo na janela
        ctx.fillStyle = 'rgba(200, 220, 255, 0.1)';
        ctx.fillRect(32, 7, 15, 8);
        
        // Luz ambiente que pisca levemente
        const lightFlicker = Math.sin(t * 0.008) * 0.03 + 0.97;
        const ambientGradient = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 20, BASE_W/2, BASE_H/2, 100);
        ambientGradient.addColorStop(0, `rgba(255, 220, 180, ${0.12 * lightFlicker})`);
        ambientGradient.addColorStop(1, `rgba(255, 200, 150, ${0.05 * lightFlicker})`);
        ctx.fillStyle = ambientGradient;
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Lareira aprimorada
        const fireplaceGradient = ctx.createLinearGradient(25, BASE_H - 75, 75, BASE_H - 25);
        fireplaceGradient.addColorStop(0, '#3a2618');
        fireplaceGradient.addColorStop(1, '#2a1608');
        ctx.fillStyle = fireplaceGradient;
        ctx.fillRect(25, BASE_H - 75, 50, 50);
        
        // Borda da lareira
        ctx.strokeStyle = '#1a0f05';
        ctx.lineWidth = 2;
        ctx.strokeRect(25, BASE_H - 75, 50, 50);
        
        // Interior da lareira
        ctx.fillStyle = '#0f0605';
        ctx.fillRect(30, BASE_H - 70, 40, 40);
        
        // Fogo animado mais realista
        const fireIntensity = Math.sin(t * 0.08) * 0.3 + 0.7;
        for(let i = 0; i < 20; i++) {
            const flameHeight = 8 + Math.sin(t * 0.12 + i * 0.5) * 6 * fireIntensity;
            const flameWidth = 2 + Math.sin(t * 0.15 + i * 0.3) * 1.5;
            const flameX = 35 + i * 1.8;
            
            // Chama principal
            ctx.fillStyle = `rgba(255, ${80 + Math.sin(t * 0.1 + i) * 60}, 0, ${0.8 + Math.sin(t * 0.2 + i) * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(flameX, BASE_H - 35);
            ctx.quadraticCurveTo(
                flameX - flameWidth, BASE_H - 35 - flameHeight * 0.6,
                flameX, BASE_H - 35 - flameHeight
            );
            ctx.quadraticCurveTo(
                flameX + flameWidth, BASE_H - 35 - flameHeight * 0.6,
                flameX, BASE_H - 35
            );
            ctx.fill();
            
            // Núcleo da chama
            ctx.fillStyle = `rgba(255, 255, 100, ${0.5 + Math.sin(t * 0.25 + i) * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(flameX, BASE_H - 35);
            ctx.quadraticCurveTo(
                flameX - flameWidth * 0.5, BASE_H - 35 - flameHeight * 0.4,
                flameX, BASE_H - 35 - flameHeight * 0.7
            );
            ctx.quadraticCurveTo(
                flameX + flameWidth * 0.5, BASE_H - 35 - flameHeight * 0.4,
                flameX, BASE_H - 35
            );
            ctx.fill();
        }
        
        // Iluminação da lareira
        const fireLightRadius = 50 + Math.sin(t * 0.1) * 15;
        const fireLightGradient = ctx.createRadialGradient(50, BASE_H - 50, 5, 50, BASE_H - 50, fireLightRadius);
        fireLightGradient.addColorStop(0, `rgba(255, 150, 50, ${0.15 * fireIntensity})`);
        fireLightGradient.addColorStop(0.5, `rgba(255, 100, 30, ${0.08 * fireIntensity})`);
        fireLightGradient.addColorStop(1, 'rgba(255, 80, 20, 0)');
        ctx.fillStyle = fireLightGradient;
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Porta-objetos decorativo melhorado
        ctx.fillStyle = '#6a4535';
        ctx.fillRect(150, 30, 75, 18);
        ctx.strokeStyle = '#4a3025';
        ctx.strokeRect(150, 30, 75, 18);
        
        // Objetos decorativos
        // Vaso
        const vaseGradient = ctx.createLinearGradient(162, 12, 168, 30);
        vaseGradient.addColorStop(0, '#b0b0d0');
        vaseGradient.addColorStop(1, '#8080a0');
        ctx.fillStyle = vaseGradient;
        ctx.fillRect(162, 12, 12, 18);
        
        // Planta no vaso
        ctx.fillStyle = '#60a060';
        ctx.beginPath();
        ctx.arc(168, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#40a040';
        ctx.beginPath();
        ctx.arc(165, 6, 3, 0, Math.PI * 2);
        ctx.arc(171, 6, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Caixa decorativa
        const boxGradient = ctx.createLinearGradient(185, 18, 200, 28);
        boxGradient.addColorStop(0, '#d0a080');
        boxGradient.addColorStop(1, '#a08060');
        ctx.fillStyle = boxGradient;
        ctx.fillRect(185, 18, 18, 12);
        ctx.strokeStyle = '#806050';
        ctx.strokeRect(185, 18, 18, 12);
        
        // Livro
        ctx.fillStyle = '#8060a0';
        ctx.fillRect(210, 20, 10, 15);
        ctx.strokeStyle = '#604080';
        ctx.strokeRect(210, 20, 10, 15);
        
        // Sombras volumétricas nas paredes
        const wallShadowGradient = ctx.createLinearGradient(0, 0, 30, 30);
        wallShadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        wallShadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = wallShadowGradient;
        ctx.fillRect(0, 0, 30, BASE_H);
        ctx.fillRect(0, 0, BASE_W, 30);
        
        // === BAÚ DE SAVE ===
        const bauX = BASE_W - 55;
        const bauY = 50;
        const bauLargura = 25;
        const bauAltura = 18;
        
        // Sombra do baú
        const bauShadowGradient = ctx.createEllipse ? 
            ctx.createRadialGradient(bauX + bauLargura/2, bauY + bauAltura + 2, 5, bauX + bauLargura/2, bauY + bauAltura + 2, 15) :
            ctx.createRadialGradient(bauX + bauLargura/2, bauY + bauAltura + 2, 5, bauX + bauLargura/2, bauY + bauAltura + 2, 15);
        bauShadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        bauShadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bauShadowGradient;
        ctx.beginPath();
        ctx.ellipse(bauX + bauLargura/2, bauY + bauAltura + 2, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo do baú
        const bauGradient = ctx.createLinearGradient(bauX, bauY, bauX, bauY + bauAltura);
        bauGradient.addColorStop(0, '#8B4513');  // Marrom escuro
        bauGradient.addColorStop(0.3, '#A0522D');  // Marrom médio
        bauGradient.addColorStop(0.7, '#654321');  // Marrom escuro
        bauGradient.addColorStop(1, '#4A2C17');  // Marrom muito escuro
        ctx.fillStyle = bauGradient;
        ctx.fillRect(bauX, bauY + 8, bauLargura, bauAltura - 8);
        
        // Tampa do baú
        const tampaGradient = ctx.createLinearGradient(bauX, bauY, bauX, bauY + 10);
        tampaGradient.addColorStop(0, '#A0522D');
        tampaGradient.addColorStop(1, '#8B4513');
        ctx.fillStyle = tampaGradient;
        ctx.fillRect(bauX, bauY, bauLargura, 10);
        
        // Bordas e detalhes do baú
        ctx.strokeStyle = '#4A2C17';
        ctx.lineWidth = 1;
        ctx.strokeRect(bauX, bauY, bauLargura, bauAltura);
        ctx.strokeRect(bauX, bauY + 8, bauLargura, bauAltura - 8);
        
        // Fechadura do baú
        const fechaduraX = bauX + bauLargura - 6;
        const fechaduraY = bauY + bauAltura/2;
        
        // Base da fechadura
        ctx.fillStyle = '#FFD700';  // Dourado
        ctx.beginPath();
        ctx.arc(fechaduraX, fechaduraY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#DAA520';  // Dourado escuro
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Buraco da chave
        ctx.fillStyle = '#2F1B14';
        ctx.beginPath();
        ctx.arc(fechaduraX, fechaduraY, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Ferragens do baú
        ctx.strokeStyle = '#4A2C17';
        ctx.lineWidth = 1;
        // Ferragens horizontais
        ctx.beginPath();
        ctx.moveTo(bauX + 2, bauY + 4);
        ctx.lineTo(bauX + bauLargura - 2, bauY + 4);
        ctx.moveTo(bauX + 2, bauY + bauAltura - 4);
        ctx.lineTo(bauX + bauLargura - 2, bauY + bauAltura - 4);
        ctx.stroke();
        
        // Ferragens verticais nos cantos
        ctx.beginPath();
        ctx.moveTo(bauX + 2, bauY + 2);
        ctx.lineTo(bauX + 2, bauY + bauAltura - 2);
        ctx.moveTo(bauX + bauLargura - 2, bauY + 2);
        ctx.lineTo(bauX + bauLargura - 2, bauY + bauAltura - 2);
        ctx.stroke();
        
        // Efeito de brilho se o jogador estiver próximo
        const distanciaBau = Math.sqrt(
            Math.pow(jogador.posicao.x - (bauX + bauLargura/2), 2) + 
            Math.pow(jogador.posicao.y - (bauY + bauAltura/2), 2)
        );
        
        if (distanciaBau < 25) {
            // Brilho dourado ao redor do baú
            const brilhoPulse = Math.sin(t * 0.1) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 215, 0, ${brilhoPulse * 0.8})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(bauX - 2, bauY - 2, bauLargura + 4, bauAltura + 4);
            
            // Partículas douradas (ocasionais)
            if (window.EfeitosVisuais && Math.random() > 0.92) {
                window.EfeitosVisuais.criarMagia(
                    bauX + bauLargura/2 + (Math.random() * 10 - 5), 
                    bauY + bauAltura/2 + (Math.random() * 10 - 5), 
                    '#FFD700', 
                    3
                );
            }
        }
        
        // Interação - Texto indicando a porta para o quintal
        if(jogador.posicao.y > BASE_H - 45 && 
          Math.abs(jogador.posicao.x - BASE_W/2) < 25) {
            // Fundo do texto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(BASE_W/2 - 60, BASE_H - 40, 120, 12);
            
            // Texto com sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 8px monospace';
            ctx.fillText("Pressione E para sair", BASE_W/2 - 58, BASE_H - 32);
            ctx.fillStyle = '#ffeeaa';
            ctx.fillText("Pressione E para sair", BASE_W/2 - 59, BASE_H - 33);
        }
        
        // Interação com o baú de save
        if (distanciaBau < 20) {
            // Fundo do texto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(bauX - 35, bauY - 15, 95, 12);
            
            // Texto com sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 8px monospace';
            ctx.fillText("Pressione S para salvar", bauX - 33, bauY - 7);
            ctx.fillStyle = '#FFD700';
            ctx.fillText("Pressione S para salvar", bauX - 34, bauY - 8);
        }
    }
    
    // Desenhar o quintal
    function drawQuintal(ctx, t) {
        // Gradiente do céu noturno
        const gradient = ctx.createLinearGradient(0, 0, 0, BASE_H);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.3, '#1a0a2a');
        gradient.addColorStop(0.7, '#2a1a3a');
        gradient.addColorStop(1, '#0a0515');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Estrelas piscando
        ctx.fillStyle = 'white';
        for(let i = 0; i < 50; i++) {
            const starX = (i * 37) % BASE_W;
            const starY = (i * 23) % (BASE_H * 0.6);
            const twinkle = Math.sin(t * 0.01 + i) * 0.5 + 0.5;
            ctx.globalAlpha = twinkle * 0.8;
            ctx.fillRect(starX, starY, 1, 1);
        }
        ctx.globalAlpha = 1.0;
        
        // Lua
        const moonX = BASE_W - 40;
        const moonY = 25;
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho da lua
        ctx.fillStyle = 'rgba(255, 255, 204, 0.3)';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Chão do quintal (grama escura)
        ctx.fillStyle = '#0a1a0a';
        ctx.fillRect(0, BASE_H * 0.6, BASE_W, BASE_H * 0.4);
        
        // Textura da grama
        for(let i = 0; i < 200; i++) {
            const grassX = Math.random() * BASE_W;
            const grassY = BASE_H * 0.6 + Math.random() * (BASE_H * 0.4);
            const grassHeight = 1 + Math.random() * 2;
            ctx.fillStyle = `rgba(0, ${40 + Math.random() * 20}, 0, 0.7)`;
            ctx.fillRect(grassX, grassY - grassHeight, 1, grassHeight);
        }
        
        // Casa ao fundo (parte de trás da casa)
        ctx.fillStyle = '#251510';
        ctx.fillRect(BASE_W/2 - 100, 20, 200, 80);
        
        // Telhado da casa
        ctx.fillStyle = '#1a0a05';
        ctx.beginPath();
        ctx.moveTo(BASE_W/2 - 110, 20);
        ctx.lineTo(BASE_W/2, 0);
        ctx.lineTo(BASE_W/2 + 110, 20);
        ctx.fill();
        
        // Janelas da casa
        for(let i = 0; i < 3; i++) {
            ctx.fillStyle = Math.random() > 0.7 ? '#504030' : '#302010';
            ctx.fillRect(BASE_W/2 - 80 + i*70, 30, 20, 20);
            
            // Grade da janela
            ctx.strokeStyle = '#605040';
            ctx.beginPath();
            ctx.moveTo(BASE_W/2 - 80 + i*70 + 10, 30);
            ctx.lineTo(BASE_W/2 - 80 + i*70 + 10, 50);
            ctx.moveTo(BASE_W/2 - 80 + i*70, 40);
            ctx.lineTo(BASE_W/2 - 80 + i*70 + 20, 40);
            ctx.stroke();
        }
        
        // Porta da casa (para voltar ao interior)
        ctx.fillStyle = '#40342c';
        ctx.fillRect(BASE_W/2 - 15, 60, 30, 40);
        
        // Maçaneta
        ctx.fillStyle = '#c0a080';
        ctx.beginPath();
        ctx.arc(BASE_W/2 + 10, 80, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Árvores no quintal
        for(let i = 0; i < 5; i++) {
            const treeX = 30 + i * 60;
            
            // Tronco
            ctx.fillStyle = '#302010';
            ctx.fillRect(treeX - 4, BASE_H * 0.6 - 60, 8, 60);
            
            // Copa da árvore
            ctx.fillStyle = '#0a2a0a';
            ctx.beginPath();
            ctx.arc(treeX, BASE_H * 0.6 - 60, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(treeX - 10, BASE_H * 0.6 - 70, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(treeX + 10, BASE_H * 0.6 - 75, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Cerca ao redor do quintal
        ctx.fillStyle = '#604030';
        // Cerca superior
        for(let x = 0; x < BASE_W; x += 10) {
            if(x >= BASE_W/2 - 20 && x <= BASE_W/2 + 20) continue; // Espaço para a porta
            ctx.fillRect(x, BASE_H * 0.6 - 10, 4, 20);
        }
        
        // Cercas laterais
        for(let y = BASE_H * 0.6; y < BASE_H; y += 15) {
            ctx.fillRect(0, y, 10, 4);
            ctx.fillRect(BASE_W - 10, y, 10, 4);
        }
        
        // Arbustos
        for(let i = 0; i < 8; i++) {
            const bushX = 20 + i * 40;
            const bushY = BASE_H * 0.6 + 15;
            
            ctx.fillStyle = '#0a2505';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 7 + Math.sin(i) * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bushX - 5, bushY - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(bushX + 5, bushY - 3, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Poça d'água
        ctx.fillStyle = '#102030';
        ctx.beginPath();
        ctx.ellipse(BASE_W/2 + 60, BASE_H * 0.6 + 40, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Reflexo da lua na poça
        ctx.fillStyle = `rgba(255, 255, 204, ${0.3 + Math.sin(t * 0.05) * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(BASE_W/2 + 60, BASE_H * 0.6 + 40, 5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Neblina no chão
        ctx.fillStyle = 'rgba(100, 120, 150, 0.1)';
        for(let i = 0; i < BASE_W; i += 20) {
            const fogHeight = 10 + Math.sin(t * 0.01 + i * 0.1) * 3;
            ctx.fillRect(i, BASE_H - fogHeight, 20, fogHeight);
        }
        
        // Chuva
        ctx.strokeStyle = 'rgba(180, 200, 255, 0.6)';
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.y > BASE_H) {
                p.y = -10;
                p.x = Math.random() * BASE_W;
            }
            
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.vx * 1.5, p.y + p.length);
            ctx.stroke();
            
            // Respingo no chão
            if(p.y > BASE_H - 5) {
                ctx.fillStyle = 'rgba(180, 200, 255, 0.3)';
                ctx.fillRect(p.x - 1, BASE_H - 2, 2, 2);
            }
            ctx.globalAlpha = 1.0;
        });
        
        // Interação - Texto indicando a porta para o interior
        if(jogador.posicao.y < 90 && 
          Math.abs(jogador.posicao.x - BASE_W/2) < 20) {
            ctx.fillStyle = 'white';
            ctx.font = '8px monospace';
            ctx.fillText("Pressione E para entrar", BASE_W/2 - 45, 105);
        }
        
        // Interação - Texto indicando saída para o mundo aberto
        if(jogador.posicao.y > BASE_H - 20) {
            ctx.fillStyle = 'yellow';
            ctx.font = '8px monospace';
            ctx.fillText("Pressione E para explorar o mundo", BASE_W/2 - 70, BASE_H - 5);
        }
    }
    
    // Sistema de mundo aberto procedural
    let mundoOffset = { x: 0, y: 0 };
    let chunkSize = 320; // Tamanho de cada chunk
    let worldSeed = 12345; // Seed para geração procedural
    
    // Função para gerar número pseudo-aleatório baseado em seed
    function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // Desenhar o mundo aberto infinito
    function drawMundoAberto(ctx, t) {
        // Calcular chunk atual baseado na posição do mundo
        const chunkX = Math.floor(mundoOffset.x / chunkSize);
        const chunkY = Math.floor(mundoOffset.y / chunkSize);
        
        // Renderizar 9 chunks (3x3) ao redor do jogador
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                drawChunk(ctx, chunkX + dx, chunkY + dy, t);
            }
        }
        
        // HUD do mundo aberto
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(5, BASE_H - 25, 200, 20);
        ctx.fillStyle = 'white';
        ctx.font = '8px monospace';
        ctx.fillText(`Mundo: X:${Math.floor(mundoOffset.x/10)} Y:${Math.floor(mundoOffset.y/10)}`, 8, BASE_H - 15);
        ctx.fillText(`Chunk: ${chunkX}, ${chunkY}`, 8, BASE_H - 7);
        
        // Indicação para voltar
        if(jogador.posicao.y < 20) {
            ctx.fillStyle = 'yellow';
            ctx.font = '8px monospace';
            ctx.fillText("Pressione E para voltar ao quintal", BASE_W/2 - 70, 15);
        }
    }
    
    // Desenhar um chunk específico do mundo
    function drawChunk(ctx, chunkX, chunkY, t) {
        const baseX = chunkX * chunkSize - mundoOffset.x;
        const baseY = chunkY * chunkSize - mundoOffset.y;
        
        // Se o chunk não está visível, não renderizar
        if(baseX > BASE_W || baseY > BASE_H || baseX + chunkSize < 0 || baseY + chunkSize < 0) {
            return;
        }
        
        // Seed único para este chunk
        const chunkSeed = worldSeed + chunkX * 1000 + chunkY;
        
        // Tipo de bioma baseado na posição
        const biomeType = getBiomeType(chunkX, chunkY);
        
        // Desenhar terreno base
        drawChunkTerrain(ctx, baseX, baseY, chunkSeed, biomeType, t);
        
        // Gerar e desenhar recursos naturais
        drawChunkFeatures(ctx, baseX, baseY, chunkSeed, biomeType, t);
    }
    
    // Determinar tipo de bioma
    function getBiomeType(chunkX, chunkY) {
        const noise1 = seededRandom(chunkX * 73 + chunkY * 37);
        const noise2 = seededRandom(chunkX * 113 + chunkY * 89);
        
        if(noise1 < 0.3) return 'floresta';
        if(noise1 < 0.6) return 'planicie';
        if(noise1 < 0.8) return 'colinas';
        return 'pantano';
    }
    
    // Desenhar terreno do chunk
    function drawChunkTerrain(ctx, baseX, baseY, seed, biome, t) {
        const colors = {
            floresta: '#0a2a0a',
            planicie: '#1a3a1a', 
            colinas: '#2a2a1a',
            pantano: '#1a1a2a'
        };
        
        // Fundo base
        ctx.fillStyle = colors[biome] || '#1a1a1a';
        ctx.fillRect(baseX, baseY, chunkSize, chunkSize);
        
        // Textura procedural
        for(let i = 0; i < 100; i++) {
            const x = baseX + seededRandom(seed + i * 17) * chunkSize;
            const y = baseY + seededRandom(seed + i * 23) * chunkSize;
            
            // Só desenhar se estiver na tela
            if(x >= -10 && x <= BASE_W + 10 && y >= -10 && y <= BASE_H + 10) {
                const size = 1 + seededRandom(seed + i * 31) * 3;
                const alpha = 0.3 + seededRandom(seed + i * 41) * 0.4;
                
                if(biome === 'floresta') {
                    ctx.fillStyle = `rgba(0, ${100 + Math.floor(seededRandom(seed + i) * 50)}, 0, ${alpha})`;
                } else if(biome === 'planicie') {
                    ctx.fillStyle = `rgba(0, ${120 + Math.floor(seededRandom(seed + i) * 60)}, 20, ${alpha})`;
                } else if(biome === 'colinas') {
                    ctx.fillStyle = `rgba(${100 + Math.floor(seededRandom(seed + i) * 50)}, ${100 + Math.floor(seededRandom(seed + i) * 50)}, 0, ${alpha})`;
                } else {
                    ctx.fillStyle = `rgba(50, 50, ${100 + Math.floor(seededRandom(seed + i) * 50)}, ${alpha})`;
                }
                
                ctx.fillRect(x, y, size, size);
            }
        }
    }
    
    // Desenhar características do chunk (árvores, rochas, etc)
    function drawChunkFeatures(ctx, baseX, baseY, seed, biome, t) {
        const featureCount = biome === 'floresta' ? 15 : biome === 'planicie' ? 8 : 12;
        
        for(let i = 0; i < featureCount; i++) {
            const x = baseX + seededRandom(seed + i * 97) * chunkSize;
            const y = baseY + seededRandom(seed + i * 71) * chunkSize;
            
            // Só desenhar se estiver na tela
            if(x >= -30 && x <= BASE_W + 30 && y >= -30 && y <= BASE_H + 30) {
                const featureType = seededRandom(seed + i * 53);
                
                if(biome === 'floresta') {
                    if(featureType < 0.7) {
                        drawTree(ctx, x, y, seed + i);
                    } else {
                        drawBush(ctx, x, y, seed + i);
                    }
                } else if(biome === 'planicie') {
                    if(featureType < 0.5) {
                        drawGrass(ctx, x, y, seed + i);
                    } else if(featureType < 0.8) {
                        drawFlower(ctx, x, y, seed + i);
                    } else {
                        drawRock(ctx, x, y, seed + i);
                    }
                } else if(biome === 'colinas') {
                    if(featureType < 0.6) {
                        drawRock(ctx, x, y, seed + i);
                    } else {
                        drawTree(ctx, x, y, seed + i);
                    }
                } else { // pantano
                    if(featureType < 0.4) {
                        drawSwampTree(ctx, x, y, seed + i);
                    } else if(featureType < 0.7) {
                        drawWater(ctx, x, y, seed + i);
                    } else {
                        drawMushroom(ctx, x, y, seed + i);
                    }
                }
            }
        }
    }
    
    // Funções para desenhar diferentes características
    function drawTree(ctx, x, y, seed) {
        const height = 15 + seededRandom(seed) * 10;
        const width = 3 + seededRandom(seed + 1) * 2;
        
        // Tronco
        ctx.fillStyle = '#4a3225';
        ctx.fillRect(x - width/2, y - height, width, height);
        
        // Copa
        const leafSize = 8 + seededRandom(seed + 2) * 6;
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.arc(x, y - height, leafSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawBush(ctx, x, y, seed) {
        const size = 4 + seededRandom(seed) * 4;
        ctx.fillStyle = '#1a4a1a';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawGrass(ctx, x, y, seed) {
        const height = 2 + seededRandom(seed) * 3;
        ctx.fillStyle = '#2a6a2a';
        ctx.fillRect(x, y - height, 1, height);
    }
    
    function drawFlower(ctx, x, y, seed) {
        const color = seededRandom(seed) < 0.5 ? '#ff6a6a' : '#6a6aff';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawRock(ctx, x, y, seed) {
        const size = 3 + seededRandom(seed) * 4;
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(x - size/2, y - size/2, size, size);
    }
    
    function drawSwampTree(ctx, x, y, seed) {
        const height = 12 + seededRandom(seed) * 8;
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(x - 2, y - height, 4, height);
        
        // Copa murcha
        ctx.fillStyle = '#4a4a2a';
        ctx.beginPath();
        ctx.arc(x, y - height, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawWater(ctx, x, y, seed) {
        const size = 5 + seededRandom(seed) * 8;
        ctx.fillStyle = '#2a2a6a';
        ctx.beginPath();
        ctx.ellipse(x, y, size, size/2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawMushroom(ctx, x, y, seed) {
        // Haste
        ctx.fillStyle = '#dac5a0';
        ctx.fillRect(x - 1, y - 4, 2, 4);
        
        // Chapéu
        const color = seededRandom(seed) < 0.5 ? '#ff4a4a' : '#4a4aff';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pontos brancos
        ctx.fillStyle = 'white';
        ctx.fillRect(x - 1, y - 5, 1, 1);
        ctx.fillRect(x + 1, y - 4, 1, 1);
    }
    
    // Função para criar um inimigo
    function criarInimigo(tipo, x, y) {
        if (!tiposMobs[tipo]) return null;
        
        const mob = tiposMobs[tipo];
        return {
            id: Date.now() + Math.random(),
            tipo: tipo,
            nome: mob.nome,
            posicao: { x: x, y: y },
            vida: mob.vida,
            vidaMaxima: mob.vida,
            dano: mob.dano,
            ultimoDano: 0,      // Momento do último dano recebido
            ultimoAtaque: 0,    // Momento do último ataque ao jogador
            velocidade: mob.velocidade,
            cor: mob.cor,
            tamanho: mob.tamanho,
            alerta: false,
            direcao: Math.random() * Math.PI * 2,
            danoRecebido: 0  // Valor do último dano recebido
        };
    }
    
    // Função para spawnar inimigos aleatórios
    function spawnarInimigos(local = 'casa') {
        // Limpar inimigos existentes
        inimigosAtivos = [];
        
        // Número de inimigos com base no local
        const numInimigos = local === 'casa' ? 2 : 3;
        
        // Spawnar alguns inimigos em posições aleatórias
        for (let i = 0; i < numInimigos; i++) {
            const tipo = Math.random() < 0.5 ? 'sombra' : 'fantasma';
            
            // Posição baseada no local (casa ou quintal)
            let x, y;
            if(local === 'casa') {
                // Para casa, spawnar longe das portas e bordas
                x = 50 + Math.random() * (BASE_W - 100);
                y = 50 + Math.random() * (BASE_H - 100);
            } else {
                // Para quintal, usar toda a área disponível
                x = Math.random() * (BASE_W - 20) + 10;
                y = Math.random() * (BASE_H - 20) + 10;
            }
            
            // Garantir que não spawne muito perto do jogador
            const distX = Math.abs(x - jogador.posicao.x);
            const distY = Math.abs(y - jogador.posicao.y);
            if (distX > 30 || distY > 30) {
                const inimigo = criarInimigo(tipo, x, y);
                if (inimigo) {
                    inimigosAtivos.push(inimigo);
                    console.log(`Inimigo ${tipo} spawnado em (${x}, ${y})`);
                }
            }
        }
        
        console.log(`${inimigosAtivos.length} inimigos spawnados no ${local}`);
    }
    
    // Função para atualizar inimigos
    function atualizarInimigos(delta) {
        for (let i = inimigosAtivos.length - 1; i >= 0; i--) {
            const inimigo = inimigosAtivos[i];
            
            // Calcular distância até o jogador
            const distX = jogador.posicao.x - inimigo.posicao.x;
            const distY = jogador.posicao.y - inimigo.posicao.y;
            const distancia = Math.sqrt(distX * distX + distY * distY);
            
            // Se estiver perto do jogador, perseguir
            if (distancia < 60) {
                // Se acabou de detectar o jogador, tocar um sussurro
                if (!inimigo.alerta) {
                    const mensagensDeteccao = [
                        "Ele te encontrou...",
                        "Corra...",
                        "Não olhe para trás...",
                        "Ele vai te pegar...",
                        "Não há para onde fugir..."
                    ];
                    const mensagemAleatoria = mensagensDeteccao[Math.floor(Math.random() * mensagensDeteccao.length)];
                    
                    // Tocar sussurro com uma chance de 30%
                    if (Math.random() < 0.3) {
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper(mensagemAleatoria);
                        } else {
                            playWhisper(mensagemAleatoria);
                        }
                    }
                }
                
                inimigo.alerta = true;
                
                // Mover em direção ao jogador
                const dirX = distX / distancia;
                const dirY = distY / distancia;
                
                inimigo.posicao.x += dirX * inimigo.velocidade * delta * 30;
                inimigo.posicao.y += dirY * inimigo.velocidade * delta * 30;
                
                // Atacar se estiver muito perto
                if (distancia < 15 && Date.now() - inimigo.ultimoAtaque > 1000) {
                    jogador.vida -= inimigo.dano;
                    jogador.sanidade -= 5;
                    inimigo.ultimoAtaque = Date.now();
                    jogador.ultimoDano = Date.now();
                    playSoundEffect('damage');
                    
                    // Empurrar o jogador para trás
                    jogador.posicao.x -= dirX * 10;
                    jogador.posicao.y -= dirY * 10;
                    
                    console.log(`${inimigo.nome} atacou! Vida: ${jogador.vida}, Sanidade: ${jogador.sanidade}`);
                    
                    // Sussurrar quando o jogador é atacado
                    const mensagensAtaque = [
                        "Dói, não é?",
                        "Seu sangue é tão quente...",
                        "Mais perto da morte a cada momento...",
                        "Renda-se à escuridão...",
                        "Ninguém vai ouvir seus gritos..."
                    ];
                    const mensagemAleatoria = mensagensAtaque[Math.floor(Math.random() * mensagensAtaque.length)];
                    
                    // Usar o sistema de sussurro
                    if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                        window.CutsceneSystem.playWhisper(mensagemAleatoria);
                    } else {
                        playWhisper(mensagemAleatoria);
                    }
                }
            } else {
                // Movimento aleatório
                inimigo.direcao += (Math.random() - 0.5) * 0.1;
                inimigo.posicao.x += Math.cos(inimigo.direcao) * inimigo.velocidade * delta * 10;
                inimigo.posicao.y += Math.sin(inimigo.direcao) * inimigo.velocidade * delta * 10;
            }
            
            // Manter inimigos dentro da tela
            inimigo.posicao.x = Math.max(0, Math.min(BASE_W, inimigo.posicao.x));
            inimigo.posicao.y = Math.max(0, Math.min(BASE_H, inimigo.posicao.y));
            
            // Remover inimigo se morreu
            if (inimigo.vida <= 0) {
                inimigosAtivos.splice(i, 1);
            }
        }
    }
    
    // Função para renderizar inimigos
    function renderizarInimigos(ctx) {
        for (const inimigo of inimigosAtivos) {
            const x = inimigo.posicao.x;
            const y = inimigo.posicao.y;
            const pulsacao = Math.sin(tick * 0.15 + inimigo.id) * 0.3 + 0.7;
            
            // Calcular o estado de saúde do inimigo (para efeitos visuais)
            const vidaPercent = inimigo.vida / inimigo.vidaMaxima;
            
            // Verificar se o inimigo foi atingido recentemente
            const tempoDesdeUltimoDano = Date.now() - (inimigo.ultimoDano || 0);
            const foiAtingido = tempoDesdeUltimoDano < 500;
            
            // Sombra do inimigo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x, y + inimigo.tamanho/2, inimigo.tamanho * 0.6, inimigo.tamanho * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de pulsação quando atingido
            let escala = 1;
            if (foiAtingido) {
                escala = 1 + Math.sin(tempoDesdeUltimoDano * 0.05) * 0.2;
            }
            
            // Salvar o contexto para aplicar transformações
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(escala, escala);
            
            // Corpo do inimigo com efeito de pulsação
            if (inimigo.tipo === 'sombra') {
                // Sombra - formato mais irregular
                // Cor base mais escura quando ferido
                const corBase = foiAtingido ? 'rgba(100, 0, 100, 0.8)' : 'rgba(50, 0, 50, 0.8)';
                ctx.fillStyle = `rgba(${parseInt(corBase.slice(5,8))}, 0, ${parseInt(corBase.slice(5,8))}, ${0.8 * pulsacao})`;
                
                if (foiAtingido) {
                    // Forma distorcida quando atingido
                    ctx.beginPath();
                    for (let i = 0; i < 8; i++) {
                        const angulo = i * Math.PI / 4;
                        const raio = inimigo.tamanho/2 * (0.8 + Math.random() * 0.4);
                        const px = Math.cos(angulo) * raio;
                        const py = Math.sin(angulo) * raio;
                        
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Forma normal
                    ctx.fillRect(-inimigo.tamanho / 2, -inimigo.tamanho / 2, 
                                inimigo.tamanho, inimigo.tamanho);
                }
                
                // Detalhes da sombra
                ctx.fillStyle = `rgba(${parseInt(corBase.slice(5,8))+30}, 0, ${parseInt(corBase.slice(5,8))+30}, ${0.6 * pulsacao})`;
                ctx.fillRect(-inimigo.tamanho / 2 + 1, -inimigo.tamanho / 2 + 1, 
                            inimigo.tamanho - 2, inimigo.tamanho - 2);
                
                // Borda escura
                ctx.strokeStyle = `rgba(20, 0, 20, ${pulsacao})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(-inimigo.tamanho / 2, -inimigo.tamanho / 2, 
                              inimigo.tamanho, inimigo.tamanho);
                
            } else if (inimigo.tipo === 'fantasma') {
                // Fantasma - mais translúcido e brilhante
                // Cor base mais intensa quando ferido
                const intensidade = foiAtingido ? 0.8 : 0.6;
                ctx.fillStyle = `rgba(200, 200, 255, ${intensidade * pulsacao})`;
                
                // Forma mais arredondada para o fantasma
                ctx.beginPath();
                
                if (foiAtingido) {
                    // Forma distorcida quando atingido
                    const distorcao = tempoDesdeUltimoDano / 500; // 0-1
                    for (let i = 0; i < 12; i++) {
                        const angulo = i * Math.PI / 6;
                        const raio = inimigo.tamanho/2 * (0.8 + Math.sin(angulo * 3 + tick * 0.1) * 0.3 * (1-distorcao));
                        const px = Math.cos(angulo) * raio;
                        const py = Math.sin(angulo) * raio;
                        
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.quadraticCurveTo(
                                px - Math.sin(angulo) * raio * 0.5,
                                py + Math.cos(angulo) * raio * 0.5,
                                px, py
                            );
                        }
                    }
                } else {
                    // Forma normal
                    ctx.arc(0, 0, inimigo.tamanho / 2, 0, Math.PI * 2);
                }
                
                ctx.fill();
                
                // Brilho interno
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulsacao})`;
                ctx.beginPath();
                ctx.arc(0, 0, inimigo.tamanho / 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Contorno brilhante
                ctx.strokeStyle = `rgba(150, 150, 255, ${pulsacao})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, inimigo.tamanho / 2, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Olhos brilhantes se estiver em alerta
            if (inimigo.alerta) {
                const brilho = Math.sin(tick * 0.3) * 0.5 + 0.5;
                
                // Olhos mais vermelhos quando foi atingido
                const corOlhos = foiAtingido ? `rgba(255, 100, 100, ${0.8 + brilho * 0.2})` : `rgba(255, 0, 0, ${0.8 + brilho * 0.2})`;
                ctx.fillStyle = corOlhos;
                
                // Olhos maiores e mais intimidadores
                const tamanhoOlhos = foiAtingido ? 1.5 : 1;
                ctx.fillRect(-3, -2, 2 * tamanhoOlhos, 1 * tamanhoOlhos);
                ctx.fillRect(1, -2, 2 * tamanhoOlhos, 1 * tamanhoOlhos);
                
                // Brilho extra nos olhos
                ctx.fillStyle = `rgba(255, 255, 0, ${brilho})`;
                ctx.fillRect(-2, -2, 1, 1);
                ctx.fillRect(2, -2, 1, 1);
                
                // Aura de ameaça
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 * brilho})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(-inimigo.tamanho / 2 - 2, -inimigo.tamanho / 2 - 2, 
                              inimigo.tamanho + 4, inimigo.tamanho + 4);
            } else {
                // Olhos normais
                ctx.fillStyle = inimigo.tipo === 'sombra' ? 'purple' : 'lightblue';
                ctx.fillRect(-2, -2, 1, 1);
                ctx.fillRect(1, -2, 1, 1);
            }
            
            // Exibir dano quando atingido
            if (foiAtingido) {
                // Texto de dano que sobe
                const progress = tempoDesdeUltimoDano / 500; // 0-1
                ctx.fillStyle = 'red';
                ctx.font = '8px Arial';
                ctx.fillText('-' + Math.floor(inimigo.danoRecebido || 10), 
                            0, 
                            -inimigo.tamanho/2 - 5 - progress * 10);
                
                // Adicionar partículas de dano
                if (window.EfeitosVisuais && Math.random() > 0.8) {
                    window.EfeitosVisuais.criarSangue(x, y, 1, 1);
                }
            }
            
            // Restaurar contexto
            ctx.restore();
            
            // Barra de vida para inimigos feridos
            if (vidaPercent < 1) {
                const barraLargura = inimigo.tamanho;
                const barraAltura = 2;
                
                // Fundo da barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(x - barraLargura/2, y - inimigo.tamanho/2 - 5, barraLargura, barraAltura);
                
                // Barra de vida
                ctx.fillStyle = vidaPercent > 0.5 ? 'lime' : vidaPercent > 0.25 ? 'yellow' : 'red';
                ctx.fillRect(x - barraLargura/2, y - inimigo.tamanho/2 - 5, barraLargura * vidaPercent, barraAltura);
            }
        }
    }
    
    // Função para renderizar o jogador
    function renderizarJogador(ctx) {
        const x = jogador.posicao.x;
        const y = jogador.posicao.y;
        const pulsacao = Math.sin(tick * 0.1) * 0.1 + 0.9;
        
        // Atualizar animação
        jogador.animacao.tempoFrame++;
        if(jogador.animacao.tempoFrame > 15) {
            jogador.animacao.tempoFrame = 0;
            if(jogador.animacao.andando) {
                jogador.animacao.frame = (jogador.animacao.frame + 1) % 4;
            } else {
                jogador.animacao.frame = 0;
            }
        }
        
        // Direção de movimento
        const direcao = jogador.animacao.direcao || 'down';
        
        // Atualizar propriedades necessárias para o sistema de animação
        jogador.x = x;
        jogador.y = y;
        jogador.largura = jogador.sprite.width;
        jogador.altura = jogador.sprite.height;
        jogador.direcao = direcao;
        
        // Verificar se o sistema de animações avançadas está disponível
        if (window.CharacterAnimations && typeof window.CharacterAnimations.apply === 'function') {
            // Verificar se estamos atacando
            if (atacando) {
                // Iniciar animação de ataque apropriada
                if (tipoAtaque === 'rapido') {
                    window.CharacterAnimations.play(jogador, 'attackLight', direcao);
                } else if (tipoAtaque === 'medio') {
                    window.CharacterAnimations.play(jogador, 'attackMedium', direcao);
                } else if (tipoAtaque === 'forte') {
                    window.CharacterAnimations.play(jogador, 'attackHeavy', direcao);
                }
                atacando = false;
            } else if (jogador.animacao.andando) {
                // Iniciar animação de caminhada
                window.CharacterAnimations.play(jogador, 'walk', direcao);
            } else if (!window.CharacterAnimations.isPlaying('idle')) {
                // Voltar para animação padrão
                window.CharacterAnimations.play(jogador, 'idle', direcao);
            }
            
            // Atualizar o sistema de animação
            window.CharacterAnimations.update(jogador, 1/60);
        }
        
        // Verificar se o sistema de renderização avançada está disponível
        if (window.RenderizacaoJogador && typeof window.RenderizacaoJogador.renderizar === 'function') {
            // Usar renderização avançada
            window.RenderizacaoJogador.renderizar(ctx, jogador);
        } else {
            // Fallback para renderização básica
            
            // Sombra do personagem (melhorada, oval)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x, y + 8, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        
            // Obter offsets da animação
            const frameOffset = Math.sin(jogador.animacao.frame * Math.PI / 2) * 0.5;
            const bobbing = jogador.animacao.andando ? Math.sin(jogador.animacao.frame * Math.PI) * 0.7 : 0;
            
            // Cores base do personagem
            const corPele = '#FFD1B7'; // Cor da pele mais realista
            const corRoupa = jogador.vida > 50 ? 
                `rgb(${30 + pulsacao * 20}, ${100 + pulsacao * 30}, ${190 + pulsacao * 35})` : 
                `rgb(${150 + pulsacao * 30}, ${40 + pulsacao * 20}, ${40 + pulsacao * 20})` ;
            const corCabelo = '#8B4513'; // Marrom
            
            // Offsets de braços e pernas
            const bracoOffset = jogador.animacao.andando ? 
                Math.sin(jogador.animacao.frame * Math.PI / 2) * 1.5 : 0;
            const pernaOffset = jogador.animacao.andando ? 
                Math.sin(jogador.animacao.frame * Math.PI / 2) * 2 : 0;
        
        // Pernas (por baixo de tudo)
        // Perna esquerda
        ctx.fillStyle = '#333333'; // Calça escura
        ctx.fillRect(x - 3, y + 3 + bobbing + pernaOffset, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(x - 3, y + 5 + bobbing + pernaOffset, 3, 1);
        
        // Perna direita
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y + 3 + bobbing - pernaOffset, 3, 6);
        // Detalhe da perna
        ctx.fillStyle = '#222222';
        ctx.fillRect(x, y + 5 + bobbing - pernaOffset, 3, 1);
        
        // Sapatos
        ctx.fillStyle = '#111111'; // Sapatos pretos
        ctx.fillRect(x - 3, y + 8 + bobbing + pernaOffset, 3, 1);
        ctx.fillRect(x, y + 8 + bobbing - pernaOffset, 3, 1);
        
        // Corpo (tronco)
        ctx.fillStyle = corRoupa;
        // Corpo principal
        ctx.fillRect(x - 3, y - 2 + bobbing, 6, 6);
        
        // Detalhes da roupa (botões ou zíper)
        ctx.fillStyle = direcao === 'back' ? corRoupa : '#FFFFFF';
        ctx.fillRect(x, y, 1, 3);
        
        // Cinto
        ctx.fillStyle = '#5E2C04';
        ctx.fillRect(x - 3, y + 3 + bobbing, 6, 1);
        
        // Braços
        // Braço esquerdo
        ctx.save();
        ctx.translate(x - 3, y + bobbing);
        
        // Rotação do braço baseada na direção e no movimento
        let rotacao = 0;
        if (direcao === 'left' || direcao === 'right') {
            rotacao = direcao === 'right' ? Math.PI/6 : -Math.PI/6;
            rotacao += bracoOffset * 0.5;
        } else {
            rotacao = bracoOffset * 0.4;
        }
        
        ctx.rotate(rotacao);
        ctx.fillStyle = corRoupa;
        ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
        ctx.fillStyle = corPele;
        ctx.fillRect(-1, 4, 2, 2); // Mão
            ctx.restore();
            
            // Braço direito
            ctx.save();
            ctx.translate(x + 3, y + bobbing);
            
            // Rotação oposta para o outro braço
            if (direcao === 'left' || direcao === 'right') {
                rotacao = direcao === 'right' ? -Math.PI/6 : Math.PI/6;
                rotacao -= bracoOffset * 0.5;
            } else {
                rotacao = -bracoOffset * 0.4;
            }
            
            ctx.rotate(rotacao);
            ctx.fillStyle = corRoupa;
            ctx.fillRect(-1, 0, 2, 5); // Manga da camisa
            ctx.fillStyle = corPele;
            ctx.fillRect(-1, 4, 2, 2); // Mão
            ctx.restore();
            
            // Cabeça e rosto
            ctx.fillStyle = corPele;
            ctx.fillRect(x - 3, y - 8 + bobbing, 6, 7); // Cabeça um pouco maior e mais oval
            
            // Cabelo baseado na direção
            ctx.fillStyle = corCabelo;
            if (direcao === 'back' || direcao === 'up') {
                // Parte de trás do cabelo (visível de costas)
                ctx.fillRect(x - 3, y - 8 + bobbing, 6, 2);
                ctx.fillRect(x - 4, y - 6 + bobbing, 8, 2);
            } else {
                // Frente e lados
                ctx.fillRect(x - 3, y - 9 + bobbing, 6, 2); // Franja
                ctx.fillRect(x - 4, y - 7 + bobbing, 1, 4); // Lado esquerdo
                ctx.fillRect(x + 3, y - 7 + bobbing, 1, 4); // Lado direito
            }
            
            // Detalhes do rosto baseados na direção
            if (direcao !== 'back' && direcao !== 'up') {
                // Olhos (com expressão baseada na vida/sanidade)
                const expressaoOlhos = jogador.vida < 30 ? 'x' : 
                                jogador.sanidade < 30 ? 'o' : 
                                '.';                                
                
                // Cor dos olhos
                const corOlhos = jogador.vida > 30 ? '#0066ff' : '#ff0000';
                
                if (expressaoOlhos === '.') {
                    // Olhos normais
                    if (direcao === 'left') {
                        // Olhando para a esquerda
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - 3, y - 5 + bobbing, 2, 2);
                        ctx.fillStyle = corOlhos;
                        ctx.fillRect(x - 3, y - 5 + bobbing, 1, 1);
                    } else if (direcao === 'right') {
                        // Olhando para a direita
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x + 1, y - 5 + bobbing, 2, 2);
                        ctx.fillStyle = corOlhos;
                        ctx.fillRect(x + 2, y - 5 + bobbing, 1, 1);
                    } else {
                        // Olhando para frente
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - 2, y - 5 + bobbing, 2, 2);
                        ctx.fillRect(x, y - 5 + bobbing, 2, 2);
                        
                        ctx.fillStyle = corOlhos;
                        ctx.fillRect(x - 1, y - 5 + bobbing, 1, 1);
                        ctx.fillRect(x + 1, y - 5 + bobbing, 1, 1);
                    }
                } else if (expressaoOlhos === 'x') {
                    // Olhos de dor (X)
                    ctx.strokeStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo(x - 2, y - 6 + bobbing);
                    ctx.lineTo(x - 1, y - 5 + bobbing);
                    ctx.moveTo(x - 1, y - 6 + bobbing);
                    ctx.lineTo(x - 2, y - 5 + bobbing);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(x + 1, y - 6 + bobbing);
                    ctx.lineTo(x + 2, y - 5 + bobbing);
                    ctx.moveTo(x + 2, y - 6 + bobbing);
                    ctx.lineTo(x + 1, y - 5 + bobbing);
                    ctx.stroke();
                } else {
                    // Olhos arregalados de medo/loucura
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x - 2, y - 5 + bobbing, 2, 2);
                    ctx.fillRect(x, y - 5 + bobbing, 2, 2);
                    
                    ctx.fillStyle = '#ff00ff';
                    ctx.beginPath();
                    ctx.arc(x - 1, y - 4 + bobbing, 1, 0, Math.PI * 2);
                    ctx.arc(x + 1, y - 4 + bobbing, 1, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Pequenas linhas erráticas ao redor dos olhos
                    ctx.strokeStyle = '#800080';
                    ctx.beginPath();
                    ctx.moveTo(x - 3, y - 6 + bobbing);
                    ctx.lineTo(x - 2, y - 5 + bobbing);
                    ctx.moveTo(x + 3, y - 6 + bobbing);
                    ctx.lineTo(x + 2, y - 5 + bobbing);
                    ctx.stroke();
                }
                
                // Boca (expressão baseada na vida/sanidade)
                if (jogador.vida < 30) {
                    // Expressão de dor
                    ctx.fillStyle = '#ff3333';
                    ctx.fillRect(x - 1, y - 2 + bobbing, 2, 1);
                } else if (jogador.sanidade < 30) {
                    // Expressão de medo/loucura
                    ctx.strokeStyle = '#333333';
                    ctx.beginPath();
                    ctx.arc(x, y - 2 + bobbing, 1, 0, Math.PI, false);
                    ctx.stroke();
                } else {
                    // Expressão neutra
                    ctx.fillStyle = '#cc6666';
                    ctx.fillRect(x - 1, y - 2 + bobbing, 2, 1);
                }
            }
            
            // Equipamento/armadura (detalhes)
            if (ambiente === 'quintal') {
                // Pequena mochila nas costas para o ambiente externo
                ctx.fillStyle = '#553300';
                if (direcao === 'up' || direcao === 'back') {
                    // Visível de costas
                    ctx.fillRect(x - 2, y + bobbing, 4, 3);
                } else {
                    // Alças visíveis de frente/lado
                    ctx.fillRect(x - 3, y - 2 + bobbing, 1, 3);
                    ctx.fillRect(x + 2, y - 2 + bobbing, 1, 3);
                }
            }
            
            // Efeitos especiais
            // Efeito de aura quando a vida está baixa
            if (jogador.vida < 30) {
                const auraSize = 3 + Math.sin(tick * 0.3) * 1;
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.6 + pulsacao * 0.4})`;
                ctx.lineWidth = 1.5;
                
                // Aura pulsante
                ctx.beginPath();
                ctx.arc(x, y, 12 + auraSize, 0, Math.PI * 2);
                ctx.stroke();
                
                // Traços de sangue
                ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillRect(x - 2, y + 7 + bobbing, 1, 1);
                ctx.fillRect(x + 1, y + 6 + bobbing, 1, 2);
            }
            
            // Efeito mágico quando sanidade baixa
            if (jogador.sanidade < 30) {
                // Partículas mágicas mais estilizadas
                for (let i = 0; i < 12; i++) {
                    const angle = (tick * 0.05 + i * Math.PI / 6) % (Math.PI * 2);
                    const radius = 12 + Math.sin(tick * 0.1 + i) * 4;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    
                    const tamanhoParticula = 1 + Math.random();
                    
                    ctx.fillStyle = `rgba(255, 0, 255, ${0.7 + Math.sin(tick * 0.2 + i) * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(px, py, tamanhoParticula/2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Distorção visual mais sutil
                ctx.fillStyle = `rgba(255, 0, 255, ${0.1 * Math.sin(tick * 0.2)})`;
                ctx.fillRect(0, 0, BASE_W, BASE_H);
                
                // Efeito de vinheta que pulsa com a insanidade
                const gradientVinheta = ctx.createRadialGradient(x, y, 20, x, y, 80);
                gradientVinheta.addColorStop(0, 'rgba(0,0,0,0)');
                gradientVinheta.addColorStop(0.7, `rgba(100,0,100,${0.1 + Math.sin(tick * 0.05) * 0.05})`);
                gradientVinheta.addColorStop(1, `rgba(100,0,100,${0.2 + Math.sin(tick * 0.05) * 0.1})`);
                ctx.fillStyle = gradientVinheta;
                ctx.fillRect(0, 0, BASE_W, BASE_H);
            }
        }
        
        // Aplicar efeitos visuais se disponíveis
        if (window.EfeitosVisuais) {
            // Adicionar efeitos baseados no estado do jogador
            if (jogador.vida < 30 && Math.random() > 0.9) {
                window.EfeitosVisuais.criarSangue(x, y, 2, 1);
            }
            
            if (jogador.sanidade < 30 && Math.random() > 0.95) {
                window.EfeitosVisuais.criarFlash('rgba(255, 0, 255, 0.1)', 200, 0.1);
            }
        }
        
        // Pegadas mais realistas quando anda
        if (jogador.animacao.andando && tick % 15 === 0) {
            ctx.fillStyle = 'rgba(60, 60, 60, 0.2)';
            if (direcao === 'left' || direcao === 'right') {
                // Pegadas laterais
                ctx.fillRect(x + (direcao === 'left' ? 5 : -5), y + 9, 2, 1);
            } else {
                // Pegadas para cima/baixo
                ctx.fillRect(x - 2, y + (direcao === 'up' ? 5 : -5) + 9, 2, 1);
                ctx.fillRect(x + 1, y + (direcao === 'up' ? 6 : -6) + 9, 2, 1);
            }
        }
        
        // Efeito de lanterna no escuro (ambiente interno)
        if (ambiente === 'casa') {
            const gradientLuz = ctx.createRadialGradient(x, y, 5, x, y, 30);
            gradientLuz.addColorStop(0, 'rgba(255, 255, 150, 0.1)');
            gradientLuz.addColorStop(1, 'rgba(255, 255, 150, 0)');
            ctx.fillStyle = gradientLuz;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Função para renderizar a UI do jogo
    function renderizarUI(ctx) {
        const pulsacao = Math.sin(tick * 0.1) * 0.1 + 0.9;
        
        // === PAINEL DE STATUS PRINCIPAL ===
        // Fundo do painel com gradiente moderno
        const gradient = ctx.createLinearGradient(2, 2, 2, 55);
        gradient.addColorStop(0, 'rgba(30, 15, 35, 0.95)');
        gradient.addColorStop(0.5, 'rgba(15, 10, 25, 0.9)');
        gradient.addColorStop(1, 'rgba(20, 15, 30, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(2, 2, 180, 55);
        
        // Borda externa do painel
        ctx.strokeStyle = `rgba(150, 100, 200, ${0.6 + pulsacao * 0.2})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 180, 55);
        
        // Borda interna (efeito de profundidade)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(3, 3, 178, 53);
        
        // === BARRA DE VIDA APRIMORADA ===
        // Fundo da barra com bordas arredondadas simuladas
        ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
        ctx.fillRect(6, 8, 112, 16);
        
        // Borda da barra de vida
        ctx.strokeStyle = 'rgba(80, 80, 120, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 8, 112, 16);
        
        // Gradiente da vida baseado na porcentagem
        const vidaPct = jogador.vida / jogador.vidaMaxima;
        const barraVidaGradient = ctx.createLinearGradient(7, 9, 7, 23);
        
        if (vidaPct > 0.6) {
            barraVidaGradient.addColorStop(0, `rgba(${80 * pulsacao}, ${255 * pulsacao}, ${80 * pulsacao}, 0.9)`);
            barraVidaGradient.addColorStop(1, `rgba(${40 * pulsacao}, ${200 * pulsacao}, ${40 * pulsacao}, 0.9)`);
        } else if (vidaPct > 0.3) {
            barraVidaGradient.addColorStop(0, `rgba(${255 * pulsacao}, ${255 * pulsacao}, ${80 * pulsacao}, 0.9)`);
            barraVidaGradient.addColorStop(1, `rgba(${220 * pulsacao}, ${200 * pulsacao}, ${40 * pulsacao}, 0.9)`);
        } else {
            barraVidaGradient.addColorStop(0, `rgba(${255 * pulsacao}, ${80 * pulsacao}, ${80 * pulsacao}, 0.9)`);
            barraVidaGradient.addColorStop(1, `rgba(${200 * pulsacao}, ${40 * pulsacao}, ${40 * pulsacao}, 0.9)`);
        }
        
        ctx.fillStyle = barraVidaGradient;
        ctx.fillRect(7, 9, vidaPct * 110, 14);
        
        // Brilho no topo da barra de vida
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(7, 9, vidaPct * 110, 2);
        
        // Texto da vida com sombra aprimorada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`VIDA: ${jogador.vida}/${jogador.vidaMaxima}`, 9, 18);
        ctx.fillStyle = vidaPct > 0.3 ? '#ffffff' : '#ffaaaa';
        ctx.fillText(`VIDA: ${jogador.vida}/${jogador.vidaMaxima}`, 8, 17);
        
        // === BARRA DE SANIDADE APRIMORADA ===
        // Fundo da barra
        ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
        ctx.fillRect(6, 28, 112, 16);
        
        // Borda da barra de sanidade
        ctx.strokeStyle = 'rgba(80, 120, 180, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, 28, 112, 16);
        
        // Gradiente da sanidade
        const sanidadePct = jogador.sanidade / jogador.sanidadeMaxima;
        const barraSanidadeGradient = ctx.createLinearGradient(7, 29, 7, 43);
        
        if (sanidadePct > 0.6) {
            barraSanidadeGradient.addColorStop(0, `rgba(${80 * pulsacao}, ${200 * pulsacao}, ${255 * pulsacao}, 0.9)`);
            barraSanidadeGradient.addColorStop(1, `rgba(${40 * pulsacao}, ${150 * pulsacao}, ${220 * pulsacao}, 0.9)`);
        } else if (sanidadePct > 0.3) {
            barraSanidadeGradient.addColorStop(0, `rgba(${255 * pulsacao}, ${200 * pulsacao}, ${150 * pulsacao}, 0.9)`);
            barraSanidadeGradient.addColorStop(1, `rgba(${220 * pulsacao}, ${160 * pulsacao}, ${100 * pulsacao}, 0.9)`);
        } else {
            barraSanidadeGradient.addColorStop(0, `rgba(${255 * pulsacao}, ${100 * pulsacao}, ${255 * pulsacao}, 0.9)`);
            barraSanidadeGradient.addColorStop(1, `rgba(${200 * pulsacao}, ${50 * pulsacao}, ${200 * pulsacao}, 0.9)`);
        }
        
        ctx.fillStyle = barraSanidadeGradient;
        ctx.fillRect(7, 29, sanidadePct * 110, 14);
        
        // Brilho no topo da barra de sanidade
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(7, 29, sanidadePct * 110, 2);
        
        // Texto da sanidade com sombra aprimorada
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(`SANIDADE: ${jogador.sanidade}/${jogador.sanidadeMaxima}`, 9, 38);
        ctx.fillStyle = sanidadePct > 0.3 ? '#aaeeff' : '#ffaaff';
        ctx.fillText(`SANIDADE: ${jogador.sanidade}/${jogador.sanidadeMaxima}`, 8, 37);
        
        // === CONTADOR DE INIMIGOS ESTILIZADO ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(`INIMIGOS: ${inimigosAtivos.length}`, 9, 52);
        const corInimigos = inimigosAtivos.length > 0 ? '#ff6666' : '#66ff66';
        ctx.fillStyle = corInimigos;
        ctx.fillText(`INIMIGOS: ${inimigosAtivos.length}`, 8, 51);
        
        // === INDICADOR DE TIPO DE ATAQUE ===
        ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
        ctx.fillRect(BASE_W - 85, 5, 80, 25);
        ctx.strokeStyle = 'rgba(200, 150, 100, 0.7)';
        ctx.strokeRect(BASE_W - 85, 5, 80, 25);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`ATAQUE: ${tipoAtaque.toUpperCase()}`, BASE_W - 82, 16);
        
        let corAtaque = '#ffffff';
        if (tipoAtaque === 'rapido') corAtaque = '#aaffaa';
        else if (tipoAtaque === 'medio') corAtaque = '#ffaa66';
        else if (tipoAtaque === 'forte') corAtaque = '#ff6666';
        
        ctx.fillStyle = corAtaque;
        ctx.fillText(`ATAQUE: ${tipoAtaque.toUpperCase()}`, BASE_W - 83, 15);
        
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.font = '7px monospace';
        ctx.fillText('1-2-3 para trocar', BASE_W - 82, 25);
        
        // === INDICADORES DE ALERTA APRIMORADOS ===
        if (jogador.vida < 30) {
            const alerta = Math.sin(tick * 0.3) * 0.5 + 0.5;
            const intensidade = 0.4 * alerta;
            
            // Bordas pulsantes vermelhas
            ctx.fillStyle = `rgba(255, 50, 50, ${intensidade})`;
            ctx.fillRect(0, 0, BASE_W, 4);
            ctx.fillRect(0, BASE_H - 4, BASE_W, 4);
            ctx.fillRect(0, 0, 4, BASE_H);
            ctx.fillRect(BASE_W - 4, 0, 4, BASE_H);
            
            // Efeito de vinheta vermelha
            const alertGradient = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 50, BASE_W/2, BASE_H/2, 150);
            alertGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            alertGradient.addColorStop(0.7, `rgba(255, 0, 0, ${intensidade * 0.1})`);
            alertGradient.addColorStop(1, `rgba(255, 0, 0, ${intensidade * 0.3})`);
            ctx.fillStyle = alertGradient;
            ctx.fillRect(0, 0, BASE_W, BASE_H);
        }
        
        if (jogador.sanidade < 30) {
            const alerta = Math.sin(tick * 0.4) * 0.5 + 0.5;
            const intensidade = 0.3 * alerta;
            
            // Efeito de distorção nas bordas
            ctx.fillStyle = `rgba(255, 0, 255, ${intensidade})`;
            for (let i = 0; i < 8; i++) {
                const offset = Math.random() * 6 - 3;
                ctx.fillRect(i * 3 + offset, 0, 2, BASE_H);
                ctx.fillRect(BASE_W - i * 3 + offset, 0, 2, BASE_H);
            }
            
            // Efeito de vinheta roxa
            const sanityGradient = ctx.createRadialGradient(BASE_W/2, BASE_H/2, 40, BASE_W/2, BASE_H/2, 120);
            sanityGradient.addColorStop(0, 'rgba(255, 0, 255, 0)');
            sanityGradient.addColorStop(0.6, `rgba(200, 0, 200, ${intensidade * 0.1})`);
            sanityGradient.addColorStop(1, `rgba(150, 0, 150, ${intensidade * 0.25})`);
            ctx.fillStyle = sanityGradient;
            ctx.fillRect(0, 0, BASE_W, BASE_H);
        }
        
        // === MINI-MAPA APRIMORADO ===
        const miniMapSize = 50;
        const miniMapX = BASE_W - miniMapSize - 8;
        const miniMapY = 8;
        
        // Fundo do mini-mapa com gradiente
        const miniMapGradient = ctx.createLinearGradient(miniMapX, miniMapY, miniMapX, miniMapY + miniMapSize);
        miniMapGradient.addColorStop(0, 'rgba(10, 20, 30, 0.9)');
        miniMapGradient.addColorStop(1, 'rgba(20, 10, 40, 0.9)');
        ctx.fillStyle = miniMapGradient;
        ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Borda do mini-mapa
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Borda interna
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(miniMapX + 1, miniMapY + 1, miniMapSize - 2, miniMapSize - 2);
        
        // Jogador no mini-mapa (com brilho)
        const playerMapX = miniMapX + (jogador.posicao.x / BASE_W) * miniMapSize;
        const playerMapY = miniMapY + (jogador.posicao.y / BASE_H) * miniMapSize;
        
        // Brilho do jogador
        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Jogador
        ctx.fillStyle = '#66aaff';
        ctx.fillRect(playerMapX - 1, playerMapY - 1, 3, 3);
        
        // Inimigos no mini-mapa (com efeitos)
        for (const inimigo of inimigosAtivos) {
            const inimigoMapX = miniMapX + (inimigo.posicao.x / BASE_W) * miniMapSize;
            const inimigoMapY = miniMapY + (inimigo.posicao.y / BASE_H) * miniMapSize;
            
            if (inimigo.alerta) {
                // Brilho para inimigos em alerta
                ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
                ctx.beginPath();
                ctx.arc(inimigoMapX, inimigoMapY, 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ff4444';
            } else {
                ctx.fillStyle = '#ff8844';
            }
            
            ctx.fillRect(inimigoMapX, inimigoMapY, 2, 2);
        }
        
        // Título do mini-mapa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '7px monospace';
        ctx.fillText('MAPA', miniMapX + 1, miniMapY - 2);
        ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        ctx.fillText('MAPA', miniMapX, miniMapY - 3);
        
        // === DICA DE SALVAMENTO ===
        // Mostra dica quando está perto do baú na casa
        if (ambiente === 'casa') {
            const distanciaX = Math.abs(jogador.posicao.x - 480);
            const distanciaY = Math.abs(jogador.posicao.y - 320);
            
            if (distanciaX < 40 && distanciaY < 40) {
                const pulsacaoSave = Math.sin(tick * 0.15) * 0.3 + 0.7;
                
                // Fundo da dica
                ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
                ctx.fillRect(BASE_W/2 - 60, BASE_H - 40, 120, 25);
                
                // Borda da dica
                ctx.strokeStyle = `rgba(255, 215, 0, ${pulsacaoSave})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(BASE_W/2 - 60, BASE_H - 40, 120, 25);
                
                // Texto da dica
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Pressione S para salvar', BASE_W/2 + 1, BASE_H - 22);
                
                ctx.fillStyle = `rgba(255, 215, 0, ${pulsacaoSave})`;
                ctx.fillText('Pressione S para salvar', BASE_W/2, BASE_H - 23);
                
                // Restaura alinhamento
                ctx.textAlign = 'left';
            }
        }
    }
    
    // Função principal de renderização
    function render(t) {
        bctx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Desenhar fundo
        drawAnimatedBackground(bctx, t);
        
        // Vinheta escura
        for(let i = 0; i < 8; i++) {
            bctx.fillStyle = `rgba(0,0,0,${0.06 + i * 0.02})`;
            bctx.fillRect(i * 2, i * 2, BASE_W - i * 4, BASE_H - i * 4);
        }
        
        if (gameState === 'menu') {
            // Título
            bctx.font = 'bold 28px "Courier New", monospace';
            const title = 'PESADELO';
            const tx = (BASE_W - bctx.measureText(title).width) / 2;
            
            // Sombra do título
            bctx.fillStyle = '#200505';
            bctx.fillText(title, tx + 1, 36 + 1);
            
            // Título principal
            const shift = Math.sin(t * 0.003) * 12;
            bctx.fillStyle = `rgb(${180 + shift | 0},${20 + Math.abs(Math.sin(t * 0.005) * 20) | 0},${20})`;
            bctx.fillText(title, tx, 36);
            
            // Subtítulo
            const pulse = 1 + 0.03 * (1 + Math.sin(t * 0.012));
            const jitterX = Math.random() * 2 - 1;
            const jitterY = Math.random() * 1.5 - 0.75;
            
            bctx.save();
            bctx.translate(BASE_W / 2 + jitterX, 56 + Math.sin(t * 0.006) * 2 + jitterY);
            bctx.scale(pulse, pulse);
            bctx.fillStyle = '#a09999';
            bctx.font = '14px "Courier New", monospace';
            const s = 'Entre por sua conta e risco';
            bctx.fillText(s, -bctx.measureText(s).width / 2, 0);
            bctx.restore();
            
            // Menu
            bctx.font = '16px "Courier New", monospace';
            let startY = 96;
            const temSave = localStorage.getItem('pesadeloPixeladoSave') !== null;
            
            MENU_OPTIONS.forEach((opt, i) => {
                const tremor = i === selected ? Math.random() * 2 - 1 : 0;
                const txtW = bctx.measureText(opt).width;
                const x = (BASE_W - txtW) / 2 + tremor;
                const y = startY + i * 22;
                const isSel = (i === selected);
                
                // Verifica se a opção "Continuar" está disponível
                const isDisabled = (opt === "Continuar" && !temSave);
                
                // Destaque da seleção
                if (isSel && !isDisabled) {
                    const glow = (1 + Math.sin(t * 0.008)) * 0.5;
                    const w = txtW + 12, h = 18;
                    bctx.fillStyle = `rgba(80,20,20,${0.4 + glow * 0.2})`;
                    bctx.fillRect(x - w / 2, y - h / 2, w, h);
                    
                    bctx.strokeStyle = `rgba(180,30,30,${0.5 + glow * 0.3})`;
                    bctx.strokeRect(x - w / 2, y - h / 2, w, h);
                }
                
                // Texto
                if (isDisabled) {
                    // Opção desabilitada (sem save)
                    bctx.fillStyle = '#444444';
                    bctx.fillText(opt, x, y);
                    
                    // Adiciona indicação de "sem save"
                    if (opt === "Continuar") {
                        bctx.font = '10px "Courier New", monospace';
                        bctx.fillStyle = '#666666';
                        const infoText = "(sem save)";
                        const infoX = x + txtW + 8;
                        bctx.fillText(infoText, infoX, y);
                        bctx.font = '16px "Courier New", monospace';
                    }
                } else if (isSel) {
                    bctx.fillStyle = '#ffffff';
                    bctx.fillText(opt, x, y);
                    
                    // Adiciona indicação de save disponível
                    if (opt === "Continuar" && temSave) {
                        bctx.font = '10px "Courier New", monospace';
                        bctx.fillStyle = '#88ff88';
                        const infoText = "(save encontrado)";
                        const infoX = x + txtW + 8;
                        bctx.fillText(infoText, infoX, y);
                        bctx.font = '16px "Courier New", monospace';
                    }
                } else {
                    bctx.fillStyle = '#a08585';
                    bctx.fillText(opt, x, y);
                    
                    // Adiciona indicação sutil de save disponível
                    if (opt === "Continuar" && temSave) {
                        bctx.font = '10px "Courier New", monospace';
                        bctx.fillStyle = '#558855';
                        const infoText = "(save encontrado)";
                        const infoX = x + txtW + 8;
                        bctx.fillText(infoText, infoX, y);
                        bctx.font = '16px "Courier New", monospace';
                    }
                }
            });
        } else {
            // Renderizar outros estados do jogo
            if (gameState === 'game') {
                // Inicializar o jogo se necessário
                if (!jogoInicializado) {
                    spawnarInimigos(ambiente);
                    jogoInicializado = true;
                    console.log("Jogo inicializado com personagens no ambiente: " + ambiente);
                }
                
                // Atualizar gameplay
                const delta = 1/60; // Assumir 60 FPS
                atualizarInimigos(delta);
                
                // Renderizar elementos do jogo
                renderizarInimigos(bctx);
                renderizarJogador(bctx);
                
                // Renderizar sistema de lanterna (entre a renderização do jogo e a UI)
                if (window.LanternaSystem && typeof window.LanternaSystem.render === 'function') {
                    // Calcular posição da câmera
                    const cameraX = jogador.posicao.x - BASE_W / 2;
                    const cameraY = jogador.posicao.y - BASE_H / 2;
                    
                    // Atualizar a direção do jogador no sistema de lanterna
                    if (typeof window.LanternaSystem.setDirecao === 'function') {
                        window.LanternaSystem.setDirecao(jogador.direcao || 'down');
                    }
                    
                    window.LanternaSystem.render(bctx, cameraX, cameraY);
                    
                    // Renderizar UI de diagnóstico da lanterna se estiver disponível
                    if (window.LanternaDiagnostico && typeof window.LanternaDiagnostico.renderUI === 'function') {
                        window.LanternaDiagnostico.renderUI(bctx);
                    }
                }
                
                // Renderizar sistema de iluminação adaptativa
                if (window.LightingSystem && typeof window.LightingSystem.render === 'function') {
                    // Calcular posição da câmera
                    const cameraX = jogador.posicao.x - BASE_W / 2;
                    const cameraY = jogador.posicao.y - BASE_H / 2;
                    
                    window.LightingSystem.render(bctx, cameraX, cameraY);
                }
                
                renderizarUI(bctx);
                
                // Mensagem de instrução
                bctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                bctx.fillRect(0, BASE_H - 30, BASE_W, 30);
                bctx.fillStyle = '#ffffff';
                bctx.font = '10px monospace';
                bctx.fillText("Use WASD para mover, ESPAÇO para atacar, F para lanterna, E para mudar de ambiente, ESC para menu", 5, BASE_H - 10);
                
                // Indicador de ambiente atual
                bctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                bctx.fillRect(0, 0, BASE_W, 20);
                bctx.fillStyle = '#ffffff';
                bctx.font = '10px monospace';
                bctx.fillText(`Ambiente atual: ${ambiente === 'casa' ? 'Casa (interior)' : 'Quintal (exterior)'}`, 5, 12);
                
                // Verificar condições de game over
                if (jogador.vida <= 0) {
                    bctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    bctx.fillRect(0, 0, BASE_W, BASE_H);
                    bctx.fillStyle = 'white';
                    bctx.font = '16px monospace';
                    bctx.fillText("VOCÊ MORREU", BASE_W/2 - 50, BASE_H/2);
                    bctx.font = '10px monospace';
                    bctx.fillText("Pressione ESC para voltar ao menu", BASE_W/2 - 80, BASE_H/2 + 20);
                } else if (jogador.sanidade <= 0) {
                    bctx.fillStyle = 'rgba(128, 0, 128, 0.8)';
                    bctx.fillRect(0, 0, BASE_W, BASE_H);
                    bctx.fillStyle = 'white';
                    bctx.font = '16px monospace';
                    bctx.fillText("ENLOUQUECEU", BASE_W/2 - 50, BASE_H/2);
                    bctx.font = '10px monospace';
                    bctx.fillText("Pressione ESC para voltar ao menu", BASE_W/2 - 80, BASE_H/2 + 20);
                }
            } else {
                // Outros estados (options, credits, quit)
                bctx.fillStyle = '#d0d0d0';
                bctx.font = '16px "Courier New", monospace';
                
                // Desenhar o texto do estado atual
                const lines = stateMessages[gameState].split('\n');
                
                // Verificar se estamos renderizando uma nova mensagem para tocar o sussurro
                if (!window.lastRenderedState || window.lastRenderedState !== gameState) {
                    // Inicializar áudio se necessário
                    initializeAudioOnFirstInteraction();
                    
                    // Tocar som de sussurro para o texto atual
                    if (audioContext && gameState === 'game') {
                        // Usar apenas as primeiras linhas para o sussurro (são as mais importantes)
                        const whisperText = lines.slice(0, 3).join(" ");
                        playWhisper(whisperText);
                    }
                    
                    // Armazenar o último estado renderizado
                    window.lastRenderedState = gameState;
                }
                
                // Adicionar efeito para cada linha do texto
                lines.forEach((line, i) => {
                    const txtW = bctx.measureText(line).width;
                    const x = (BASE_W - txtW) / 2;
                    const y = 50 + i * 20;
                    
                    // Efeito de tremor sutil para texto
                    const tremor = Math.random() * 1.5 - 0.75;
                    
                    // Adicionar sombra para um efeito mais assustador
                    bctx.shadowColor = 'rgba(255, 0, 0, 0.3)';
                    bctx.shadowBlur = 4;
                    bctx.shadowOffsetX = 1;
                    bctx.shadowOffsetY = 1;
                    
                    // Desenhar o texto
                    bctx.fillText(line, x + tremor, y);
                    
                    // Resetar sombras
                    bctx.shadowColor = 'transparent';
                    bctx.shadowBlur = 0;
                    bctx.shadowOffsetX = 0;
                    bctx.shadowOffsetY = 0;
                });
                
                // Mensagem para voltar
                if (gameState !== 'quit') {
                    bctx.fillStyle = '#8a8a8a';
                    const hint = "Pressione ESC para voltar";
                    const hintW = bctx.measureText(hint).width;
                    bctx.fillText(hint, (BASE_W - hintW) / 2, BASE_H - 30);
                }
            }
        }
        
        // Versão
        bctx.font = '10px "Courier New", monospace';
        bctx.fillStyle = '#5a899a';
        bctx.fillText(GAME_VERSION, BASE_W - 60, BASE_H - 6);
        
        // Scanlines
        bctx.globalAlpha = 0.06;
        bctx.fillStyle = '#000';
        for(let yy = 0; yy < BASE_H; yy += 2) {
            bctx.fillRect(0, yy, BASE_W, 1);
        }
        bctx.globalAlpha = 1.0;
        
        // Vinheta final
        const grd = bctx.createRadialGradient(
            BASE_W / 2, BASE_H / 2, BASE_W / 4,
            BASE_W / 2, BASE_H / 2, BASE_W * 0.7
        );
        grd.addColorStop(0, "rgba(0,0,0,0)");
        grd.addColorStop(0.7, "rgba(30,0,0,0.2)");
        grd.addColorStop(1, "rgba(0,0,0,0.5)");
        bctx.fillStyle = grd;
        bctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Desenhar no canvas principal
        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.drawImage(base, 0, 0, SCREEN_W, SCREEN_H);
    }
    
    // Controles
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowUp':
                if (gameState === 'menu') {
                    selected = (selected - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
                    playSoundEffect('menuMove');
                }
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (gameState === 'menu') {
                    selected = (selected + 1) % MENU_OPTIONS.length;
                    playSoundEffect('menuMove');
                }
                e.preventDefault();
                break;
            // Ativar/desativar diagnóstico da lanterna com F9
            case 'F9':
                if (window.LanternaDiagnostico) {
                    if (window.LanternaDiagnostico.isAtivo && window.LanternaDiagnostico.isAtivo()) {
                        window.LanternaDiagnostico.desativar();
                        window.LanternaDiagnostico.mostrarUI(false);
                        console.log('Diagnóstico da lanterna desativado');
                    } else {
                        window.LanternaDiagnostico.ativar();
                        window.LanternaDiagnostico.mostrarUI(true);
                        console.log('Diagnóstico da lanterna ativado');
                    }
                }
                break;
            case 'Enter':
                if (gameState === 'menu') {
                    playSoundEffect('menuSelect');
                    // Processa a seleção do menu
                    switch(selected) {
                        case 0: // Novo Jogo
                            gameState = 'game';
                            // Resetar estado do jogador (novo jogo)
                            jogador.vida = jogador.vidaMaxima;
                            jogador.sanidade = jogador.sanidadeMaxima;
                            jogador.posicao.x = BASE_W / 2;
                            jogador.posicao.y = BASE_H / 2;
                            jogador.lanterna = false;
                            jogador.efeitos = {
                                ultimoSuspiro: 0,
                                piscarOlhos: 0,
                                passosTomados: 0
                            };
                            jogoInicializado = false;
                            ambiente = 'casa';
                            mundoOffset = { x: 0, y: 0 };
                            inimigosAtivos = [];
                            tick = 0;
                            
                            // Garantir que o áudio seja inicializado antes de tocar música
                            if (!audioInitialized) {
                                initializeAudioOnFirstInteraction();
                            }
                            
                            // Aguardar um pouco e iniciar a música
                            setTimeout(() => {
                                startBackgroundMusic();
                            }, 100);
                            break;
                            
                        case 1: // Continuar
                            if (temSaveDisponivel) {
                                if (carregarJogo()) {
                                    gameState = 'game';
                                    jogoInicializado = true; // Já carregou, não precisa respawnar inimigos
                                    
                                    // Garantir que o áudio seja inicializado
                                    if (!audioInitialized) {
                                        initializeAudioOnFirstInteraction();
                                    }
                                    
                                    setTimeout(() => {
                                        startBackgroundMusic();
                                    }, 100);
                                } else {
                                    // Erro ao carregar - mostrar mensagem
                                    console.log("Erro ao carregar o save");
                                    if (window.EfeitosVisuais) {
                                        window.EfeitosVisuais.criarFlash('#ff0000', 300, 0.3);
                                    }
                                }
                            } else {
                                // Nenhum save disponível
                                console.log("Nenhum save encontrado");
                                if (window.EfeitosVisuais) {
                                    window.EfeitosVisuais.criarFlash('#ffaa00', 300, 0.2);
                                }
                            }
                            break;
                            
                        case 2: // Opções
                            gameState = 'options';
                            break;
                        case 3: // Segredos
                            gameState = 'credits';
                            break;
                        case 4: // Desistir
                            gameState = 'quit';
                            break;
                    }
                }
                console.log("Selecionado:", MENU_OPTIONS[selected], "Estado:", gameState);
                e.preventDefault();
                break;
            case 'Escape':
                if (gameState !== 'menu') {
                    gameState = 'menu';
                    stopBackgroundMusic();
                    playSoundEffect('menuSelect');
                    console.log("Voltando para o menu principal");
                }
                e.preventDefault();
                break;
            
            // Controles de movimento do jogador (WASD)
            case 'w':
            case 'W':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    if (ambiente === 'mundo') {
                        // No mundo aberto, mover o mundo ao invés do jogador nas bordas
                        if (jogador.posicao.y > BASE_H / 2) {
                            jogador.posicao.y = Math.max(jogador.sprite.height/2, jogador.posicao.y - jogador.velocidade);
                        } else {
                            mundoOffset.y -= jogador.velocidade;
                        }
                    } else {
                        jogador.posicao.y = Math.max(jogador.sprite.height/2, jogador.posicao.y - jogador.velocidade);
                    }
                    jogador.animacao.direcao = 'up';
                    jogador.animacao.andando = true;
                    
                    // Incrementar contador de passos
                    jogador.efeitos.passosTomados++;
                    
                    // Som de passos
                    if(tick % 30 === 0) {
                        playSoundEffect('footstep');
                        // Ocasionalmente adicionar suspiro de cansaço
                        if (jogador.efeitos.passosTomados > 50 && jogador.vida < 70 && Math.random() < 0.2) {
                            jogador.efeitos.ultimoSuspiro = tick;
                        }
                    }
                }
                e.preventDefault();
                break;
            case 's':
            case 'S':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    if (ambiente === 'mundo') {
                        // No mundo aberto, mover o mundo ao invés do jogador nas bordas
                        if (jogador.posicao.y < BASE_H / 2) {
                            jogador.posicao.y = Math.min(BASE_H - jogador.sprite.height/2, jogador.posicao.y + jogador.velocidade);
                        } else {
                            mundoOffset.y += jogador.velocidade;
                        }
                    } else {
                        jogador.posicao.y = Math.min(BASE_H - jogador.sprite.height/2, jogador.posicao.y + jogador.velocidade);
                    }
                    jogador.animacao.direcao = 'down';
                    jogador.animacao.andando = true;
                    
                    // Incrementar contador de passos
                    jogador.efeitos.passosTomados++;
                    
                    // Som de passos
                    if(tick % 30 === 0) {
                        playSoundEffect('footstep');
                        // Ocasionalmente adicionar suspiro de cansaço
                        if (jogador.efeitos.passosTomados > 50 && jogador.vida < 70 && Math.random() < 0.2) {
                            jogador.efeitos.ultimoSuspiro = tick;
                        }
                    }
                }
                e.preventDefault();
                break;
            case 'a':
            case 'A':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    if (ambiente === 'mundo') {
                        // No mundo aberto, mover o mundo ao invés do jogador nas bordas
                        if (jogador.posicao.x > BASE_W / 2) {
                            jogador.posicao.x = Math.max(jogador.sprite.width/2, jogador.posicao.x - jogador.velocidade);
                        } else {
                            mundoOffset.x -= jogador.velocidade;
                        }
                    } else {
                        jogador.posicao.x = Math.max(jogador.sprite.width/2, jogador.posicao.x - jogador.velocidade);
                    }
                    jogador.animacao.direcao = 'left';
                    jogador.animacao.andando = true;
                    
                    // Incrementar contador de passos
                    jogador.efeitos.passosTomados++;
                    
                    // Som de passos
                    if(tick % 30 === 0) {
                        playSoundEffect('footstep');
                        // Ocasionalmente adicionar suspiro de cansaço
                        if (jogador.efeitos.passosTomados > 50 && jogador.vida < 70 && Math.random() < 0.2) {
                            jogador.efeitos.ultimoSuspiro = tick;
                        }
                    }
                }
                e.preventDefault();
                break;
            case 'd':
            case 'D':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    if (ambiente === 'mundo') {
                        // No mundo aberto, mover o mundo ao invés do jogador nas bordas
                        if (jogador.posicao.x < BASE_W / 2) {
                            jogador.posicao.x = Math.min(BASE_W - jogador.sprite.width/2, jogador.posicao.x + jogador.velocidade);
                        } else {
                            mundoOffset.x += jogador.velocidade;
                        }
                    } else {
                        jogador.posicao.x = Math.min(BASE_W - jogador.sprite.width/2, jogador.posicao.x + jogador.velocidade);
                    }
                    jogador.animacao.direcao = 'right';
                    jogador.animacao.andando = true;
                    
                    // Incrementar contador de passos
                    jogador.efeitos.passosTomados++;
                    
                    // Som de passos
                    if(tick % 30 === 0) {
                        playSoundEffect('footstep');
                        // Ocasionalmente adicionar suspiro de cansaço
                        if (jogador.efeitos.passosTomados > 50 && jogador.vida < 70 && Math.random() < 0.2) {
                            jogador.efeitos.ultimoSuspiro = tick;
                        }
                    }
                }
                e.preventDefault();
                break;
                
            // Ataque básico
            case ' ':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    // Verificar cooldown
                    const agora = Date.now();
                    if (agora - ultimoAtaque < 500) {
                        break; // Ainda em cooldown
                    }
                    
                    ultimoAtaque = agora;
                    playSoundEffect('attack');
                    
                    // Definir tipo de ataque baseado nas teclas numéricas pressionadas
                    if (tecla1) {
                        tipoAtaque = 'rapido';
                    } else if (tecla2) {
                        tipoAtaque = 'medio';
                    } else if (tecla3) {
                        tipoAtaque = 'forte';
                    } else {
                        tipoAtaque = 'rapido'; // Ataque padrão
                    }
                    
                    // Configurar dano baseado no tipo de ataque
                    let dano = 10; // Dano base para ataque rápido
                    let alcance = 15; // Alcance base para ataque rápido
                    
                    if (tipoAtaque === 'medio') {
                        dano = 20;
                        alcance = 20;
                    } else if (tipoAtaque === 'forte') {
                        dano = 35;
                        alcance = 25;
                    }
                    
                    // Sinalizar que o jogador está atacando (para animação)
                    atacando = true;
                    jogador.ultimoAtaque = Date.now();
                    
                    // Aplicar efeitos visuais se disponíveis
                    if (window.EfeitosVisuais) {
                        if (tipoAtaque === 'rapido') {
                            window.EfeitosVisuais.criarRastroArma(
                                jogador.posicao.x, 
                                jogador.posicao.y, 
                                jogador.animacao.direcao, 
                                '#FFE0A3', 
                                1.2
                            );
                        } else if (tipoAtaque === 'medio') {
                            window.EfeitosVisuais.criarRastroArma(
                                jogador.posicao.x, 
                                jogador.posicao.y, 
                                jogador.animacao.direcao, 
                                '#FFA500', 
                                1.5
                            );
                            window.EfeitosVisuais.criarTremor(0.2, 200);
                        } else if (tipoAtaque === 'forte') {
                            window.EfeitosVisuais.criarRastroArma(
                                jogador.posicao.x, 
                                jogador.posicao.y, 
                                jogador.animacao.direcao, 
                                '#FF2A00', 
                                2
                            );
                            window.EfeitosVisuais.criarTremor(0.4, 300);
                            window.EfeitosVisuais.criarFlash('rgba(255, 40, 0, 0.1)', 200, 0.3);
                        }
                    }
                    
                    // Atacar inimigos próximos
                    for (let i = inimigosAtivos.length - 1; i >= 0; i--) {
                        const inimigo = inimigosAtivos[i];
                        const distX = Math.abs(jogador.posicao.x - inimigo.posicao.x);
                        const distY = Math.abs(jogador.posicao.y - inimigo.posicao.y);
                        const distancia = Math.sqrt(distX * distX + distY * distY);
                        
                        // Verificar se o inimigo está no alcance do ataque
                        if (distancia < alcance) {
                            inimigo.vida -= dano;
                            inimigo.ultimoDano = Date.now(); // Registrar momento em que o inimigo recebeu dano
                            inimigo.danoRecebido = dano;
                            console.log(`Atacou ${inimigo.nome} com ataque ${tipoAtaque}! Vida restante: ${inimigo.vida}`);
                            
                            // Empurrar inimigo para trás (knockback mais forte para ataques mais fortes)
                            const dirX = (inimigo.posicao.x - jogador.posicao.x) / distancia;
                            const dirY = (inimigo.posicao.y - jogador.posicao.y) / distancia;
                            
                            let knockbackForce = 10; // Força base
                            if (tipoAtaque === 'medio') knockbackForce = 15;
                            if (tipoAtaque === 'forte') knockbackForce = 20;
                            
                            inimigo.posicao.x += dirX * knockbackForce;
                            inimigo.posicao.y += dirY * knockbackForce;
                            
                            // Efeitos visuais quando atinge o inimigo
                            if (window.EfeitosVisuais) {
                                // Criar partículas de impacto
                                window.EfeitosVisuais.criarExplosao(
                                    inimigo.posicao.x, 
                                    inimigo.posicao.y, 
                                    tipoAtaque === 'rapido' ? '#FFE0A3' : 
                                    tipoAtaque === 'medio' ? '#FFA500' : '#FF2A00',
                                    tipoAtaque === 'rapido' ? 5 : 
                                    tipoAtaque === 'medio' ? 10 : 15,
                                    2, 
                                    500
                                );
                                
                                // Criar efeito de sangue
                                window.EfeitosVisuais.criarSangue(
                                    inimigo.posicao.x, 
                                    inimigo.posicao.y, 
                                    tipoAtaque === 'rapido' ? 5 : 
                                    tipoAtaque === 'medio' ? 10 : 15
                                );
                            }
                            
                            break;
                        }
                    }
                }
                e.preventDefault();
                break;
                
            // Teclas de seleção de ataque
            case '1':
                tecla1 = true;
                tecla2 = false;
                tecla3 = false;
                tipoAtaque = 'rapido';
                break;
                
            case '2':
                tecla1 = false;
                tecla2 = true;
                tecla3 = false;
                tipoAtaque = 'medio';
                break;
                
            case '3':
                tecla1 = false;
                tecla2 = false;
                tecla3 = true;
                tipoAtaque = 'forte';
                break;
                
            // Tecla S para salvar o jogo quando perto do baú
            case 's':
            case 'S':
                if (gameState === 'game' && ambiente === 'casa' && jogador.vida > 0 && jogador.sanidade > 0) {
                    // Verifica se está perto do baú (posição do baú: x=480, y=320)
                    const distanciaX = Math.abs(jogador.posicao.x - 480);
                    const distanciaY = Math.abs(jogador.posicao.y - 320);
                    
                    if (distanciaX < 40 && distanciaY < 40) {
                        console.log('Salvando jogo...');
                        salvarJogo();
                        playSoundEffect('menuSelect');
                        
                        // Exibe mensagem de confirmação
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper("Jogo salvo com sucesso no baú!");
                        } else {
                            playWhisper("Jogo salvo com sucesso no baú!");
                        }
                    } else {
                        // Mensagem quando não está perto do baú
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper("Você precisa estar perto do baú para salvar.");
                        } else {
                            playWhisper("Você precisa estar perto do baú para salvar.");
                        }
                    }
                }
                break;
                
            // Tecla E para transição entre ambientes
            case 'e':
            case 'E':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    if (ambiente === 'casa') {
                        // Da casa para o quintal
                        console.log('Iniciando transição para o quintal...');
                        ambiente = 'quintal';
                        jogador.posicao.x = BASE_W / 2;
                        jogador.posicao.y = BASE_H - 40;
                        spawnarInimigos(ambiente);
                        playSoundEffect('menuSelect');
                        
                        const mensagensQuintal = [
                            "O ar lá fora está pesado... algo te observa nas sombras...",
                            "Você não deveria ter saído da casa...",
                            "Eles estão esperando por você no jardim..."
                        ];
                        const mensagemAleatoria = mensagensQuintal[Math.floor(Math.random() * mensagensQuintal.length)];
                        
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper(mensagemAleatoria);
                        } else {
                            playWhisper(mensagemAleatoria);
                        }
                        
                    } else if (ambiente === 'quintal') {
                        // Do quintal, verificar posição para decidir destino
                        if (jogador.posicao.y < 90 && Math.abs(jogador.posicao.x - BASE_W/2) < 20) {
                            // Próximo à porta da casa - voltar para casa
                            console.log('Iniciando transição para a casa...');
                            ambiente = 'casa';
                            jogador.posicao.x = BASE_W / 2;
                            jogador.posicao.y = 40;
                            spawnarInimigos(ambiente);
                            playSoundEffect('menuSelect');
                            
                            const mensagensCasa = [
                                "De volta para dentro... mas você não está sozinho aqui...",
                                "As paredes têm olhos... eles nunca param de te observar...",
                                "A casa lembra de você... e eles também..."
                            ];
                            const mensagemAleatoria = mensagensCasa[Math.floor(Math.random() * mensagensCasa.length)];
                            
                            if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                                window.CutsceneSystem.playWhisper(mensagemAleatoria);
                            } else {
                                playWhisper(mensagemAleatoria);
                            }
                            
                        } else if (jogador.posicao.y > BASE_H - 20) {
                            // Na parte de baixo do quintal - ir para o mundo aberto
                            console.log('Iniciando transição para o mundo aberto...');
                            ambiente = 'mundo';
                            mundoOffset.x = 0;
                            mundoOffset.y = 0;
                            jogador.posicao.x = BASE_W / 2;
                            jogador.posicao.y = 30;
                            spawnarInimigos(ambiente);
                            playSoundEffect('menuSelect');
                            
                            const mensagensMundo = [
                                "Um mundo vasto se estende à sua frente... cheio de perigos desconhecidos...",
                                "O vento sussurra segredos antigos... você não está preparado para o que vem...",
                                "Infinitas possibilidades... e infinitos terrores aguardam..."
                            ];
                            const mensagemAleatoria = mensagensMundo[Math.floor(Math.random() * mensagensMundo.length)];
                            
                            if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                                window.CutsceneSystem.playWhisper(mensagemAleatoria);
                            } else {
                                playWhisper(mensagemAleatoria);
                            }
                        }
                        
                    } else if (ambiente === 'mundo') {
                        // Do mundo aberto, voltar para o quintal se estiver na borda superior
                        if (jogador.posicao.y < 20) {
                            console.log('Iniciando transição para o quintal...');
                            ambiente = 'quintal';
                            jogador.posicao.x = BASE_W / 2;
                            jogador.posicao.y = BASE_H - 30;
                            spawnarInimigos(ambiente);
                            playSoundEffect('menuSelect');
                            
                            const mensagensRetorno = [
                                "De volta à segurança relativa do quintal...",
                                "O mundo lá fora é muito perigoso... por enquanto...",
                                "Você sente um alívio ao voltar... mas por pouco tempo..."
                            ];
                            const mensagemAleatoria = mensagensRetorno[Math.floor(Math.random() * mensagensRetorno.length)];
                            
                            if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                                window.CutsceneSystem.playWhisper(mensagemAleatoria);
                            } else {
                                playWhisper(mensagemAleatoria);
                            }
                        }
                    }
                }
                e.preventDefault();
                break;
        }
    });
    
    // Evento para parar animação quando solta a tecla
    document.addEventListener('keyup', function(e) {
        if(gameState === 'game') {
            switch(e.key) {
                case 'w':
                case 'W':
                case 's':
                case 'S':
                case 'a':
                case 'A':
                case 'd':
                case 'D':
                    jogador.animacao.andando = false;
                    jogador.animacao.frame = 0;
                    break;
                    
                case 'e':
                case 'E':
                    teclaE = false;
                    break;
                    
                case '1':
                    tecla1 = false;
                    break;
                    
                case '2':
                    tecla2 = false;
                    break;
                    
                case '3':
                    tecla3 = false;
                    break;
            }
        }
    });
    
    // Loop do jogo
    function loop() {
        if (gameState === 'game' && !jogoInicializado) {
            inicializarJogo();
        }
        
        atualizar();
        desenhar();
        
        tick++;
        requestAnimationFrame(loop);
    }
    
    // Inicializar o jogo
    function inicializarJogo() {
        console.log("Inicializando o jogo...");
        
        // Inicializar sistema de áudio ao interagir
        if (!audioContext) {
            initAudio();
        }
        
        // Inicializar sistema de personagens
        if (!gerenciadorPersonagens) {
            gerenciadorPersonagens = new GerenciadorPersonagens(bctx);
            gerenciadorPersonagens.carregarPersonagemPrincipal(jogador.aparencia);
        }

        // Inicializar sistema de lanterna
        if (window.LanternaSystem) {
            window.LanternaSystem.init();
        }
        
        jogoInicializado = true;
        console.log("Jogo inicializado com sucesso!");
    }
    
    // Função de atualização
    function atualizar() {
        // Atualizar estado do jogador (vida, sanidade, etc)
        if (jogador.vida > 0) {
            jogador.vida -= 0.01; // Exemplo de redução de vida ao longo do tempo
        }
        
        if (jogador.sanidade > 0) {
            jogador.sanidade -= 0.005; // Exemplo de redução de sanidade ao longo do tempo
        }
        
        // Atualizar inimigos
        atualizarInimigos(1/60);
        
        // Verificar transições de ambiente
        if (jogador.posicao.y < 0) {
            ambiente = 'casa';
            jogador.posicao.y = BASE_H - 1;
            spawnarInimigos(ambiente);
        } else if (jogador.posicao.y > BASE_H) {
            ambiente = 'quintal';
            jogador.posicao.y = 1;
            spawnarInimigos(ambiente);
        }
        
        // Atualizar sistema de lanterna
        if (window.LanternaSystem) {
            window.LanternaSystem.update(jogador.posicao, jogador.animacao.direcao);
        }
    }
    
    // Função principal de desenho
    function desenhar() {
        bctx.clearRect(0, 0, BASE_W, BASE_H);
        
        // Desenhar fundo
        drawAnimatedBackground(bctx, tick);
        
        // Desenhar jogador
        renderizarJogador(bctx);
        
        // Desenhar inimigos
        renderizarInimigos(bctx);
        
        // Desenhar UI
        renderizarUI(bctx);
    }
    
    // Loop principal do jogo
    function loop() {
        if (gameState === 'game' && !jogoInicializado) {
            inicializarJogo();
        }
        
        atualizar();
        desenhar();
        
        tick++;
        requestAnimationFrame(loop);
    }
    
    console.log("Iniciando loop do jogo...");
    loop();
    
    // Configurar botões (se existirem)
    const musicToggleBtn = document.getElementById('musicToggle');
    const sfxToggleBtn = document.getElementById('sfxToggle');
    const fullscreenToggleBtn = document.getElementById('fullscreenToggle');
    
    // Inicializar áudio quando o usuário interage pela primeira vez
    let audioInitialized = false;
    function initializeAudioOnFirstInteraction() {
        if (!audioInitialized) {
            initAudio();
            audioInitialized = true;
        }
    }
    
    if (musicToggleBtn) {
        musicToggleBtn.addEventListener('click', function() {
            initializeAudioOnFirstInteraction();
            audioConfig.musicEnabled = !audioConfig.musicEnabled;
            musicToggleBtn.textContent = audioConfig.musicEnabled ? "🔊 Música" : "🔇 Música";
            
            if (audioConfig.musicEnabled && gameState === 'game') {
                startBackgroundMusic();
            } else {
                stopBackgroundMusic();
            }
        });
    }
    
    if (sfxToggleBtn) {
        sfxToggleBtn.addEventListener('click', function() {
            initializeAudioOnFirstInteraction();
            audioConfig.sfxEnabled = !audioConfig.sfxEnabled;
            sfxToggleBtn.textContent = audioConfig.sfxEnabled ? "🔊 Sons" : "🔇 Sons";
            
            if (audioConfig.sfxEnabled) {
                playSoundEffect('menuSelect');
            }
        });
    }
    
    if (fullscreenToggleBtn) {
        fullscreenToggleBtn.addEventListener('click', function() {
            initializeAudioOnFirstInteraction();
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });
    }
    
    // Inicializar áudio no primeiro clique em qualquer lugar
    document.addEventListener('click', initializeAudioOnFirstInteraction, { once: true });
    document.addEventListener('keydown', initializeAudioOnFirstInteraction, { once: true });
});

console.log("Script carregado com sucesso!");
