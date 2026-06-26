import { Button as AntButton, type ButtonProps as AntButtonProps } from 'antd';
import { useUiTranslation } from '../../../i18n';

export interface ButtonProps extends Omit<AntButtonProps, 'children'> {
  children?: AntButtonProps['children'];
}

export function Button({ children, ...rest }: ButtonProps) {
  const { t } = useUiTranslation();

  return (
    <AntButton {...rest}>{children ?? t('button.submit')}</AntButton>
  );
}
