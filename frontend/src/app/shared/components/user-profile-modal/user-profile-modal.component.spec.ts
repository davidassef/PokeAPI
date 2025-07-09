import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileModalComponent } from './user-profile-modal.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { User } from 'src/app/models/user.model';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

describe('UserProfileModalComponent', () => {
  let component: UserProfileModalComponent;
  let fixture: ComponentFixture<UserProfileModalComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const user: User = { id: '1', name: 'Ash', firstName: 'Ash', email: 'ash@poke.com', level: 1 };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['updateProfile']);
    await TestBed.configureTestingModule({
      declarations: [UserProfileModalComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();
    fixture = TestBed.createComponent(UserProfileModalComponent);
    component = fixture.componentInstance;
    component.user = user;
    component.ngOnInit();
  });

  it('deve exibir dados do usuário', () => {
    expect(component.nome).toBe('Ash');
    expect(component.email).toBe('ash@poke.com');
  });

  it('deve alternar para modo de edição', () => {
    component.editar();
    expect(component.editando).toBeTrue();
  });

  it('deve chamar updateProfile ao salvar', () => {
    component.editando = true;
    component.nome = 'Misty';
    component.email = 'misty@poke.com';
    authServiceSpy.updateProfile.and.returnValue(of({}));
    component.salvar();
    expect(authServiceSpy.updateProfile).toHaveBeenCalledWith({ nome: 'Misty', email: 'misty@poke.com' });
    expect(component.editando).toBeFalse();
  });

  it('deve emitir evento closed ao fechar', () => {
    spyOn(component.closed, 'emit');
    component.fechar();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('deve emitir evento logout ao sair', () => {
    spyOn(component.logout, 'emit');
    spyOn(component, 'fechar');
    component.sair();
    expect(component.logout.emit).toHaveBeenCalled();
    expect(component.fechar).toHaveBeenCalled();
  });
}); 