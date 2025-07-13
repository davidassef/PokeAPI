import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { PokemonCardComponent } from './pokemon-card/pokemon-card.component';
import { PokemonRankCardComponent } from './pokemon-rank-card/pokemon-rank-card.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { ErrorNotificationComponent } from './error-notification/error-notification.component';
import { AuthButtonComponent } from './auth-button/auth-button.component';
import { AuthModalNewComponent } from './auth-modal-new/auth-modal-new.component';
import { UserProfileModalComponent } from './user-profile-modal/user-profile-modal.component';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';
import { AccountSettingsModalComponent } from './account-settings-modal/account-settings-modal.component';
import { AdminPokemonModalComponent } from './admin-pokemon-modal/admin-pokemon-modal.component';
import { PokemonDetailsMobileComponent } from './pokemon-details-mobile/pokemon-details-mobile.component';
import { CacheStatsComponent } from './cache-stats/cache-stats.component';
// import { MusicPlayerSidemenuComponent } from './music-player-sidemenu/music-player-sidemenu.component';


// Shared Modules
import { SharedPipesModule } from '../pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../directives/shared-directives.module';

@NgModule({
  declarations: [
    PokemonCardComponent,
    PokemonRankCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent,
    ErrorNotificationComponent,
    AuthButtonComponent,
    AuthModalNewComponent,
    UserProfileModalComponent,
    ProfileModalComponent,
    AccountSettingsModalComponent,
    AdminPokemonModalComponent,
    PokemonDetailsMobileComponent,
    CacheStatsComponent
    // MusicPlayerSidemenuComponent
  ],  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    SharedPipesModule,
    SharedDirectivesModule
  ],
  exports: [
    PokemonCardComponent,
    PokemonRankCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent,
    ErrorNotificationComponent,
    AuthButtonComponent,
    AuthModalNewComponent,
    UserProfileModalComponent,
    ProfileModalComponent,
    AccountSettingsModalComponent,
    AdminPokemonModalComponent,
    PokemonDetailsMobileComponent,
    CacheStatsComponent,
    // MusicPlayerSidemenuComponent,
    SharedPipesModule,
    SharedDirectivesModule,
    TranslateModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedComponentsModule { }
