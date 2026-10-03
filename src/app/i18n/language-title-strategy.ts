import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Language } from './language';

@Injectable()
export class LanguageTitleStrategy extends TitleStrategy {
  private readonly language = inject(Language);
  private readonly title = inject(Title);
  private readonly routeTitle = signal('Home');

  constructor() {
    super();
    effect(() => this.title.setTitle(`${this.language.translate(this.routeTitle())} · Foody Clear`));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.routeTitle.set(this.buildTitle(snapshot) ?? 'Home');
  }
}
