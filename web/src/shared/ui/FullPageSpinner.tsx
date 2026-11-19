import { VStack } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';

export function FullPageSpinner({ label }: { label: string }) {
  return (
    <VStack height="100%" hAlign="center" vAlign="center">
      <Spinner label={label} />
    </VStack>
  );
}
