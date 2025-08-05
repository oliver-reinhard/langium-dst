import type { Model } from '../language/generated/ast.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';
import { createDomainStorytellingServices } from '../language/domain-storytelling-module.js';
import { NodeFileSystem } from 'langium/node';

export function generateJSONfromAST(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.json`;
    const services = createDomainStorytellingServices(NodeFileSystem).DomainStorytelling;

    const serializedAst = services.serializer.JsonSerializer.serialize(model, { sourceText: true, textRegions: true });
   
    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
   fs.writeFileSync(generatedFilePath, serializedAst);
   return generatedFilePath;
}
