import {
  CATEGORIE_MOTO,
  type CategoriaMoto,
  etichettaCategoria,
} from '@/lib/categorie-moto';

/** Foto rappresentative per categoria (Wikimedia Commons — sostituibili in /public/moto-categorie/). */
export const FOTO_CATEGORIA: Record<CategoriaMoto, string> = {
  naked: '/moto-categorie/naked.jpg',
  sportiva: '/moto-categorie/sportiva.jpg',
  touring: '/moto-categorie/touring.jpg',
  adventure: '/moto-categorie/adventure.jpg',
  custom: '/moto-categorie/custom.jpg',
  cafe_racer: '/moto-categorie/cafe_racer.jpg',
  enduro: '/moto-categorie/enduro.jpg',
  scooter: '/moto-categorie/scooter.jpg',
  vintage: '/moto-categorie/vintage.jpg',
  altro: '/moto-categorie/altro.jpg',
};

const FOTO_CATEGORIA_REMOTE: Record<CategoriaMoto, string> = {
  naked: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ducati_Monster_1200_R.jpg/960px-Ducati_Monster_1200_R.jpg',
  sportiva: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ducati_1299_Panigale.jpg/960px-Ducati_1299_Panigale.jpg',
  touring: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/BMW_R1250RT.jpg/960px-BMW_R1250RT.jpg',
  adventure: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/BMW_R1200GS_Adventure.jpg/960px-BMW_R1200GS_Adventure.jpg',
  custom: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Harley-Davidson_Sportster.jpg/960px-Harley-Davidson_Sportster.jpg',
  cafe_racer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Triumph_Bonneville_T120.jpg/960px-Triumph_Bonneville_T120.jpg',
  enduro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/KTM_450_EXC.jpg/960px-KTM_450_EXC.jpg',
  scooter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Vespa_GTS_300.jpg/960px-Vespa_GTS_300.jpg',
  vintage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Honda_CB750.jpg/960px-Honda_CB750.jpg',
  altro: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Motorcycle_racing.jpg/960px-Motorcycle_racing.jpg',
};

const PAROLE_CATEGORIA: { cat: CategoriaMoto; parole: string[] }[] = [
  { cat: 'sportiva', parole: [
    'panigale', 'desmosedici', '1199', '1299', 'v2', 'v4', '959', '916', '998',
    'cbr', 'fireblade', 'rc213', 'rc8', 'rc390', 'rc125', 'rsv4', 'tuono', 'r1', 'r6', 'r7', 'r9',
    'gsx-r', 'gsxr', 'hayabusa', 'zx-10', 'zx10', 'zx-6', 'zx6', 'ninja h2', 'h2 ',
    's1000rr', 's1000 r', 'f4', 'f3', 'brutale', 'superveloce', 'daytona', 'speed triple rs',
    'sport', 'supersport', 'superbike', 'sbk',
  ]},
  { cat: 'naked', parole: [
    'monster', 'streetfighter', 'mt-07', 'mt07', 'mt-09', 'mt09', 'mt-10', 'mt10', 'tracer',
    'z900', 'z650', 'z1000', 'z h2', 'cb1000', 'cb650', 'cb500', 'duke 790', 'duke 890',
    'duke 390', 'duke 125', 'tuono 660', 'trident', 'street triple', 'speed triple',
    'naked', 'roadster', 'hypermotard', 'superduke',
  ]},
  { cat: 'touring', parole: [
    'gold wing', 'goldwing', 'fjr', 'k1600', 'r1250rt', 'r1200rt', 'nt1100', 'st1300', 'st1100',
    'concours', 'versys 1000', 'multistrada 1260', 'multistrada 950', 'touring', 'gt ',
    'grand tourer', 'burgman 650',
  ]},
  { cat: 'adventure', parole: [
    'africa twin', 'crf1100', 'crf1000', 'tenere', 'ténéré', 'tiger 900', 'tiger 1200',
    'gs 1250', 'r1250gs', 'r1200gs', 'f850gs', 'f750gs', 'f900gs', 'v-strom', 'vstrom',
    'klr', 'versys 650', 'versys-x', 'super ténéré', 'adventure', 'adv ', 'maxi enduro',
    'multistrada v4', '1290 super adventure', '890 adventure', '790 adventure',
  ]},
  { cat: 'custom', parole: [
    'harley', 'softail', 'sportster', 'dyna', 'road king', 'street bob', 'fat bob',
    'indian', 'scout', 'chief', 'shadow', 'virago', 'vulcan', 'rebel 500', 'rebel 1100',
    'bobber', 'cruiser', 'chopper', 'diavel',
  ]},
  { cat: 'cafe_racer', parole: [
    'cafe racer', 'café racer', 'scrambler', 'thruxton', 'bonneville', 'w800', 'w650',
    'r nine', 'rninet', 'interceptor 650', 'continental gt', 'xsr', 'cb1100',
  ]},
  { cat: 'enduro', parole: [
    'enduro', 'motocross', 'mx ', 'yz250', 'yz450', 'crf450', 'crf250', 'kx450', 'kx250',
    'rm-z', 'te300', 'fe350', 'exc ', 'sx ', 'beta rr', 'gasgas', 'cross',
  ]},
  { cat: 'scooter', parole: [
    'scooter', 'vespa', 'piaggio', 'liberty', 'beverly', 'xmax', 'tmax', 'forza',
    'sh350', 'pcx', 'nmax', 'medley', 'sym ', 'maxiscooter',
  ]},
  { cat: 'vintage', parole: [
    'vintage', 'classica', 'classico', 'anni 70', 'anni 80', 'anni 90', 'cb750',
    'z1 ', 'le mans', 'california', 'spessiale',
  ]},
];

export function inferisciCategoriaDaTesto(testo: string): CategoriaMoto | null {
  const norm = testo.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (!norm.trim()) return null;
  for (const { cat, parole } of PAROLE_CATEGORIA) {
    if (parole.some((p) => norm.includes(p))) return cat;
  }
  return null;
}

export function risolviCategoriaMoto(
  categoriaEsplicita: string | null | undefined,
  testoModello: string | null | undefined,
): CategoriaMoto {
  const valide = CATEGORIE_MOTO.map((c) => c.value);
  if (categoriaEsplicita && valide.includes(categoriaEsplicita as CategoriaMoto)) {
    return categoriaEsplicita as CategoriaMoto;
  }
  const inferita = testoModello ? inferisciCategoriaDaTesto(testoModello) : null;
  return inferita ?? 'altro';
}

export function fotoCategoria(categoria: CategoriaMoto, remoto = true): string {
  if (remoto) return FOTO_CATEGORIA_REMOTE[categoria] ?? FOTO_CATEGORIA_REMOTE.altro;
  return FOTO_CATEGORIA[categoria] ?? FOTO_CATEGORIA.altro;
}

export function etichettaCategoriaMoto(
  categoriaEsplicita: string | null | undefined,
  testoModello: string | null | undefined,
): string {
  const cat = risolviCategoriaMoto(categoriaEsplicita, testoModello);
  return etichettaCategoria(cat) ?? 'Moto';
}
