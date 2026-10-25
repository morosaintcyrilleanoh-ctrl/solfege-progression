import { Hero } from '../sections/Hero';
import { Bandeau } from '../components/Bandeau';
import { Formateur } from '../sections/Formateur';
import { Catalogue } from '../sections/Catalogue';
import { Communaute } from '../sections/Communaute';
import { Videos } from '../sections/Videos';
import { Temoignages } from '../sections/Temoignages';
import { Tarifs } from '../sections/Tarifs';
import { Faq } from '../sections/Faq';
import { AppelAction } from '../sections/AppelAction';

/** Ordre des sections de la page d'accueil : réorganisez-les librement. */
export function Accueil() {
  return (
    <>
      <Hero />
      <Bandeau />
      <Formateur />
      <Catalogue />
      <Communaute />
      <Videos />
      <Temoignages />
      <Tarifs />
      <Faq />
      <AppelAction />
    </>
  );
}
