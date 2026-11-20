// Astryx LinkProvider에 끼울 링크: href를 React Router의 to로 넘겨 페이지를 새로 읽지 않고 이동한다.
import type { ComponentPropsWithoutRef, Ref } from 'react';
import { Link } from 'react-router';

type RouterLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href?: string;
  ref?: Ref<HTMLAnchorElement>;
};

export function RouterLink({ href = '', ref, ...rest }: RouterLinkProps) {
  const isExternal = /^[a-z][a-z\d+.-]*:/i.test(href);
  if (isExternal) return <a ref={ref} href={href} target="_blank" rel="noreferrer" {...rest} />;
  return <Link ref={ref} to={href} {...rest} />;
}
