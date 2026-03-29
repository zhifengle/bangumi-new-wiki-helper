import { defineSiteIntegration } from '../catalogTypes';
import { getchuChara } from './chara';
import { getchuSubject } from './subject';
import { getchuCharaTools, getchuSubjectTools } from './tools';

export const getchuIntegration = defineSiteIntegration({
  site: getchuSubject,
  tools: getchuSubjectTools,
  characters: [
    {
      model: getchuChara,
      tools: getchuCharaTools,
    },
  ],
});

