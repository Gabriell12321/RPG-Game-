// RPG de Terror - Versão Simplificada e Robusta
console.log("Iniciando jogo...");

// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado, iniciando jogo...");
    
    // Constantes do jogo
    const BASE_W = 320, BASE_H = 180, SCALE = 3;
    const SCREEN_W = BASE_W * SCALE, SCREEN_H = BASE_H * SCALE;
    
    const MENU_OPTIONS = ["Começar Pesadelo", "Opções", "Segredos", "Desistir"];
    const GAME_VERSION = "Pesadelo v0.1";
    
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
    let ambiente = 'casa'; // casa, quintal
    
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
        game: "INICIANDO PESADELO...\n\nVocê acorda em um quarto escuro.\nUm trovão ilumina brevemente o ambiente.\nA porta está entreaberta. Algo se move nas sombras...\n\nUse WASD para mover\nESPAÇO para atacar\nE para alternar entre casa e quintal\nESC para menu",
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
            
            return true;
        } catch (e) {
            console.log("Áudio não suportado:", e);
            return false;
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
        if (!audioContext || !audioConfig.musicEnabled || backgroundMusicOscillator) return;
        
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
        }
    }
    
    // Desenhar interior da casa
    function drawCasaInterior(ctx, t) {
        // Fundo básico - piso de madeira
        ctx.fillStyle = '#302820';
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Padrão do piso de madeira
        ctx.strokeStyle = 'rgba(30, 20, 10, 0.3)';
        for(let y = 0; y < BASE_H; y += 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(BASE_W, y);
            ctx.stroke();
        }
        
        // Padrão vertical do piso de madeira
        for(let x = 0; x < BASE_W; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, BASE_H);
            ctx.stroke();
        }
        
        // Paredes (escuras)
        ctx.fillStyle = '#251a12';
        // Parede superior
        ctx.fillRect(0, 0, BASE_W, 25);
        // Parede esquerda
        ctx.fillRect(0, 0, 25, BASE_H);
        // Parede direita
        ctx.fillRect(BASE_W - 25, 0, 25, BASE_H);
        // Parede inferior
        ctx.fillRect(0, BASE_H - 25, BASE_W, 25);
        
        // Porta para o quintal (parede inferior)
        ctx.fillStyle = '#40342c';
        ctx.fillRect(BASE_W/2 - 15, BASE_H - 25, 30, 25);
        
        // Maçaneta da porta
        ctx.fillStyle = '#c0a080';
        ctx.beginPath();
        ctx.arc(BASE_W/2 + 10, BASE_H - 13, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Móveis
        
        // Mesa
        ctx.fillStyle = '#603020';
        ctx.fillRect(50, 50, 60, 40);
        // Sombra da mesa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(50, 90, 60, 5);
        
        // Cadeiras
        ctx.fillStyle = '#503020';
        ctx.fillRect(40, 60, 10, 10); // Cadeira 1
        ctx.fillRect(110, 60, 10, 10); // Cadeira 2
        
        // Armário
        ctx.fillStyle = '#402010';
        ctx.fillRect(BASE_W - 70, 40, 30, 80);
        // Detalhes do armário
        ctx.fillStyle = '#603030';
        ctx.fillRect(BASE_W - 65, 50, 20, 25);
        ctx.fillRect(BASE_W - 65, 85, 20, 25);
        
        // Cama
        ctx.fillStyle = '#503030';
        ctx.fillRect(40, BASE_H - 80, 50, 40);
        // Travesseiro
        ctx.fillStyle = '#eaeaea';
        ctx.fillRect(45, BASE_H - 75, 15, 10);
        // Cobertor
        ctx.fillStyle = '#7a3030';
        ctx.fillRect(45, BASE_H - 65, 40, 25);
        
        // Tapete
        ctx.fillStyle = '#a06040';
        ctx.fillRect(BASE_W/2 - 30, BASE_H/2 - 20, 60, 40);
        // Padrão do tapete
        ctx.strokeStyle = '#704020';
        ctx.strokeRect(BASE_W/2 - 25, BASE_H/2 - 15, 50, 30);
        
        // Estante de livros
        ctx.fillStyle = '#603020';
        ctx.fillRect(BASE_W - 65, BASE_H - 100, 40, 60);
        // Livros na estante
        for(let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                ctx.fillStyle = ['#c05040', '#d09030', '#5060c0', '#60a040'][Math.floor(Math.random() * 4)];
                ctx.fillRect(BASE_W - 60 + j*12, BASE_H - 95 + i*18, 8, 15);
            }
        }
        
        // Janela na parede
        ctx.fillStyle = '#152030';
        ctx.fillRect(30, 5, 40, 15);
        // Grade da janela
        ctx.strokeStyle = '#605040';
        ctx.beginPath();
        ctx.moveTo(50, 5);
        ctx.lineTo(50, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(30, 12);
        ctx.lineTo(70, 12);
        ctx.stroke();
        
        // Luz ambiente que pisca levemente
        const lightFlicker = Math.sin(t * 0.01) * 0.05 + 0.95;
        ctx.fillStyle = `rgba(255, 220, 180, ${0.15 * lightFlicker})`;
        ctx.fillRect(0, 0, BASE_W, BASE_H);
        
        // Iluminação da lareira
        const fireLight = Math.sin(t * 0.1) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(255, 140, 30, ${0.2 * fireLight})`;
        ctx.beginPath();
        ctx.arc(50, BASE_H - 50, 40 + fireLight * 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Lareira
        ctx.fillStyle = '#302010';
        ctx.fillRect(30, BASE_H - 70, 40, 45);
        // Interior da lareira
        ctx.fillStyle = '#0c0804';
        ctx.fillRect(35, BASE_H - 65, 30, 35);
        // Fogo (animado)
        for(let i = 0; i < 15; i++) {
            const flameHeight = 10 + Math.sin(t * 0.1 + i) * 5;
            const flameWidth = 3 + Math.sin(t * 0.2 + i) * 1;
            const flameX = 40 + i * 1.5;
            ctx.fillStyle = `rgba(255, ${100 + Math.sin(t * 0.1 + i) * 50}, 0, ${0.7 + Math.sin(t * 0.3 + i) * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(flameX, BASE_H - 40);
            ctx.lineTo(flameX - flameWidth, BASE_H - 40 - flameHeight);
            ctx.lineTo(flameX + flameWidth, BASE_H - 40 - flameHeight);
            ctx.fill();
        }
        
        // Porta-objetos decorativo
        ctx.fillStyle = '#604030';
        ctx.fillRect(150, 30, 70, 15);
        // Objetos
        ctx.fillStyle = '#a0a0c0'; // Vaso
        ctx.fillRect(160, 15, 10, 15);
        ctx.fillStyle = '#80c080'; // Planta
        ctx.beginPath();
        ctx.arc(165, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#c09080'; // Caixa
        ctx.fillRect(180, 20, 15, 10);
        
        // Sombras nas paredes
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, BASE_W, 5);
        ctx.fillRect(0, 0, 5, BASE_H);
        ctx.fillRect(BASE_W - 5, 0, 5, BASE_H);
        
        // Interação - Texto indicando a porta para o quintal
        if(jogador.posicao.y > BASE_H - 40 && 
          Math.abs(jogador.posicao.x - BASE_W/2) < 20) {
            ctx.fillStyle = 'white';
            ctx.font = '8px monospace';
            ctx.fillText("Pressione E para sair", BASE_W/2 - 45, BASE_H - 30);
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
            velocidade: mob.velocidade,
            cor: mob.cor,
            tamanho: mob.tamanho,
            alerta: false,
            ultimoAtaque: 0,
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
            const tempoDesdeUltimoAtaque = Date.now() - inimigo.ultimoAtaque;
            const foiAtingido = tempoDesdeUltimoAtaque < 500;
            
            // Sombra do inimigo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x, y + inimigo.tamanho/2, inimigo.tamanho * 0.6, inimigo.tamanho * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de pulsação quando atingido
            let escala = 1;
            if (foiAtingido) {
                escala = 1 + Math.sin(tempoDesdeUltimoAtaque * 0.05) * 0.2;
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
                    const distorcao = tempoDesdeUltimoAtaque / 500; // 0-1
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
                const progress = tempoDesdeUltimoAtaque / 500; // 0-1
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
            
            // Barra de vida melhorada
            const vidaPct = inimigo.vida / inimigo.vidaMaxima;
            if (vidaPct < 1) {
                // Fundo da barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(x - 10, y - 14, 20, 4);
                
                // Barra de vida com gradiente
                const corVida = vidaPct > 0.7 ? 'green' : 
                               vidaPct > 0.4 ? 'yellow' : 
                               vidaPct > 0.2 ? 'orange' : 'red';
                ctx.fillStyle = corVida;
                ctx.fillRect(x - 9, y - 13, vidaPct * 18, 2);
                
                // Borda da barra
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                ctx.strokeRect(x - 10, y - 14, 20, 4);
            }
            
            // Partículas ao redor dos inimigos
            if (inimigo.alerta) {
                for (let i = 0; i < 3; i++) {
                    const px = x + (Math.random() - 0.5) * 15;
                    const py = y + (Math.random() - 0.5) * 15;
                    const cor = inimigo.tipo === 'sombra' ? 
                        `rgba(80, 0, 80, ${Math.random() * 0.5})` :
                        `rgba(200, 200, 255, ${Math.random() * 0.5})`;
                    ctx.fillStyle = cor;
                    ctx.fillRect(px, py, 1, 1);
                }
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
                `rgb(${150 + pulsacao * 30}, ${40 + pulsacao * 20}, ${40 + pulsacao * 20})`;
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
            } else if (expressaoOlhos === 'o') {
                // Olhos arregalados (baixa sanidade)
                ctx.fillStyle = 'white';
                ctx.fillRect(x - 2, y - 5 + bobbing, 2, 2);
                ctx.fillRect(x, y - 5 + bobbing, 2, 2);
                
                ctx.fillStyle = '#000000';
                ctx.fillRect(x - 1, y - 5 + bobbing, 1, 1);
                ctx.fillRect(x + 1, y - 5 + bobbing, 1, 1);
            } else {
                // Olhos 'x' (vida baixa)
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1;
                
                // Olho esquerdo 'x'
                ctx.beginPath();
                ctx.moveTo(x - 2, y - 5 + bobbing);
                ctx.lineTo(x, y - 4 + bobbing);
                ctx.moveTo(x - 2, y - 4 + bobbing);
                ctx.lineTo(x, y - 5 + bobbing);
                ctx.stroke();
                
                // Olho direito 'x'
                ctx.beginPath();
                ctx.moveTo(x + 0, y - 5 + bobbing);
                ctx.lineTo(x + 2, y - 4 + bobbing);
                ctx.moveTo(x + 0, y - 4 + bobbing);
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
        
        // Painel de status com fundo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(2, 2, 160, 48);
        
        // Borda do painel
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, 160, 48);
        
        // === BARRA DE VIDA ===
        // Fundo da barra de vida
        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.fillRect(5, 6, 102, 12);
        
        // Gradiente da vida
        const vidaPct = jogador.vida / jogador.vidaMaxima;
        let corVida;
        if (vidaPct > 0.6) {
            corVida = `rgb(${50 * pulsacao}, ${200 * pulsacao}, ${50 * pulsacao})`;
        } else if (vidaPct > 0.3) {
            corVida = `rgb(${255 * pulsacao}, ${255 * pulsacao}, ${50 * pulsacao})`;
        } else {
            corVida = `rgb(${255 * pulsacao}, ${50 * pulsacao}, ${50 * pulsacao})`;
        }
        
        ctx.fillStyle = corVida;
        ctx.fillRect(6, 7, vidaPct * 100, 10);
        
        // Borda da barra de vida
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(5, 6, 102, 12);
        
        // Texto da vida com sombra
        ctx.fillStyle = 'black';
        ctx.font = '8px monospace';
        ctx.fillText(`VIDA: ${jogador.vida}/${jogador.vidaMaxima}`, 7, 15);
        ctx.fillStyle = 'white';
        ctx.fillText(`VIDA: ${jogador.vida}/${jogador.vidaMaxima}`, 6, 14);
        
        // === BARRA DE SANIDADE ===
        // Fundo da barra de sanidade
        ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
        ctx.fillRect(5, 21, 102, 12);
        
        // Gradiente da sanidade
        const sanidadePct = jogador.sanidade / jogador.sanidadeMaxima;
        let corSanidade;
        if (sanidadePct > 0.6) {
            corSanidade = `rgb(${50 * pulsacao}, ${200 * pulsacao}, ${255 * pulsacao})`;
        } else if (sanidadePct > 0.3) {
            corSanidade = `rgb(${255 * pulsacao}, ${200 * pulsacao}, ${100 * pulsacao})`;
        } else {
            corSanidade = `rgb(${200 * pulsacao}, ${50 * pulsacao}, ${255 * pulsacao})`;
        }
        
        ctx.fillStyle = corSanidade;
        ctx.fillRect(6, 22, sanidadePct * 100, 10);
        
        // Borda da barra de sanidade
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 1;
        ctx.strokeRect(5, 21, 102, 12);
        
        // Texto da sanidade com sombra
        ctx.fillStyle = 'black';
        ctx.fillText(`SANIDADE: ${jogador.sanidade}/${jogador.sanidadeMaxima}`, 7, 30);
        ctx.fillStyle = 'cyan';
        ctx.fillText(`SANIDADE: ${jogador.sanidade}/${jogador.sanidadeMaxima}`, 6, 29);
        
        // === CONTADOR DE INIMIGOS ===
        ctx.fillStyle = 'black';
        ctx.fillText(`INIMIGOS: ${inimigosAtivos.length}`, 7, 44);
        ctx.fillStyle = inimigosAtivos.length > 0 ? 'red' : 'green';
        ctx.fillText(`INIMIGOS: ${inimigosAtivos.length}`, 6, 43);
        
        // === INDICADOR DE BAIXA VIDA/SANIDADE ===
        if (jogador.vida < 30) {
            const alerta = Math.sin(tick * 0.3) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * alerta})`;
            ctx.fillRect(0, 0, BASE_W, 3);
            ctx.fillRect(0, BASE_H - 3, BASE_W, 3);
            ctx.fillRect(0, 0, 3, BASE_H);
            ctx.fillRect(BASE_W - 3, 0, 3, BASE_H);
        }
        
        if (jogador.sanidade < 30) {
            const alerta = Math.sin(tick * 0.4) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 255, ${0.2 * alerta})`;
            // Efeito de distorção nas bordas
            for (let i = 0; i < 5; i++) {
                const offset = Math.random() * 4 - 2;
                ctx.fillRect(i * 2 + offset, 0, 1, BASE_H);
                ctx.fillRect(BASE_W - i * 2 + offset, 0, 1, BASE_H);
            }
        }
        
        // === MINI-MAPA (canto superior direito) ===
        const miniMapSize = 40;
        const miniMapX = BASE_W - miniMapSize - 5;
        const miniMapY = 5;
        
        // Fundo do mini-mapa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Borda do mini-mapa
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        // Jogador no mini-mapa
        const playerMapX = miniMapX + (jogador.posicao.x / BASE_W) * miniMapSize;
        const playerMapY = miniMapY + (jogador.posicao.y / BASE_H) * miniMapSize;
        ctx.fillStyle = 'blue';
        ctx.fillRect(playerMapX - 1, playerMapY - 1, 2, 2);
        
        // Inimigos no mini-mapa
        for (const inimigo of inimigosAtivos) {
            const inimigoMapX = miniMapX + (inimigo.posicao.x / BASE_W) * miniMapSize;
            const inimigoMapY = miniMapY + (inimigo.posicao.y / BASE_H) * miniMapSize;
            ctx.fillStyle = inimigo.alerta ? 'red' : 'orange';
            ctx.fillRect(inimigoMapX, inimigoMapY, 1, 1);
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
            MENU_OPTIONS.forEach((opt, i) => {
                const tremor = i === selected ? Math.random() * 2 - 1 : 0;
                const txtW = bctx.measureText(opt).width;
                const x = (BASE_W - txtW) / 2 + tremor;
                const y = startY + i * 22;
                const isSel = (i === selected);
                
                // Destaque da seleção
                if (isSel) {
                    const glow = (1 + Math.sin(t * 0.008)) * 0.5;
                    const w = txtW + 12, h = 18;
                    bctx.fillStyle = `rgba(80,20,20,${0.4 + glow * 0.2})`;
                    bctx.fillRect(x - w / 2, y - h / 2, w, h);
                    
                    bctx.strokeStyle = `rgba(180,30,30,${0.5 + glow * 0.3})`;
                    bctx.strokeRect(x - w / 2, y - h / 2, w, h);
                }
                
                // Texto
                if (isSel) {
                    bctx.fillStyle = '#ffffff';
                    bctx.fillText(opt, x, y);
                } else {
                    bctx.fillStyle = '#a08585';
                    bctx.fillText(opt, x, y);
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
                renderizarUI(bctx);
                
                // Mensagem de instrução
                bctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                bctx.fillRect(0, BASE_H - 30, BASE_W, 30);
                bctx.fillStyle = '#ffffff';
                bctx.font = '10px monospace';
                bctx.fillText("Use WASD para mover, ESPAÇO para atacar, E para mudar de ambiente, ESC para menu", 5, BASE_H - 10);
                
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
            case 'Enter':
                if (gameState === 'menu') {
                    playSoundEffect('menuSelect');
                    // Processa a seleção do menu
                    switch(selected) {
                        case 0: // Começar Pesadelo
                            gameState = 'game';
                            // Resetar estado do jogador
                            jogador.vida = jogador.vidaMaxima;
                            jogador.sanidade = jogador.sanidadeMaxima;
                            jogador.posicao.x = BASE_W / 2;
                            jogador.posicao.y = BASE_H / 2;
                            jogoInicializado = false;
                            ambiente = 'casa'; // Começar na casa
                            startBackgroundMusic();
                            break;
                        case 1: // Opções
                            gameState = 'options';
                            break;
                        case 2: // Segredos
                            gameState = 'credits';
                            break;
                        case 3: // Desistir
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
                    jogador.posicao.y = Math.max(jogador.sprite.height/2, jogador.posicao.y - jogador.velocidade);
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
                    jogador.posicao.y = Math.min(BASE_H - jogador.sprite.height/2, jogador.posicao.y + jogador.velocidade);
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
                    jogador.posicao.x = Math.max(jogador.sprite.width/2, jogador.posicao.x - jogador.velocidade);
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
                    jogador.posicao.x = Math.min(BASE_W - jogador.sprite.width/2, jogador.posicao.x + jogador.velocidade);
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
                            inimigo.ultimoAtaque = Date.now();
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
                
            // Tecla E para transição entre ambientes
            case 'e':
            case 'E':
                if (gameState === 'game' && jogador.vida > 0 && jogador.sanidade > 0) {
                    // Trocar de ambiente (casa <-> quintal)
                    if (ambiente === 'casa') {
                        console.log('Iniciando transição para o quintal...');
                        ambiente = 'quintal';
                        // Reposicionar jogador
                        jogador.posicao.x = BASE_W / 2;
                        jogador.posicao.y = BASE_H - 40;
                        // Gerar novos inimigos para o novo ambiente
                        spawnarInimigos(ambiente);
                        playSoundEffect('menuSelect'); // Som de porta
                        
                        // Sussurro ao entrar no quintal
                        const mensagensQuintal = [
                            "O ar lá fora está pesado... algo te observa nas sombras...",
                            "Você não deveria ter saído da casa...",
                            "Eles estão esperando por você no jardim..."
                        ];
                        const mensagemAleatoria = mensagensQuintal[Math.floor(Math.random() * mensagensQuintal.length)];
                        
                        // Usar o sistema de sussurro da cutscene, se disponível
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper(mensagemAleatoria);
                        } else {
                            // Ou usar o sussurro interno
                            playWhisper(mensagemAleatoria);
                        }
                        
                    } else {
                        console.log('Iniciando transição para a casa...');
                        ambiente = 'casa';
                        // Reposicionar jogador
                        jogador.posicao.x = BASE_W / 2;
                        jogador.posicao.y = 40;
                        // Gerar novos inimigos para o novo ambiente
                        spawnarInimigos(ambiente);
                        playSoundEffect('menuSelect'); // Som de porta
                        
                        // Sussurro ao entrar na casa
                        const mensagensCasa = [
                            "De volta para dentro... mas você não está sozinho aqui...",
                            "As paredes têm olhos... eles nunca param de te observar...",
                            "A casa lembra de você... e eles também..."
                        ];
                        const mensagemAleatoria = mensagensCasa[Math.floor(Math.random() * mensagensCasa.length)];
                        
                        // Usar o sistema de sussurro da cutscene, se disponível
                        if (window.CutsceneSystem && window.CutsceneSystem.playWhisper) {
                            window.CutsceneSystem.playWhisper(mensagemAleatoria);
                        } else {
                            // Ou usar o sussurro interno
                            playWhisper(mensagemAleatoria);
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
        tick++;
        render(tick);
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
