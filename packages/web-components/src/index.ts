import '@ski-next/ui/style.css';
import { defineSkiButton } from './ski-button';
import { defineSkiCal } from './ski-cal';

export {
  defineSkiButton,
  SkiButtonElement,
  type SkiButtonElementProps,
} from './ski-button';
export {
  defineSkiCal,
  SkiCalElement,
  type SkiCalElementProps,
} from './ski-cal';

export interface DefineSkiNextElementsOptions {
  prefix?: string;
}

export function defineSkiNextElements({
  prefix = 'ski',
}: DefineSkiNextElementsOptions = {}) {
  defineSkiButton(`${prefix}-button`);
  defineSkiCal(`${prefix}-cal`);
}

defineSkiNextElements();
