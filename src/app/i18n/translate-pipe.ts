import { Pipe, PipeTransform, inject } from '@angular/core';
import { Language, TranslationParameters } from './language';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {

  private readonly language = inject(Language);

  transform(value: string | null | undefined, parameters?: TranslationParameters): string {
    return this.language.translate(value, parameters);
  }
}
