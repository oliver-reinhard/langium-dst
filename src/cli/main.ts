import chalk from 'chalk';
import { Command } from 'commander';
import type { Model } from '../language/generated/ast.js';
import { DomainStorytellingLanguageMetaData } from '../language/generated/module.js';
import { extractAstNode } from './cli-util.js';
import { createDomainStorytellingServices } from '../language/domain-storytelling-module.js';
import { extractDocument } from './cli-util.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { generateJSONfromAST } from './JSON-generator.js';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export default function(): void {
    const cmd = new Command();
    cmd.version(JSON.parse(packageContent).version);
    cmd
        .command('parseAndValidate')
        .argument('<file>', 'Source file to parse & validate (ending in ${fileExtensions})')
        .description('Indicates where a program parses & validates successfully, but produces no output code')
        .action(parseAndValidate) // we'll need to implement this function

    const fileExtensions = DomainStorytellingLanguageMetaData.fileExtensions.join(', ');
    cmd
        .command('generateJSON')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates a JSON file representing the AST')
        .action(generateJSONAction);

    cmd.parse(process.argv);
}

/**
 * Parse and validate a program written in the DomainStorytelling language.
 * Verifies that no lexer or parser errors occur.
 * Implicitly also checks for validation errors while extracting the document
 *
 * @param fileName Program to validate
 */
export const parseAndValidate = async (fileName: string): Promise<void> => {
    // retrieve the services for our language
    const services = createDomainStorytellingServices(NodeFileSystem).dst;
    // extract a document for our program
    const document = await extractDocument(fileName, services);
    // extract the parse result details
    const parseResult = document.parseResult;
    // verify no lexer, parser, or general diagnostic errors show up
    if (parseResult.lexerErrors.length === 0 && 
        parseResult.parserErrors.length === 0
    ) {
        console.log(chalk.green(`Parsed and validated ${fileName} successfully!`));
    } else {
        console.log(chalk.red(`Failed to parse and validate ${fileName}!`));
    }
}

export const generateJSONAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createDomainStorytellingServices(NodeFileSystem).dst;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateJSONfromAST(model, fileName, opts.destination);
    console.log(chalk.green(`Serialised AST as JSON successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}