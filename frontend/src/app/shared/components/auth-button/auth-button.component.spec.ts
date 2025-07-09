import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthButtonComponent } from './auth-button.component';
import { By } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

describe('AuthButtonComponent', () => {
  let component: AuthButtonComponent;
  let fixture: ComponentFixture<AuthButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthButtonComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthButtonComponent);
    component = fixture.componentInstance;
  });

  it('deve exibir botão de login se não autenticado', () => {
    component.isAuthenticated = false;
    component.abrirLogin = jasmine.createSpy('abrirLogin');
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.auth-btn'));
    expect(btn).toBeTruthy();
    btn.nativeElement.click();
    expect(component.abrirLogin).toHaveBeenCalled();
  });

  it('deve exibir menu de usuário se autenticado', () => {
    component.isAuthenticated = true;
    component.user = { name: 'Ash', firstName: 'Ash', email: 'ash@poke.com', id: '1', level: 1 };
    component.toggleUserMenu = jasmine.createSpy('toggleUserMenu');
    component.showUserMenu = false;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.auth-btn'));
    expect(btn).toBeTruthy();
    btn.nativeElement.click();
    expect(component.toggleUserMenu).toHaveBeenCalled();
  });

  it('deve chamar abrirPerfil ao clicar no item de perfil', () => {
    component.isAuthenticated = true;
    component.user = { name: 'Ash', firstName: 'Ash', email: 'ash@poke.com', id: '1', level: 1 };
    component.showUserMenu = true;
    component.abrirPerfil = jasmine.createSpy('abrirPerfil');
    component.toggleUserMenu = () => {};
    fixture.detectChanges();
    const perfilItem = fixture.debugElement.queryAll(By.css('ion-item'))[0];
    perfilItem.nativeElement.click();
    expect(component.abrirPerfil).toHaveBeenCalled();
  });
}); 