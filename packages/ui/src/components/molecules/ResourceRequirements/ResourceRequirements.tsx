import {
  CarryOutOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { useUiTranslation } from '../../../i18n';
import './ResourceRequirements.css';

export type ResourceRequirementKind =
  | 'passenger'
  | 'babySeat'
  | 'boosterSeat'
  | 'luggage'
  | 'skiBag'
  | 'note';

export interface ResourceRequirement {
  id: string;
  kind: ResourceRequirementKind;
  quantity: number;
  label?: string;
}

export interface ResourceRequirementsProps {
  requirements: ResourceRequirement[];
}

const requirementIcons: Record<ResourceRequirementKind, ReactNode> = {
  babySeat: <SafetyOutlined />,
  boosterSeat: <UserOutlined />,
  luggage: <ShoppingOutlined />,
  note: <InfoCircleOutlined />,
  passenger: <TeamOutlined />,
  skiBag: <CarryOutOutlined />,
};

export function ResourceRequirements({
  requirements,
}: ResourceRequirementsProps) {
  const { t } = useUiTranslation();
  const visibleRequirements = requirements.filter(
    (requirement) => requirement.quantity > 0,
  );

  if (!visibleRequirements.length) {
    return null;
  }

  function getRequirementLabel(requirement: ResourceRequirement) {
    return (
      requirement.label ??
      t(`resourceRequirements.kinds.${requirement.kind}`)
    );
  }

  return (
    <div
      aria-label={t('resourceRequirements.label')}
      className="resource-requirements"
      tabIndex={0}
    >
      <div className="resource-requirements__summary">
        {visibleRequirements.map((requirement) => (
          <span
            className="resource-requirements__item"
            key={requirement.id}
            title={`${getRequirementLabel(requirement)} x ${
              requirement.quantity
            }`}
          >
            <span
              aria-hidden="true"
              className="resource-requirements__icon"
            >
              {requirementIcons[requirement.kind]}
            </span>
            <span className="resource-requirements__count">
              x {requirement.quantity}
            </span>
          </span>
        ))}
      </div>

      <div className="resource-requirements__detail">
        {visibleRequirements.map((requirement) => (
          <div className="resource-requirements__detail-row" key={requirement.id}>
            <span aria-hidden="true" className="resource-requirements__icon">
              {requirementIcons[requirement.kind]}
            </span>
            <span className="resource-requirements__detail-label">
              {getRequirementLabel(requirement)}
            </span>
            <span className="resource-requirements__detail-count">
              x {requirement.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
