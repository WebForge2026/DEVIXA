import { Link as RouterLink, type LinkProps as RouterLinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';

/** Drop-in replacement for next/link: keeps the `href` prop, routes via react-router. */
export type LinkProps = Omit<RouterLinkProps, 'to'> & { href: string; children?: ReactNode };

const Link = ({ href, children, ...rest }: LinkProps) => (
  <RouterLink to={href} {...rest}>
    {children}
  </RouterLink>
);

export default Link;
