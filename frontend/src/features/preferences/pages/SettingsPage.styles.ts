// The styled components of SettingsPage.tsx (styled-components). The component file keeps the logic and the JSX.
import styled from 'styled-components';

export const Fieldset = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(4)};
  margin: 0;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};

  legend {
    padding: 0 ${({ theme }) => theme.space(1)};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
  }
`;
