import { SkiCal } from '@ski-next/ui';
import type {
  SkiCalJourney,
  SkiCalOrientation,
  SkiCalProps,
  SkiCalResource,
} from '@ski-next/ui';
import { defineElement, ReactCustomElement } from './react-custom-element';
import type { ProviderElementProps } from './react-custom-element';

export interface SkiCalElementProps extends ProviderElementProps {
  endDateTime?: string;
  endMinutes?: number;
  journeys: SkiCalJourney[];
  minorMinutes?: number;
  orientation?: SkiCalOrientation;
  resources: SkiCalResource[];
  showOrientationToggle?: boolean;
  startDateTime?: string;
  startMinutes?: number;
  title?: string;
  updatedLabel?: string;
}

function readNumberAttribute(element: HTMLElement, name: string) {
  const value = element.getAttribute(name);

  if (value === null || value === '') {
    return undefined;
  }

  return Number(value);
}

function readBooleanAttribute(element: HTMLElement, name: string) {
  const value = element.getAttribute(name);

  if (value === null) {
    return undefined;
  }

  return value !== 'false';
}

export class SkiCalElement extends ReactCustomElement<SkiCalElementProps> {
  static observedAttributes = [
    'end-date-time',
    'end-minutes',
    'end-time',
    'journeys',
    'language',
    'minor-minutes',
    'orientation',
    'resources',
    'show-orientation-toggle',
    'start-date-time',
    'start-minutes',
    'start-time',
    'theme-mode',
    'title',
    'updated-label',
  ];

  protected getAttributeProps(): SkiCalElementProps {
    return {
      ...this.readProviderProps(),
      endDateTime:
        this.readStringAttribute('end-time') ??
        this.readStringAttribute('end-date-time'),
      endMinutes: readNumberAttribute(this, 'end-minutes'),
      journeys: this.readJsonAttribute<SkiCalJourney[]>('journeys', []),
      minorMinutes: readNumberAttribute(this, 'minor-minutes'),
      orientation: this.readStringAttribute('orientation') as
        | SkiCalOrientation
        | undefined,
      resources: this.readJsonAttribute<SkiCalResource[]>('resources', []),
      showOrientationToggle: readBooleanAttribute(
        this,
        'show-orientation-toggle',
      ),
      startDateTime:
        this.readStringAttribute('start-time') ??
        this.readStringAttribute('start-date-time'),
      startMinutes: readNumberAttribute(this, 'start-minutes'),
      title: this.readStringAttribute('title'),
      updatedLabel: this.readStringAttribute('updated-label'),
    };
  }

  protected renderReact(props: SkiCalElementProps) {
    const skiCalProps: SkiCalProps = {
      endDateTime: props.endDateTime,
      endMinutes: props.endMinutes,
      journeys: props.journeys,
      minorMinutes: props.minorMinutes,
      onJourneyChange: (journey) => {
        this.dispatchEvent(
          new CustomEvent<SkiCalJourney>('ski-journey-change', {
            bubbles: true,
            composed: true,
            detail: journey,
          }),
        );
      },
      onOrientationChange: (orientation) => {
        this.setAttribute('orientation', orientation);
        this.dispatchEvent(
          new CustomEvent<SkiCalOrientation>('ski-orientation-change', {
            bubbles: true,
            composed: true,
            detail: orientation,
          }),
        );
      },
      onResourceChange: (resource) => {
        this.dispatchEvent(
          new CustomEvent<SkiCalResource>('ski-resource-change', {
            bubbles: true,
            composed: true,
            detail: resource,
          }),
        );
      },
      orientation: props.orientation,
      resources: props.resources,
      showOrientationToggle: props.showOrientationToggle,
      startDateTime: props.startDateTime,
      startMinutes: props.startMinutes,
      title: props.title,
      updatedLabel: props.updatedLabel,
    };

    return <SkiCal {...skiCalProps} />;
  }
}

export function defineSkiCal(tagName = 'ski-cal') {
  defineElement(tagName, SkiCalElement);
}
