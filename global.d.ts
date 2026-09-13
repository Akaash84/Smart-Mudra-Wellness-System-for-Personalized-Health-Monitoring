import type { AnchorHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module "next/link" {
  type LinkProps = {
    href: string;
    className?: string;
    children?: ReactNode;
  } & Omit<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, "href">;

  export default function Link(props: LinkProps): JSX.Element;
}

declare module "*.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

export {};
