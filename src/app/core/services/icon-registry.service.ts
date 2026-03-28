import { Injectable } from '@angular/core';
import { addIcons } from 'ionicons';
import {
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
  warningOutline,
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
      'checkmark-circle': checkmarkCircle,
      'arrow-undo-outline': arrowUndoOutline,
      'close-outline': closeOutline,
      'volume-mute-outline': volumeMuteOutline,
      'volume-high-outline': volumeHighOutline,
      'musical-notes-outline': musicalNotesOutline,
      'exit-outline': exitOutline,
      'settings-outline': settingsOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
      'calendar-outline': calendarOutline,
      'sunny-outline': sunnyOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'repeat-outline': repeatOutline,
      'star-outline': starOutline,
      'close-circle-outline': closeCircleOutline,
      'warning-outline': warningOutline,
      earth,
    });
  }
}
