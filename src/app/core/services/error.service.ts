import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private messageSubject = new BehaviorSubject<string | null>(null);

  readonly error$: Observable<string | null> = this.messageSubject.asObservable();

  constructor() {}

  show(message: string): void {
    this.messageSubject.next(message);
  }

  clear(): void {
    this.messageSubject.next(null);
  }

  isError(): boolean {
    return this.messageSubject.getValue() !== null;
  }

  currentMessage(): string | null {
    return this.messageSubject.getValue();
  }
}
