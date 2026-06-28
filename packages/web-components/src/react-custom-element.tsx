import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { AppProvider } from '@ski-next/ui';
import type { AppThemeMode, SupportedLanguage } from '@ski-next/ui';

export interface ProviderElementProps {
  language?: SupportedLanguage;
  themeMode?: AppThemeMode;
}

export abstract class ReactCustomElement<
  TProps extends ProviderElementProps,
> extends HTMLElement {
  private mountPoint?: HTMLDivElement;
  private root?: Root;
  private propertyProps: Partial<TProps> = {};

  set props(value: Partial<TProps>) {
    this.propertyProps = value;
    this.renderElement();
  }

  get props() {
    return this.propertyProps;
  }

  connectedCallback() {
    this.renderElement();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
    this.mountPoint = undefined;
  }

  attributeChangedCallback() {
    this.renderElement();
  }

  protected getMergedProps(): TProps {
    return {
      ...this.getAttributeProps(),
      ...this.propertyProps,
    };
  }

  protected renderWithProvider(children: ReactElement) {
    const props = this.getMergedProps();

    return (
      <AppProvider
        language={props.language ?? 'en'}
        themeMode={props.themeMode ?? 'default'}
      >
        {children}
      </AppProvider>
    );
  }

  protected readStringAttribute(name: string) {
    return this.getAttribute(name) ?? undefined;
  }

  protected readJsonAttribute<TValue>(name: string, fallback: TValue): TValue {
    const value = this.getAttribute(name);

    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as TValue;
    } catch {
      return fallback;
    }
  }

  protected readProviderProps(): ProviderElementProps {
    return {
      language: this.readStringAttribute('language') as
        | SupportedLanguage
        | undefined,
      themeMode: this.readStringAttribute('theme-mode') as
        | AppThemeMode
        | undefined,
    };
  }

  protected abstract getAttributeProps(): TProps;

  protected abstract renderReact(props: TProps): ReactElement;

  private renderElement() {
    if (!this.isConnected) {
      return;
    }

    if (!this.mountPoint) {
      this.mountPoint = document.createElement('div');
      this.replaceChildren(this.mountPoint);
    }

    this.root ??= createRoot(this.mountPoint);
    this.root.render(this.renderWithProvider(this.renderReact(this.getMergedProps())));
  }
}

export function defineElement(
  tagName: string,
  elementConstructor: CustomElementConstructor,
) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementConstructor);
  }
}
