import { getchuGameModel }  from './getchuGame'
import { amazonSubjectModel } from "./amazonJpBook";
import { erogamescapeModel} from "./erogamescape";

export const configs =  {
    [getchuGameModel.key]: getchuGameModel,
    [erogamescapeModel.key]: erogamescapeModel,
    [amazonSubjectModel.key]: amazonSubjectModel,
}
