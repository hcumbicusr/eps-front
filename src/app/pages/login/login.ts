import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'sidi-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-layout">
      <section class="login-hero">
        <div class="login-top"><div class="login-identity"><span>◉</span><b>SIDI · GESTIÓN HÍDRICA & OPERACIONES</b></div><span class="hero-badge">● SIDI 2026 · Entorno de demostración</span></div>
        <div class="login-hero-copy"><span class="eyebrow light">⚡ PLATAFORMA PARA SERVICIOS DE SANEAMIENTO</span><h1>SISTEMA INTELIGENTE<br>DE DETECCIÓN DE<br>IRREGULARIDADES<br><span>SIDI</span></h1><p>Prototipo institucional para el monitoreo predictivo y la priorización de consumos atípicos de agua potable.</p><div class="hero-bullets"><span>◉ Análisis de datos</span><span>◉ Modelos predictivos</span><span>◉ Gestión de alertas</span></div></div>
        <div class="login-bottom"><span>SIDI © 2026 · Proyecto de investigación</span><span>Datos de demostración · No productivo</span></div>
      </section>
      <section class="login-form-col"><form (ngSubmit)="enter()" class="login-panel"><span class="eyebrow">ACCESO A LA DEMOSTRACIÓN</span><h2>Iniciar sesión</h2><p>Accede a los dashboards en modo demostrativo.</p><label for="user">Usuario o correo institucional</label><input id="user" name="user" type="email" autocomplete="username" placeholder="demo@sidi.local" [(ngModel)]="user" required /><label for="password">Contraseña</label><div class="password-wrap"><input id="password" name="password" [type]="showPassword() ? 'text' : 'password'" autocomplete="current-password" placeholder="Solo referencia visual" [(ngModel)]="password" /><button type="button" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'">{{ showPassword() ? 'Ocultar' : 'Mostrar' }}</button></div><div class="demo-disclaimer">Esta pantalla no autentica usuarios. La autenticación real se implementará en una etapa posterior.</div><button class="primary-button login-submit" type="submit">Entrar al sistema SIDI →</button><div class="login-links">Manual de usuario SIDI <span>·</span> Soporte del proyecto</div><small class="login-footnote">La información mostrada no representa una operación real de una EPS.</small></form></section>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly router = inject(Router);
  user = 'demo@sidi.local';
  password = '';
  showPassword = signal(false);
  enter(): void { void this.router.navigateByUrl('/estrategico'); }
}
