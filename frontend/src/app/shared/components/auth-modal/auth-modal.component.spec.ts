import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthModalComponent } from './auth-modal.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

describe('AuthModalComponent', () => {
  let component: AuthModalComponent;
  let fixture: ComponentFixture<AuthModalComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register', 'loginWithGoogle']);
    await TestBed.configureTestingModule({
      declarations: [AuthModalComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();
    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
  });

  it('deve alternar entre login e registro', () => {
    expect(component.modo).toBe('login');
    component.alternarModo();
    expect(component.modo).toBe('register');
    component.alternarModo();
    expect(component.modo).toBe('login');
  });

  it('deve chamar login do AuthService', () => {
    component.email = 'a@b.com';
    component.senha = '123';
    authServiceSpy.login.and.returnValue(of({}));
    spyOn(component, 'fechar');
    component.login();
    expect(authServiceSpy.login).toHaveBeenCalledWith('a@b.com', '123');
    expect(component.fechar).toHaveBeenCalled();
  });

  it('deve chamar register do AuthService', () => {
    component.modo = 'register';
    component.email = 'a@b.com';
    component.senha = '123';
    component.nome = 'Ash';
    authServiceSpy.register.and.returnValue(of({}));
    component.registrar();
    expect(authServiceSpy.register).toHaveBeenCalledWith({ email: 'a@b.com', senha: '123', nome: 'Ash' });
    expect(component.modo).toBe('login');
  });

  it('deve emitir evento closed ao fechar', () => {
    spyOn(component.closed, 'emit');
    component.fechar();
    expect(component.closed.emit).toHaveBeenCalled();
  });
}); 