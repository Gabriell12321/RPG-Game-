import pygame
import sys

# Base resolution (small) to achieve pixelated look when scaled up
BASE_W, BASE_H = 320, 180
SCALE = 3
SCREEN_W, SCREEN_H = BASE_W * SCALE, BASE_H * SCALE

FPS = 60

MENU_OPTIONS = ["Iniciar", "Sair"]


def draw_pixel_background(surface):
    # Simple tile-based gradient with slight color jitter for a pixel art feel
    tile = 8
    for y in range(0, BASE_H, tile):
        for x in range(0, BASE_W, tile):
            # gradient from dark teal to light teal based on y
            t = y / BASE_H
            r = int(12 + 20 * t)
            g = int(30 + 110 * t)
            b = int(40 + 100 * t)
            # small deterministic jitter so it looks hand-made
            jitter = ((x * 31) ^ (y * 17)) % 12 - 6
            color = (max(0, min(255, r + jitter)), max(0, min(255, g + jitter)), max(0, min(255, b + jitter)))
            pygame.draw.rect(surface, color, (x, y, tile, tile))

    # Add a simple pixel sun (circle approximated by filled rectangles)
    sx, sy = BASE_W - 48, 32
    sun_colors = [(255, 210, 60), (255, 240, 120)]
    for i, col in enumerate(sun_colors):
        radius = 14 - i * 4
        for yy in range(-radius, radius + 1):
            for xx in range(-radius, radius + 1):
                if xx * xx + yy * yy <= radius * radius:
                    surface.set_at((sx + xx, sy + yy), col)


class TitleScreen:
    def __init__(self, screen):
        self.screen = screen
        self.base = pygame.Surface((BASE_W, BASE_H))
        self.font = pygame.font.SysFont('consolas', 18)
        self.big_font = pygame.font.SysFont('consolas', 28, bold=True)
        self.selected = 0
        self.tick = 0

    def handle_event(self, ev):
        if ev.type == pygame.KEYDOWN:
            if ev.key in (pygame.K_UP, pygame.K_w):
                self.selected = (self.selected - 1) % len(MENU_OPTIONS)
            elif ev.key in (pygame.K_DOWN, pygame.K_s):
                self.selected = (self.selected + 1) % len(MENU_OPTIONS)
            elif ev.key in (pygame.K_RETURN, pygame.K_KP_ENTER):
                return MENU_OPTIONS[self.selected]
        return None

    def update(self, dt):
        self.tick += dt

    def render(self):
        # draw background
        draw_pixel_background(self.base)

        # overlay a vignette
        for i in range(6):
            alpha = int(10 + i * 6)
            s = pygame.Surface((BASE_W, BASE_H), pygame.SRCALPHA)
            pygame.draw.rect(s, (0, 0, 0, alpha), (i * 2, i * 2, BASE_W - i * 4, BASE_H - i * 4), border_radius=0)
            self.base.blit(s, (0, 0))

        # title
        title_surf = self.big_font.render("Jogo RPG", True, (255, 245, 200))
        title_x = (BASE_W - title_surf.get_width()) // 2
        self.base.blit(title_surf, (title_x, 18))

        # subtitle / pulse
        pulse = 1 + 0.05 * (1 + pygame.math.sin(self.tick * 0.01))
        sub = self.font.render("Um jogo em pixel - press Enter", True, (220, 220, 220))
        sub = pygame.transform.rotozoom(sub, 0, pulse)
        sub_x = (BASE_W - sub.get_width()) // 2
        self.base.blit(sub, (sub_x, 56))

        # menu
        start_y = 96
        for i, opt in enumerate(MENU_OPTIONS):
            is_sel = (i == self.selected)
            color = (255, 255, 200) if is_sel else (230, 230, 230)
            txt = self.font.render(opt, True, color)
            x = (BASE_W - txt.get_width()) // 2
            y = start_y + i * 22
            if is_sel:
                # draw a pixel frame behind
                pygame.draw.rect(self.base, (30, 30, 40), (x - 6, y - 2, txt.get_width() + 12, txt.get_height() + 4))
                pygame.draw.rect(self.base, (80, 160, 200), (x - 6, y - 2, txt.get_width() + 12, txt.get_height() + 4), 1)
            self.base.blit(txt, (x, y))

        # scale up and blit to main screen
        scaled = pygame.transform.scale(self.base, (SCREEN_W, SCREEN_H))
        self.screen.blit(scaled, (0, 0))


def main():
    pygame.init()
    clock = pygame.time.Clock()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    pygame.display.set_caption("Tela Inicial - Jogo RPG")

    title = TitleScreen(screen)

    running = True
    state = 'menu'
    message_timer = 0.0

    while running:
        dt_ms = clock.tick(FPS)
        dt = dt_ms
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                running = False
            elif state == 'menu':
                res = title.handle_event(ev)
                if res == 'Iniciar':
                    state = 'starting'
                    message_timer = 1500  # ms
                elif res == 'Sair':
                    running = False

        if state == 'menu':
            title.update(dt)
            title.render()
        elif state == 'starting':
            # show a small loading message then exit (placeholder for your game start)
            title.base.fill((10, 10, 12))
            msg = title.font.render("Carregando...", True, (240, 240, 240))
            title.base.blit(msg, ((BASE_W - msg.get_width()) // 2, BASE_H // 2))
            scaled = pygame.transform.scale(title.base, (SCREEN_W, SCREEN_H))
            screen.blit(scaled, (0, 0))
            message_timer -= dt_ms
            if message_timer <= 0:
                # For now just show a simple screen then quit
                running = False

        pygame.display.flip()

    pygame.quit()
    sys.exit()


if __name__ == '__main__':
    main()
