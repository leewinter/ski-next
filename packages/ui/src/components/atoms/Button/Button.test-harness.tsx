import { useState } from 'react';
import { Button } from './Button';

export function ButtonClickHarness() {
  const [clicked, setClicked] = useState(false);

  return (
    <>
      <Button type="primary" onClick={() => setClicked(true)} />
      <span>{clicked ? 'Clicked' : 'Waiting'}</span>
    </>
  );
}
