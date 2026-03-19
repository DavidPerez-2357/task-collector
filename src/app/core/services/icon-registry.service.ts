import { Injectable } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  // Used in AppComponent and SettingsModalComponent
  checkmarkCircle,
  arrowUndoOutline,
  closeOutline,
  volumeMuteOutline,
  volumeHighOutline,
  musicalNotesOutline,
  exitOutline,
  settingsOutline,
  // Used in ActionPanelComponent
  checkmarkCircleOutline,
  createOutline,
  trashOutline,
  calendarOutline,
  sunnyOutline,
  arrowForwardOutline,
  repeatOutline,
  starOutline,
  closeCircleOutline,
  earth,
} from 'ionicons/icons';

/**
 * Centralizes Ionicons registration for the entire application.
 * All icons must be added here. This service is eagerly initialized
 * during bootstrap via APP_INITIALIZER so icons are available before
 * any component renders.
 *
 * To add a new icon:
 * 1. Import the icon symbol from 'ionicons/icons'.
 * 2. Add it to the addIcons({ ... }) call in the register() method below.
 */
@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  register(): void {
    addIcons({
      checkmarkCircle,
      arrowUndoOutline,
      closeOutline,
      volumeMuteOutline,
      volumeHighOutline,
      musicalNotesOutline,
      exitOutline,
      settingsOutline,
      checkmarkCircleOutline,
      createOutline,
      trashOutline,
      calendarOutline,
      sunnyOutline,
      arrowForwardOutline,
      repeatOutline,
      starOutline,
      closeCircleOutline,
      earth,
    });
  }
}
