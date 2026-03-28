import { defineSiteIntegration } from '../catalogTypes';
import { dmmChara } from './chara';
import { dmmSubject } from './subject';
import { dmmCharaTools, dmmTools } from './tools';

export const dmmIntegration = defineSiteIntegration({
  site: dmmSubject,
  tools: dmmTools,
  charas: [
    {
      model: dmmChara,
      tools: dmmCharaTools,
    },
  ],
});

