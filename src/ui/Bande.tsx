import type { ReactNode } from 'react';
import styles from './Bande.module.css';

interface BandeProps {
  children: ReactNode;
  serre?: boolean;
}

/** Bande de contenu (§6, `.bande`) : fond papier, filet supérieur d'encre. */
export function Bande({ children, serre = false }: BandeProps) {
  return <section className={serre ? `${styles.bande} ${styles.serre}` : styles.bande}>{children}</section>;
}
