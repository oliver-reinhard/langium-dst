import { GeneratorContext, LangiumDiagramGenerator, LangiumSprottyServices } from 'langium-sprotty';
import { SModelRoot } from 'sprotty-protocol';

export class DSTDiagramGenerator extends LangiumDiagramGenerator {

    constructor(services: LangiumSprottyServices) { 
        super(services)
    }

    protected override generateRoot(args: GeneratorContext): SModelRoot | Promise<SModelRoot> {
        throw new Error('Method not implemented.');
    }
}