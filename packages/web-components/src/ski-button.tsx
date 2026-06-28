import { Button } from '@ski-next/ui';
import type { ButtonProps } from '@ski-next/ui';
import { defineElement, ReactCustomElement } from './react-custom-element';
import type { ProviderElementProps } from './react-custom-element';

export interface SkiButtonElementProps extends ProviderElementProps {
  label?: string;
  type?: ButtonProps['type'];
}

export class SkiButtonElement extends ReactCustomElement<SkiButtonElementProps> {
  static observedAttributes = ['label', 'language', 'theme-mode', 'type'];

  protected getAttributeProps(): SkiButtonElementProps {
    return {
      ...this.readProviderProps(),
      label: this.readStringAttribute('label'),
      type: this.readStringAttribute('type') as ButtonProps['type'],
    };
  }

  protected renderReact(props: SkiButtonElementProps) {
    return (
      <Button
        onClick={() =>
          this.dispatchEvent(
            new CustomEvent('ski-click', {
              bubbles: true,
              composed: true,
            }),
          )
        }
        type={props.type}
      >
        {props.label}
      </Button>
    );
  }
}

export function defineSkiButton(tagName = 'ski-button') {
  defineElement(tagName, SkiButtonElement);
}
