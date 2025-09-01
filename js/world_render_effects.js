// Renderizar horizonte com montanhas distantes
function renderHorizon() {
  const horizonY = 70;
  
  // Linha do horizonte
  bctx.fillStyle = '#111';
  bctx.fillRect(0, horizonY, BASE_W, 2);
  
  // Montanhas distantes
  for (let i = 0; i < 8; i++) {
    const mountainX = i * 50 - 20;
    const mountainHeight = 20 + (i * 17) % 30;
    const mountainWidth = 70 + (i * 23) % 40;
    
    // Cor baseada na distância e hora do dia
    let mountainBrightness = 30 + (i % 3) * 10;
    if (lighting.timeOfDay > 0.3 && lighting.timeOfDay < 0.7) {
      mountainBrightness += 20; // Mais claro durante o dia
    }
    
    bctx.fillStyle = `rgb(${mountainBrightness}, ${mountainBrightness}, ${mountainBrightness + 10})`;
    
    // Desenhar montanha
    bctx.beginPath();
    bctx.moveTo(mountainX, horizonY);
    bctx.lineTo(mountainX + mountainWidth/2, horizonY - mountainHeight);
    bctx.lineTo(mountainX + mountainWidth, horizonY);
    bctx.closePath();
    bctx.fill();
    
    // Neve no topo (apenas para montanhas maiores)
    if (mountainHeight > 30) {
      const snowHeight = mountainHeight / 4;
      bctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
      
      bctx.beginPath();
      bctx.moveTo(mountainX + mountainWidth/2 - snowHeight, horizonY - mountainHeight + snowHeight);
      bctx.lineTo(mountainX + mountainWidth/2, horizonY - mountainHeight);
      bctx.lineTo(mountainX + mountainWidth/2 + snowHeight, horizonY - mountainHeight + snowHeight);
      bctx.closePath();
      bctx.fill();
    }
  }
}

// Sistema de partículas para efeitos climáticos
function renderWeatherEffects() {
  // Verificar se weatherEffects está inicializado
  if (typeof window.weatherEffects === 'undefined') {
    window.weatherEffects = {
      particles: [],
      lastUpdate: Date.now(),
      currentWeather: 'clear' // clear, rain, snow, fog
    };
  }
  
  // Atualizar clima atual baseado no lighting.weather
  if (lighting && lighting.weather !== weatherEffects.currentWeather) {
    weatherEffects.currentWeather = lighting.weather;
    weatherEffects.particles = []; // Limpar partículas ao mudar de clima
  }
  
  // Decidir o clima atual se não for especificado
  if (!weatherEffects.currentWeather || weatherEffects.currentWeather === 'clear') {
    // 10% de chance de mudar para outro clima a cada 30 segundos
    if (Math.random() < 0.0003) {
      const weathers = ['clear', 'rain', 'fog', 'snow'];
      const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
      weatherEffects.currentWeather = randomWeather;
      lighting.weather = randomWeather;
      
      // Gerar vento aleatório
      lighting.wind = {
        x: (Math.random() - 0.5) * 0.2,
        y: Math.random() * 0.1
      };
      
      console.log(`Clima mudou para: ${weatherEffects.currentWeather}`);
    }
  }
  
  // Atualizar partículas existentes
  for (let i = weatherEffects.particles.length - 1; i >= 0; i--) {
    const particle = weatherEffects.particles[i];
    
    // Atualizar posição
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // Aplicar vento
    if (lighting && lighting.wind) {
      particle.x += lighting.wind.x * particle.windFactor;
      particle.y += lighting.wind.y * particle.windFactor;
    }
    
    // Verificar se saiu da tela
    if (particle.x < -10 || particle.x > BASE_W + 10 || 
        particle.y < -10 || particle.y > BASE_H + 10) {
      
      // Reposicionar partícula
      resetWeatherParticle(particle);
    }
    
    // Renderizar partícula
    renderWeatherParticle(particle);
    
    // Reduzir tempo de vida
    particle.life -= 1;
    if (particle.life <= 0) {
      weatherEffects.particles.splice(i, 1);
    }
  }
  
  // Adicionar novas partículas conforme o clima
  const maxParticles = {
    'clear': 5,   // Algumas folhas voando
    'rain': 100,  // Chuva intensa
    'snow': 50,   // Neve moderada
    'fog': 20     // Névoa leve
  };
  
  // Gerar novas partículas
  if (weatherEffects.particles.length < maxParticles[weatherEffects.currentWeather]) {
    for (let i = 0; i < 5; i++) {
      createWeatherParticle(weatherEffects.currentWeather);
    }
  }
  
  // Efeito de overlay baseado no clima
  applyWeatherOverlay(weatherEffects.currentWeather);
}

// Criar uma nova partícula de clima
function createWeatherParticle(weatherType) {
  let particle = {
    type: weatherType,
    x: Math.random() * BASE_W,
    y: 0,
    vx: 0,
    vy: 0,
    size: 1,
    color: '#ffffff',
    windFactor: 1,
    life: 100
  };
  
  // Configurar baseado no tipo de clima
  switch (weatherType) {
    case 'rain':
      particle.y = -10;
      particle.x = Math.random() * (BASE_W + 50) - 25;
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = 5 + Math.random() * 3;
      particle.size = 1;
      particle.length = 5 + Math.random() * 5;
      particle.color = '#8BA7BC';
      particle.windFactor = 0.3;
      particle.life = 100;
      break;
      
    case 'snow':
      particle.y = -10;
      particle.x = Math.random() * BASE_W;
      particle.vx = (Math.random() - 0.5) * 0.2;
      particle.vy = 0.5 + Math.random() * 0.5;
      particle.size = 1 + Math.random() * 2;
      particle.color = '#FFFFFF';
      particle.windFactor = 1.5;
      particle.wobble = Math.random() * Math.PI * 2;
      particle.wobbleSpeed = (Math.random() - 0.5) * 0.05;
      particle.life = 200 + Math.random() * 100;
      break;
      
    case 'fog':
      particle.x = Math.random() * BASE_W;
      particle.y = BASE_H - 20 + Math.random() * 40;
      particle.vx = (Math.random() - 0.5) * 0.1;
      particle.vy = -0.05 - Math.random() * 0.05;
      particle.size = 20 + Math.random() * 30;
      particle.color = '#E6E6FA';
      particle.opacity = 0.1 + Math.random() * 0.1;
      particle.windFactor = 0.8;
      particle.life = 300 + Math.random() * 200;
      break;
      
    case 'clear':
    default:
      // Folhas voando ocasionalmente
      particle.y = Math.random() * BASE_H;
      particle.x = -10;
      particle.vx = 0.2 + Math.random() * 0.3;
      particle.vy = (Math.random() - 0.5) * 0.2;
      particle.size = 2 + Math.random() * 2;
      particle.color = Math.random() < 0.5 ? '#5D9300' : '#FF7777';
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.05;
      particle.windFactor = 1.5;
      particle.life = 200 + Math.random() * 100;
      break;
  }
  
  weatherEffects.particles.push(particle);
  return particle;
}

// Reposicionar uma partícula de clima
function resetWeatherParticle(particle) {
  switch (particle.type) {
    case 'rain':
      particle.y = -10;
      particle.x = Math.random() * BASE_W;
      particle.life = 100;
      break;
      
    case 'snow':
      particle.y = -10;
      particle.x = Math.random() * BASE_W;
      particle.life = 200 + Math.random() * 100;
      break;
      
    case 'fog':
      // Reposicionar névoa aleatoriamente
      if (Math.random() < 0.5) {
        particle.x = Math.random() < 0.5 ? -10 : BASE_W + 10;
        particle.y = Math.random() * BASE_H;
      } else {
        particle.x = Math.random() * BASE_W;
        particle.y = Math.random() < 0.5 ? -10 : BASE_H + 10;
      }
      particle.life = 300 + Math.random() * 200;
      break;
      
    case 'clear':
    default:
      particle.y = Math.random() * BASE_H;
      particle.x = -10;
      particle.life = 200 + Math.random() * 100;
      break;
  }
}

// Renderizar uma partícula de clima
function renderWeatherParticle(particle) {
  // Calcular iluminação na posição da partícula
  const lightLevel = calculateTileLighting(
    player.worldX + (particle.x - BASE_W/2) * 2, 
    player.worldY + (particle.y - BASE_H/2) * 2, 
    lighting.ambientLight
  );
  
  // Salvar contexto atual
  bctx.save();
  
  // Renderizar baseado no tipo
  switch (particle.type) {
    case 'rain':
      // Gota de chuva
      bctx.strokeStyle = applyLighting(particle.color, lightLevel);
      bctx.globalAlpha = 0.7;
      bctx.lineWidth = 1;
      
      bctx.beginPath();
      bctx.moveTo(particle.x, particle.y);
      bctx.lineTo(particle.x + particle.vx * 1.5, particle.y + particle.length);
      bctx.stroke();
      
      // Ocasionalmente criar respingo
      if (particle.y > BASE_H - 10 && Math.random() < 0.1) {
        bctx.fillStyle = applyLighting('#8BA7BC', lightLevel * 0.5);
        bctx.fillRect(particle.x - 1, BASE_H - 2, 2, 1);
      }
      break;
      
    case 'snow':
      // Movimento de oscilação para a neve
      if (particle.wobble !== undefined) {
        particle.wobble += particle.wobbleSpeed;
        const wobbleX = Math.sin(particle.wobble) * 1.5;
        particle.x += wobbleX * 0.1;
      }
      
      // Floco de neve
      bctx.fillStyle = applyLighting(particle.color, lightLevel);
      bctx.globalAlpha = 0.8;
      
      bctx.beginPath();
      bctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      bctx.fill();
      break;
      
    case 'fog':
      // Névoa
      const fogGradient = bctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      
      fogGradient.addColorStop(0, `rgba(230, 230, 250, ${particle.opacity})`);
      fogGradient.addColorStop(1, 'rgba(230, 230, 250, 0)');
      
      bctx.fillStyle = fogGradient;
      bctx.beginPath();
      bctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      bctx.fill();
      break;
      
    case 'clear':
    default:
      // Folhas voando
      bctx.translate(particle.x, particle.y);
      bctx.rotate(particle.rotation);
      
      bctx.fillStyle = applyLighting(particle.color, lightLevel);
      bctx.globalAlpha = 0.7;
      
      // Forma da folha
      bctx.beginPath();
      bctx.moveTo(0, -particle.size);
      bctx.lineTo(particle.size, 0);
      bctx.lineTo(0, particle.size);
      bctx.lineTo(-particle.size, 0);
      bctx.closePath();
      bctx.fill();
      
      // Atualizar rotação
      particle.rotation += particle.rotationSpeed;
      break;
  }
  
  // Restaurar contexto
  bctx.globalAlpha = 1.0;
  bctx.restore();
}

// Aplicar overlay baseado no clima atual
function applyWeatherOverlay(weatherType) {
  switch (weatherType) {
    case 'rain':
      // Escurecer a tela um pouco
      bctx.fillStyle = 'rgba(20, 20, 50, 0.1)';
      bctx.fillRect(0, 0, BASE_W, BASE_H);
      break;
      
    case 'snow':
      // Clarear um pouco a tela
      bctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      bctx.fillRect(0, 0, BASE_W, BASE_H);
      break;
      
    case 'fog':
      // Overlay de névoa
      const fogGradient = bctx.createRadialGradient(
        BASE_W/2, BASE_H/2, 50,
        BASE_W/2, BASE_H/2, BASE_W*0.8
      );
      
      fogGradient.addColorStop(0, 'rgba(230, 230, 250, 0)');
      fogGradient.addColorStop(1, 'rgba(230, 230, 250, 0.3)');
      
      bctx.fillStyle = fogGradient;
      bctx.fillRect(0, 0, BASE_W, BASE_H);
      break;
  }
}
